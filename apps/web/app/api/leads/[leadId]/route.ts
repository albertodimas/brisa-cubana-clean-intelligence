import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const API_URL =
  process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { leadId: string } },
) {
  const leadId = params.leadId;

  if (!leadId) {
    return NextResponse.json(
      { error: "Identificador de lead requerido" },
      { status: 400 },
    );
  }

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

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Solicitud inválida. Envía un cuerpo JSON." },
      { status: 400 },
    );
  }

  try {
    const res = await fetch(`${API_URL}/api/leads/${leadId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify(payload),
      cache: "no-store",
      credentials: "include",
    });

    const contentType = res.headers.get("content-type") ?? "";
    const isJson = contentType.includes("application/json");
    const raw = await res.text();
    const parsed = isJson ? JSON.parse(raw) : raw;

    if (!res.ok) {
      const message =
        (typeof parsed === "object" && parsed && "error" in parsed
          ? (parsed as { error?: string }).error
          : null) ?? "No se pudo actualizar el lead";

      return NextResponse.json({ error: message }, { status: res.status });
    }

    return NextResponse.json(parsed, { status: res.status });
  } catch (error) {
    console.error("[web] lead update proxy error", error);
    return NextResponse.json(
      { error: "Servicio no disponible" },
      { status: 503 },
    );
  }
}
