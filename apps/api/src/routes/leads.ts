import { Hono } from "hono";
import { z } from "zod";
import { getLeadRepository } from "../container.js";
import { authenticate, requireRoles } from "../middleware/auth.js";

const router = new Hono();

const createLeadSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().optional(),
  company: z.string().optional(),
  propertyCount: z.string().optional(),
  serviceInterest: z.string().optional(),
  planCode: z.string().max(64).optional(),
  notes: z.string().optional(),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
  utm_content: z.string().optional(),
  utm_term: z.string().optional(),
});

// Public endpoint - no authentication required
router.post("/", async (c) => {
  const body = await c.req.json();
  const validation = createLeadSchema.safeParse(body);

  if (!validation.success) {
    return c.json(
      { error: "Invalid data", details: validation.error.issues },
      400,
    );
  }

  const { data } = validation;

  try {
    const repository = getLeadRepository();
    const lead = await repository.create({
      name: data.name,
      email: data.email,
      phone: data.phone,
      company: data.company,
      propertyCount: data.propertyCount,
      serviceInterest: data.serviceInterest,
      planCode: data.planCode,
      notes: data.notes,
      utmSource: data.utm_source,
      utmMedium: data.utm_medium,
      utmCampaign: data.utm_campaign,
      utmContent: data.utm_content,
      utmTerm: data.utm_term,
    });

    // Optional: Send Slack notification
    const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (slackWebhookUrl) {
      const utmLines = [
        data.utm_source ? `*UTM Source*: ${data.utm_source}` : null,
        data.utm_medium ? `*UTM Medium*: ${data.utm_medium}` : null,
        data.utm_campaign ? `*Campaña*: ${data.utm_campaign}` : null,
        data.utm_content ? `*Contenido*: ${data.utm_content}` : null,
        data.utm_term ? `*Term*: ${data.utm_term}` : null,
      ]
        .filter(Boolean)
        .join("\n");

      const textLines = [
        "📥 *Nuevo lead recibido*",
        `*Nombre*: ${data.name}`,
        `*Email*: ${data.email}`,
        data.phone ? `*Teléfono*: ${data.phone}` : null,
        data.serviceInterest ? `*Servicio*: ${data.serviceInterest}` : null,
        data.planCode ? `*Plan*: ${data.planCode}` : null,
        data.propertyCount ? `*Unidades*: ${data.propertyCount}` : null,
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
                    text: `📅 ${new Date().toLocaleString()} | ID: ${lead.id}`,
                  },
                ],
              },
            ],
          }),
        });
      } catch (error) {
        console.error("[lead slack webhook] error", error);
        // Don't fail the request if Slack notification fails
      }
    }

    return c.json({ ok: true, leadId: lead.id }, 201);
  } catch (error) {
    console.error("[leads] create error", error);
    return c.json({ error: "Failed to create lead" }, 500);
  }
});

// Admin endpoint - list all leads
router.get(
  "/",
  authenticate,
  requireRoles(["ADMIN", "COORDINATOR"]),
  async (c) => {
    const repository = getLeadRepository();
    const leads = await repository.findMany();
    return c.json({ data: leads });
  },
);

export default router;
