import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const API_URL =
  process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "";
const FALLBACK_EMAIL =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL ??
  "operaciones@brisacubanacleanintelligence.com";

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Solicitud inválida. Envía un cuerpo JSON." },
      { status: 400 },
    );
  }

  if (!API_URL) {
    return NextResponse.json(
      {
        error: `No hay backend disponible para registrar la solicitud. Escríbenos a ${FALLBACK_EMAIL} o agenda por WhatsApp.`,
      },
      { status: 503 },
    );
  }

  try {
    const response = await fetch(`${API_URL}/api/leads`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const contentType = response.headers.get("content-type") ?? "";
    const isJson = contentType.includes("application/json");
    const rawBody = await response.text();
    const parsedBody = isJson ? JSON.parse(rawBody) : rawBody;

    if (!response.ok) {
      const message =
        (typeof parsedBody === "object" && parsedBody && "error" in parsedBody
          ? (parsedBody as { error?: string }).error
          : null) ?? "No pudimos registrar tu solicitud.";

      return NextResponse.json(
        {
          error: `${message} Escríbenos a ${FALLBACK_EMAIL} o agenda por WhatsApp.`,
        },
        { status: response.status },
      );
    }

    return NextResponse.json(parsedBody, { status: response.status });
  } catch (error) {
    console.error("[web] lead proxy error", error);
    return NextResponse.json(
      {
        error: `No pudimos registrar tu solicitud. Escríbenos a ${FALLBACK_EMAIL} o agenda por WhatsApp.`,
      },
      { status: 503 },
    );
  }
}

export async function GET(_request: NextRequest) {
  if (!API_URL) {
    return NextResponse.json(
      { error: "API interna no configurada" },
      { status: 503 },
    );
  }

  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const res = await fetch(`${API_URL}/api/leads`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
      cache: "no-store",
      credentials: "include",
    });

    if (!res.ok) {
      const message =
        ((await res.json().catch(() => ({}))) as { error?: string }).error ??
        "No se pudo obtener la lista de leads";

      return NextResponse.json({ error: message }, { status: res.status });
    }

    const body = await res.json();
    return NextResponse.json(body, { status: res.status });
  } catch (error) {
    console.error("[web] lead list proxy error", error);
    return NextResponse.json(
      { error: "Servicio no disponible" },
      { status: 503 },
    );
  }
}
