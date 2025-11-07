import { NextRequest, NextResponse } from "next/server";
import { renderToStream } from "@react-pdf/renderer";
import { BookingReceipt } from "@/components/pdf/booking-receipt";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

// Rate limiting simple (en memoria - producción usar Redis)
const pdfDownloads = new Map<string, { count: number; resetAt: number }>();

export const runtime = "nodejs";

function checkRateLimit(email: string): {
  allowed: boolean;
  remaining: number;
} {
  const now = Date.now();
  const key = email;
  const limit = 10; // 10 PDFs por minuto
  const windowMs = 60 * 1000; // 1 minuto

  const record = pdfDownloads.get(key);

  if (!record || now > record.resetAt) {
    pdfDownloads.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (record.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  record.count++;
  return { allowed: true, remaining: limit - record.count };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> },
) {
  try {
    const { bookingId } = await params;

    // Obtener token del portal desde cookies
    const cookieHeader = request.headers.get("cookie") || "";
    const tokenMatch =
      cookieHeader.match(/portal_token=([^;]+)/) ??
      cookieHeader.match(/portal-token=([^;]+)/);
    const token = tokenMatch ? tokenMatch[1] : null;

    if (!token) {
      return NextResponse.json(
        { error: "No autorizado. Token de portal requerido." },
        { status: 401 },
      );
    }

    // Verificar token y obtener booking
    const bookingResponse = await fetch(
      `${API_URL}/api/portal/bookings/${bookingId}`,
      {
        headers: {
          Cookie: `portal_token=${token}`,
        },
      },
    );

    if (!bookingResponse.ok) {
      if (bookingResponse.status === 401) {
        return NextResponse.json(
          { error: "Sesión expirada o inválida" },
          { status: 401 },
        );
      }
      if (bookingResponse.status === 404) {
        return NextResponse.json(
          { error: "Reserva no encontrada" },
          { status: 404 },
        );
      }
      return NextResponse.json(
        { error: "Error al obtener la reserva" },
        { status: bookingResponse.status },
      );
    }

    const data = await bookingResponse.json();
    const booking = data.data;
    const customer = data.customer;

    // Rate limiting por email del cliente
    const rateLimitCheck = checkRateLimit(customer.email);
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        {
          error:
            "Límite de descargas excedido. Por favor intenta nuevamente en unos minutos.",
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": "10",
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": new Date(Date.now() + 60000).toISOString(),
          },
        },
      );
    }

    // Generar PDF
    const generatedAt = new Date().toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const stream = await renderToStream(
      <BookingReceipt booking={booking} generatedAt={generatedAt} />,
    );

    // Convertir stream a buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of stream as any) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // Filename descriptivo
    const filename = `comprobante-${booking.code}-${bookingId.slice(0, 8)}.pdf`;

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "X-RateLimit-Limit": "10",
        "X-RateLimit-Remaining": rateLimitCheck.remaining.toString(),
      },
    });
  } catch (error) {
    console.error("[portal/pdf] Error generating PDF:", error);
    return NextResponse.json(
      { error: "Error al generar el comprobante" },
      { status: 500 },
    );
  }
}
