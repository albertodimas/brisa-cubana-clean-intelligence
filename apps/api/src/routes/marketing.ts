import { Hono } from "hono";
import { z } from "zod";
import { authenticate, requireRoles } from "../middleware/auth.js";
import { validateRequest } from "../lib/validation.js";
import { isParseFailure } from "../lib/parse-result.js";
import { handlePrismaError } from "../lib/prisma-error-handler.js";
import { prisma } from "../lib/prisma.js";

const router = new Hono();

// ========== PORTFOLIO STATS ==========
router.get("/stats/portfolio", async (c) => {
  const stats = await prisma.portfolioStats.findFirst({
    orderBy: { createdAt: "desc" },
  });

  if (!stats) {
    return c.json(
      {
        data: {
          activeProperties: 0,
          averageRating: "0.00",
          totalTurnovers: 0,
          period: "N/A",
        },
      },
      200,
    );
  }

  return c.json({
    data: {
      activeProperties: stats.activeProperties,
      averageRating: stats.averageRating.toString(),
      totalTurnovers: stats.totalTurnovers,
      period: stats.period,
      lastUpdated: stats.createdAt.toISOString(),
    },
  });
});

const portfolioStatsSchema = z.object({
  activeProperties: z.number().int().positive(),
  averageRating: z.number().min(0).max(5),
  totalTurnovers: z.number().int().nonnegative(),
  period: z.string().min(1),
});

router.post(
  "/stats/portfolio",
  authenticate,
  requireRoles(["ADMIN"]),
  async (c) => {
    const validation = validateRequest(
      portfolioStatsSchema,
      await c.req.json(),
      c,
    );
    if (isParseFailure(validation)) {
      return validation.response;
    }

    const stats = await prisma.portfolioStats.create({
      data: validation.data,
    });

    return c.json({
      data: {
        activeProperties: stats.activeProperties,
        averageRating: stats.averageRating.toString(),
        totalTurnovers: stats.totalTurnovers,
        period: stats.period,
        lastUpdated: stats.createdAt.toISOString(),
      },
    });
  },
);

// ========== TESTIMONIALS ==========
router.get("/testimonials", async (c) => {
  const showAll = c.req.query("showAll") === "true";

  const whereClause = showAll
    ? {} // Admin: mostrar todos
    : { status: "APPROVED" as const, isActive: true }; // Público: solo aprobados

  const testimonials = await prisma.testimonial.findMany({
    where: whereClause,
    orderBy: { order: "asc" },
  });

  return c.json({
    data: testimonials.map((t) => ({
      id: t.id,
      author: t.author,
      role: t.role,
      quote: t.quote,
      status: t.status,
      order: t.order,
      isActive: t.isActive,
    })),
  });
});

const testimonialSchema = z.object({
  author: z.string().min(2),
  role: z.string().min(2),
  quote: z.string().min(10),
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).default("PENDING"),
  order: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

router.post(
  "/testimonials",
  authenticate,
  requireRoles(["ADMIN", "COORDINATOR"]),
  async (c) => {
    const validation = validateRequest(
      testimonialSchema,
      await c.req.json(),
      c,
    );
    if (isParseFailure(validation)) {
      return validation.response;
    }

    const testimonial = await prisma.testimonial.create({
      data: validation.data,
    });

    return c.json({ data: testimonial }, 201);
  },
);

router.patch(
  "/testimonials/:id",
  authenticate,
  requireRoles(["ADMIN", "COORDINATOR"]),
  async (c) => {
    const id = c.req.param("id");
    const validation = validateRequest(
      testimonialSchema.partial(),
      await c.req.json(),
      c,
    );
    if (isParseFailure(validation)) {
      return validation.response;
    }

    try {
      const testimonial = await prisma.testimonial.update({
        where: { id },
        data: validation.data,
      });
      return c.json({ data: testimonial });
    } catch (error) {
      return handlePrismaError(c, error, {
        notFound: "Testimonio no encontrado",
        default: "No se pudo actualizar el testimonio",
      });
    }
  },
);

router.delete(
  "/testimonials/:id",
  authenticate,
  requireRoles(["ADMIN"]),
  async (c) => {
    const id = c.req.param("id");

    try {
      await prisma.testimonial.delete({ where: { id } });
      return c.json({ message: "Testimonio eliminado exitosamente" });
    } catch (error) {
      return handlePrismaError(c, error, {
        notFound: "Testimonio no encontrado",
        default: "No se pudo eliminar el testimonio",
      });
    }
  },
);

// ========== FAQS ==========
router.get("/faqs", async (c) => {
  const showAll = c.req.query("showAll") === "true";

  const whereClause = showAll
    ? {} // Admin: mostrar todos
    : { isActive: true }; // Público: solo activos

  const faqs = await prisma.fAQ.findMany({
    where: whereClause,
    orderBy: { order: "asc" },
  });

  return c.json({
    data: faqs.map((f) => ({
      id: f.id,
      question: f.question,
      answer: f.answer,
      order: f.order,
      isActive: f.isActive,
    })),
  });
});

const faqSchema = z.object({
  question: z.string().min(5),
  answer: z.string().min(10),
  order: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

router.post("/faqs", authenticate, requireRoles(["ADMIN"]), async (c) => {
  const validation = validateRequest(faqSchema, await c.req.json(), c);
  if (isParseFailure(validation)) {
    return validation.response;
  }

  const faq = await prisma.fAQ.create({
    data: validation.data,
  });

  return c.json({ data: faq }, 201);
});

router.patch("/faqs/:id", authenticate, requireRoles(["ADMIN"]), async (c) => {
  const id = c.req.param("id");
  const validation = validateRequest(
    faqSchema.partial(),
    await c.req.json(),
    c,
  );
  if (isParseFailure(validation)) {
    return validation.response;
  }

  try {
    const faq = await prisma.fAQ.update({
      where: { id },
      data: validation.data,
    });
    return c.json({ data: faq });
  } catch (error) {
    return handlePrismaError(c, error, {
      notFound: "FAQ no encontrado",
      default: "No se pudo actualizar el FAQ",
    });
  }
});

router.delete("/faqs/:id", authenticate, requireRoles(["ADMIN"]), async (c) => {
  const id = c.req.param("id");

  try {
    await prisma.fAQ.delete({ where: { id } });
    return c.json({ message: "FAQ eliminado exitosamente" });
  } catch (error) {
    return handlePrismaError(c, error, {
      notFound: "FAQ no encontrado",
      default: "No se pudo eliminar el FAQ",
    });
  }
});

// ========== PRICING TIERS ==========
router.get("/pricing", async (c) => {
  const showAll = c.req.query("showAll") === "true";

  const whereClause = showAll
    ? {} // Admin: mostrar todos
    : { isActive: true }; // Público: solo activos

  const tiers = await prisma.pricingTier.findMany({
    where: whereClause,
    orderBy: { order: "asc" },
  });

  return c.json({
    data: tiers.map((t) => ({
      id: t.id,
      tierCode: t.tierCode,
      name: t.name,
      headline: t.headline,
      description: t.description,
      price: t.price,
      priceSuffix: t.priceSuffix,
      features: t.features,
      addons: t.addons,
      highlighted: t.highlighted,
      order: t.order,
      isActive: t.isActive,
    })),
  });
});

const pricingTierSchema = z.object({
  tierCode: z.string().min(1),
  name: z.string().min(2),
  headline: z.string().min(1),
  description: z.string().optional(),
  price: z.string().min(1),
  priceSuffix: z.string().optional(),
  features: z.array(z.unknown()),
  addons: z.array(z.unknown()).optional(),
  highlighted: z.boolean().default(false),
  order: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

router.post("/pricing", authenticate, requireRoles(["ADMIN"]), async (c) => {
  const validation = validateRequest(pricingTierSchema, await c.req.json(), c);
  if (isParseFailure(validation)) {
    return validation.response;
  }

  try {
    const tier = await prisma.pricingTier.create({
      data: validation.data,
    });
    return c.json({ data: tier }, 201);
  } catch (error) {
    return handlePrismaError(c, error, {
      conflict: "El código de tier ya existe",
      default: "No se pudo crear el pricing tier",
    });
  }
});

router.patch(
  "/pricing/:id",
  authenticate,
  requireRoles(["ADMIN"]),
  async (c) => {
    const id = c.req.param("id");
    const validation = validateRequest(
      pricingTierSchema.partial(),
      await c.req.json(),
      c,
    );
    if (isParseFailure(validation)) {
      return validation.response;
    }

    try {
      const tier = await prisma.pricingTier.update({
        where: { id },
        data: validation.data,
      });
      return c.json({ data: tier });
    } catch (error) {
      return handlePrismaError(c, error, {
        notFound: "Pricing tier no encontrado",
        conflict: "El código de tier ya existe",
        default: "No se pudo actualizar el pricing tier",
      });
    }
  },
);

router.delete(
  "/pricing/:id",
  authenticate,
  requireRoles(["ADMIN"]),
  async (c) => {
    const id = c.req.param("id");

    try {
      await prisma.pricingTier.delete({ where: { id } });
      return c.json({ message: "Pricing tier eliminado exitosamente" });
    } catch (error) {
      return handlePrismaError(c, error, {
        notFound: "Pricing tier no encontrado",
        default: "No se pudo eliminar el pricing tier",
      });
    }
  },
);

// ========== MARKET STATS ==========
router.get("/stats/market", async (c) => {
  const stats = await prisma.marketStat.findMany({
    orderBy: { metricId: "asc" },
  });

  return c.json({
    data: stats.map((s) => ({
      metricId: s.metricId,
      label: s.label,
      value: Number(s.value),
      valueMax: s.valueMax ? Number(s.valueMax) : undefined,
      source: s.source,
      sourceUrl: s.sourceUrl,
      period: s.period,
      notes: s.notes,
      presentation: s.presentation,
      lastUpdated: s.lastUpdated.toISOString(),
    })),
  });
});

const marketStatSchema = z.object({
  metricId: z.string().min(1),
  label: z.string().min(1),
  value: z.number(),
  valueMax: z.number().optional(),
  source: z.string().min(1),
  sourceUrl: z.string().url().optional(),
  period: z.string().optional(),
  notes: z.string().optional(),
  presentation: z.object({
    format: z.enum(["single", "range"]).optional(),
    decimals: z.number().int().optional(),
    prefix: z.string().optional(),
    suffix: z.string().optional(),
  }),
  lastUpdated: z.string().datetime(),
});

router.post(
  "/stats/market",
  authenticate,
  requireRoles(["ADMIN"]),
  async (c) => {
    const validation = validateRequest(marketStatSchema, await c.req.json(), c);
    if (isParseFailure(validation)) {
      return validation.response;
    }

    try {
      const stat = await prisma.marketStat.upsert({
        where: { metricId: validation.data.metricId },
        update: {
          ...validation.data,
          lastUpdated: new Date(validation.data.lastUpdated),
        },
        create: {
          ...validation.data,
          lastUpdated: new Date(validation.data.lastUpdated),
        },
      });
      return c.json({ data: stat }, 201);
    } catch (error) {
      return handlePrismaError(c, error, {
        default: "No se pudo crear/actualizar el market stat",
      });
    }
  },
);

export default router;
