import { NextResponse } from "next/server";

type LeadRequest = {
  name?: string;
  email?: string;
  company?: string;
  propertyCount?: string;
  notes?: string;
};

function sanitize(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  let body: LeadRequest;

  try {
    body = (await request.json()) as LeadRequest;
  } catch {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  const payload = {
    name: sanitize(body.name),
    email: sanitize(body.email),
    company: sanitize(body.company),
    propertyCount: sanitize(body.propertyCount),
    notes: sanitize(body.notes),
    submittedAt: new Date().toISOString(),
  };

  if (!payload.name || !payload.email || !payload.propertyCount) {
    return NextResponse.json(
      { error: "Completa los campos obligatorios." },
      { status: 400 },
    );
  }

  const webhookUrl = process.env.LEAD_WEBHOOK_URL;

  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "landing_lead",
          payload,
        }),
      });
    } catch (error) {
      console.error("[lead webhook] error", error);
      // do not fail silently: surface to caller
      return NextResponse.json(
        { error: "No se pudo notificar el webhook configurado." },
        { status: 502 },
      );
    }
  } else {
    console.info("[lead] capturado sin webhook", payload);
  }

  return NextResponse.json({ ok: true });
}
