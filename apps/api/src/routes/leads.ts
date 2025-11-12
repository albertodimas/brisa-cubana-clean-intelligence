import { LeadStatus } from "@prisma/client";
import { Hono } from "hono";
import { z } from "zod";
import { getLeadRepository } from "../container.js";
import { authenticate, requireRoles } from "../middleware/auth.js";

const router = new Hono();

const TEST_EMAIL_PATTERNS = [/qa\+/i, /\+qa/i, /test\+/i, /\+test/i];

function normalize(str: string | undefined | null) {
  return str?.toLowerCase().trim() ?? "";
}

function isTestLead(data: { email: string; notes?: string | null }) {
  const email = normalize(data.email);
  const notes = normalize(data.notes);
  const matchesTestEmail = TEST_EMAIL_PATTERNS.some((pattern) =>
    pattern.test(email),
  );
  const mentionsTestInNotes =
    notes.includes("qa test") ||
    notes.includes("prueba automática") ||
    notes.includes("test lead") ||
    notes.includes("ignore response");

  return matchesTestEmail || mentionsTestInNotes;
}

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

const updateLeadSchema = z
  .object({
    name: z.string().min(1).optional(),
    email: z.string().email("Invalid email").optional(),
    phone: z.string().nullable().optional(),
    company: z.string().nullable().optional(),
    propertyCount: z.string().nullable().optional(),
    serviceInterest: z.string().nullable().optional(),
    planCode: z.string().max(64).nullable().optional(),
    notes: z.string().max(2000).nullable().optional(),
    status: z.nativeEnum(LeadStatus).optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    "Proporciona al menos un campo para actualizar",
  );

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
    const markAsLost = isTestLead({ email: data.email, notes: data.notes });
    const lead = await repository.create({
      name: data.name,
      email: data.email,
      phone: data.phone,
      company: data.company,
      propertyCount: data.propertyCount,
      serviceInterest: data.serviceInterest,
      planCode: data.planCode,
      notes: data.notes,
      status: markAsLost ? LeadStatus.LOST : undefined,
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

router.patch(
  "/:leadId",
  authenticate,
  requireRoles(["ADMIN", "COORDINATOR"]),
  async (c) => {
    const leadId = c.req.param("leadId");
    if (!leadId) {
      return c.json({ error: "Lead ID requerido" }, 400);
    }

    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json(
        { error: "Solicitud inválida. Envía un cuerpo JSON." },
        400,
      );
    }

    const validation = updateLeadSchema.safeParse(body);
    if (!validation.success) {
      return c.json(
        { error: "Datos inválidos", details: validation.error.issues },
        400,
      );
    }

    const repository = getLeadRepository();
    const existing = await repository.findById(leadId);
    if (!existing) {
      return c.json({ error: "Lead no encontrado" }, 404);
    }

    const payload = validation.data;

    try {
      const updated = await repository.update(leadId, {
        name: payload.name ?? undefined,
        email: payload.email ?? undefined,
        phone:
          payload.phone === undefined
            ? undefined
            : payload.phone && payload.phone.trim()
              ? payload.phone
              : null,
        company:
          payload.company === undefined
            ? undefined
            : payload.company && payload.company.trim()
              ? payload.company
              : null,
        propertyCount:
          payload.propertyCount === undefined
            ? undefined
            : payload.propertyCount && payload.propertyCount.trim()
              ? payload.propertyCount
              : null,
        serviceInterest:
          payload.serviceInterest === undefined
            ? undefined
            : payload.serviceInterest && payload.serviceInterest.trim()
              ? payload.serviceInterest
              : null,
        planCode:
          payload.planCode === undefined
            ? undefined
            : payload.planCode && payload.planCode.trim()
              ? payload.planCode
              : null,
        notes:
          payload.notes === undefined
            ? undefined
            : payload.notes && payload.notes.trim()
              ? payload.notes
              : null,
        status: payload.status ?? undefined,
      });

      return c.json({ data: updated });
    } catch (error) {
      console.error("[leads] update error", error);
      return c.json({ error: "No se pudo actualizar el lead" }, 500);
    }
  },
);

export default router;
