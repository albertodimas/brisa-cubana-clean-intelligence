import { NextResponse } from "next/server";

type LeadRequest = {
  name?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  company?: string;
  propertyCount?: string;
  serviceInterest?: string;
  notes?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
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
    name: sanitize(body.fullName) || sanitize(body.name),
    email: sanitize(body.email),
    phone: sanitize(body.phone),
    company: sanitize(body.company),
    propertyCount: sanitize(body.propertyCount),
    serviceInterest: sanitize(body.serviceInterest),
    notes: sanitize(body.notes),
    utm: {
      source: sanitize(body.utm_source),
      medium: sanitize(body.utm_medium),
      campaign: sanitize(body.utm_campaign),
      content: sanitize(body.utm_content),
      term: sanitize(body.utm_term),
    },
    submittedAt: new Date().toISOString(),
  };

  if (!payload.name || !payload.email) {
    return NextResponse.json(
      { error: "Completa los campos obligatorios." },
      { status: 400 },
    );
  }

  const webhookUrl = process.env.LEAD_WEBHOOK_URL;
  const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;

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

  if (slackWebhookUrl) {
    const utmLines = [
      payload.utm.source ? `*UTM Source*: ${payload.utm.source}` : null,
      payload.utm.medium ? `*UTM Medium*: ${payload.utm.medium}` : null,
      payload.utm.campaign ? `*Campaña*: ${payload.utm.campaign}` : null,
      payload.utm.content ? `*Contenido*: ${payload.utm.content}` : null,
      payload.utm.term ? `*Term*: ${payload.utm.term}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const textLines = [
      "📥 *Nuevo lead recibido*",
      `*Nombre*: ${payload.name}`,
      `*Email*: ${payload.email}`,
      payload.phone ? `*Teléfono*: ${payload.phone}` : null,
      payload.serviceInterest ? `*Servicio*: ${payload.serviceInterest}` : null,
      payload.propertyCount ? `*Unidades*: ${payload.propertyCount}` : null,
      utmLines || null,
    ].filter(Boolean);

    try {
      await fetch(slackWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: textLines.join("\n"),
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: textLines.join("\n"),
              },
            },
            {
              type: "context",
              elements: [
                {
                  type: "mrkdwn",
                  text: `📅 ${new Date().toLocaleString()}`,
                },
              ],
            },
          ],
        }),
      });
    } catch (error) {
      console.error("[lead slack webhook] error", error);
    }
  }

  return NextResponse.json({ ok: true });
}
