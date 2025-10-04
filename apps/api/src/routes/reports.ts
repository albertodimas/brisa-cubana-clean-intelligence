import { Hono } from "hono";
import { db } from "../lib/db";
import { getAuthUser, requireAuth } from "../middleware/auth";
import { rateLimiter, RateLimits } from "../middleware/rate-limit";
import { sendCleanScoreReport, calculateCleanScore } from "../services/reports";
import { logger } from "../lib/logger";
import { z } from "zod";
import type { Prisma } from "../generated/prisma";

const reports = new Hono();

// Apply rate limiting
reports.use("/", rateLimiter(RateLimits.read));

type ChecklistStatus = "PASS" | "WARN" | "FAIL";

interface NormalizedChecklistItem {
  area: string;
  status: ChecklistStatus;
  notes?: string;
}

interface PhotoEntry {
  url: string;
  caption: string;
  category: "before" | "after";
}

interface EvidenceContext {
  checklist: NormalizedChecklistItem[];
  images: string[];
  videos: string[];
}

const CHECKLIST_STATUS_SET: Record<ChecklistStatus, true> = {
  PASS: true,
  WARN: true,
  FAIL: true,
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeMediaList(values?: string[]): string[] {
  if (!values) {
    return [];
  }

  return values
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value) && value.length >= 5);
}

function normalizeChecklist(
  items?: {
    area: string;
    status?: string | null;
    notes?: string | null;
  }[],
): NormalizedChecklistItem[] {
  if (!items) {
    return [];
  }

  return items
    .map((item) => {
      const rawStatus = (item.status ?? "PASS").toUpperCase();
      const status: ChecklistStatus = CHECKLIST_STATUS_SET[
        rawStatus as ChecklistStatus
      ]
        ? (rawStatus as ChecklistStatus)
        : "PASS";

      const trimmedNotes = item.notes?.trim();
      return {
        area: item.area.trim(),
        status,
        notes:
          trimmedNotes && trimmedNotes.length > 0 ? trimmedNotes : undefined,
      } satisfies NormalizedChecklistItem;
    })
    .filter((item) => item.area.length > 0);
}

function deriveCompletionStats(checklist: NormalizedChecklistItem[]) {
  if (checklist.length === 0) {
    return {
      passCount: 0,
      warnCount: 0,
      failCount: 0,
      ratio: 1,
    };
  }

  const passCount = checklist.filter((item) => item.status === "PASS").length;
  const warnCount = checklist.filter((item) => item.status === "WARN").length;
  const failCount = checklist.filter((item) => item.status === "FAIL").length;
  const ratio =
    (passCount + warnCount * 0.5) / (passCount + warnCount + failCount);

  return {
    passCount,
    warnCount,
    failCount,
    ratio,
  };
}

function deriveMetricsFromEvidence(
  context: EvidenceContext,
): GenerateReportMetrics {
  const { checklist, images, videos } = context;
  const stats = deriveCompletionStats(checklist);
  const photoSignal = clamp(images.length / 3, 0, 1);
  const videoSignal = videos.length > 0 ? 1 : 0;

  const hasArea = (match: string) =>
    checklist.some((item) => item.area.toLowerCase().includes(match));

  const base = (min: number, max: number) =>
    clamp(min + stats.ratio * (max - min), min, max);

  const generalCleanliness = base(3.6, 5);
  const kitchen = clamp(base(3.4, 4.9) + (hasArea("cocina") ? 0.1 : 0), 0, 5);
  const bathrooms = clamp(base(3.4, 4.9) + (hasArea("ba") ? 0.1 : 0), 0, 5);
  const premiumDetails = clamp(3 + photoSignal * 1.5 + videoSignal * 0.5, 0, 5);
  const ambiance = clamp(3.2 + stats.ratio * 1.2 + photoSignal * 0.3, 0, 5);
  const timeCompliance = clamp(4.2 + stats.ratio * 0.8, 0, 5);

  return {
    generalCleanliness,
    kitchen,
    bathrooms,
    premiumDetails,
    ambiance,
    timeCompliance,
  } satisfies GenerateReportMetrics;
}

function deriveBonus(context: EvidenceContext): number {
  const stats = deriveCompletionStats(context.checklist);
  const checklistBonus = Math.round(clamp(stats.ratio, 0, 1) * 5); // 0-5
  const mediaBonus = Math.min(5, context.images.length * 1.5);
  const videoBonus = context.videos.length > 0 ? 5 : 0;
  return Math.min(15, checklistBonus + mediaBonus + videoBonus);
}

interface GenerateReportMetrics {
  generalCleanliness: number;
  kitchen: number;
  bathrooms: number;
  premiumDetails: number;
  ambiance: number;
  timeCompliance: number;
}

function buildPhotoEntries(
  photos?: {
    url: string;
    caption?: string;
    category?: "before" | "after";
  }[],
  images?: string[],
): PhotoEntry[] {
  const normalizedExisting: PhotoEntry[] = (photos ?? [])
    .map((photo, index) => ({
      url: photo.url,
      caption: photo.caption ?? `Evidencia ${index + 1}`,
      category: photo.category ?? "after",
    }))
    .filter((photo): photo is PhotoEntry => Boolean(photo.url));

  const normalizedImages: PhotoEntry[] = (images ?? []).map((url, index) => ({
    url,
    caption: `Evidencia ${normalizedExisting.length + index + 1}`,
    category: "after",
  }));

  return [...normalizedExisting, ...normalizedImages];
}

function deriveRecommendations(
  checklist: NormalizedChecklistItem[],
  provided?: string[],
): string[] {
  if (provided && provided.length > 0) {
    return provided;
  }

  const fails = checklist.filter((item) => item.status === "FAIL");
  const warns = checklist.filter((item) => item.status === "WARN");

  if (fails.length > 0) {
    return fails.map(
      (item) =>
        `Programar rework para ${item.area.toLowerCase()} en las próximas 24h.`,
    );
  }

  if (warns.length > 0) {
    return [
      `Monitorear ${warns
        .map((item) => item.area.toLowerCase())
        .join(", ")} en la siguiente visita.`,
    ];
  }

  return [
    "Excelente ejecución del servicio. Recomendar mantenimiento preventivo y enviar agradecimiento al cliente.",
  ];
}

function parseMetricsJson(value: unknown): GenerateReportMetrics {
  const result = metricsSchema.safeParse(value ?? {});
  if (result.success) {
    return result.data;
  }
  return {
    generalCleanliness: 3.5,
    kitchen: 3.5,
    bathrooms: 3.5,
    premiumDetails: 3.5,
    ambiance: 3.5,
    timeCompliance: 3.5,
  };
}

function coercePhotoEntries(value: unknown): PhotoEntry[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item, index) => {
      if (!item || typeof item !== "object") {
        return null;
      }
      const record = item as Record<string, unknown>;
      const url = typeof record.url === "string" ? record.url : "";
      if (!url) {
        return null;
      }
      const caption =
        typeof record.caption === "string"
          ? record.caption
          : `Evidencia ${index + 1}`;
      const rawCategory =
        typeof record.category === "string"
          ? (record.category.toLowerCase() as "before" | "after")
          : "after";
      const category: "before" | "after" =
        rawCategory === "before" ? "before" : "after";
      return { url, caption, category } satisfies PhotoEntry;
    })
    .filter((item): item is PhotoEntry => Boolean(item));
}

function coerceChecklistEntries(value: unknown): NormalizedChecklistItem[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const mapped = value.map((item) => {
    if (!item || typeof item !== "object") {
      return { area: "", status: "PASS", notes: undefined };
    }
    const record = item as Record<string, unknown>;
    return {
      area: typeof record.area === "string" ? record.area : "",
      status: typeof record.status === "string" ? record.status : undefined,
      notes: typeof record.notes === "string" ? record.notes : undefined,
    };
  });
  return normalizeChecklist(mapped);
}

function coerceStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function serializeCleanScoreReport(report: {
  id: string;
  bookingId: string;
  status: string;
  score: number;
  metrics: unknown;
  photos: unknown;
  videos: unknown;
  checklist: unknown;
  teamMembers: unknown;
  observations: string | null;
  recommendations: unknown;
  generatedBy: string;
  sentToEmail: string | null;
  createdAt: Date;
  updatedAt: Date;
  booking?: {
    id: string;
    status: string;
    scheduledAt: Date;
    completedAt: Date | null;
    property: { name: string; address: string };
    service: { name: string };
    user?: { id: string; name: string | null; email: string } | null;
  } | null;
}) {
  const coalescedProperty = report.booking?.property
    ? {
        name: report.booking.property.name ?? "Propiedad sin nombre",
        address: report.booking.property.address ?? "",
      }
    : undefined;

  const coalescedService = report.booking?.service
    ? {
        name: report.booking.service.name ?? "Servicio sin nombre",
      }
    : undefined;

  return {
    id: report.id,
    bookingId: report.bookingId,
    status: report.status,
    score: report.score,
    metrics: parseMetricsJson(report.metrics),
    photos: coercePhotoEntries(report.photos),
    videos: coerceStringArray(report.videos),
    checklist: coerceChecklistEntries(report.checklist),
    observations: report.observations ?? "",
    recommendations: coerceStringArray(report.recommendations),
    teamMembers: coerceStringArray(report.teamMembers),
    generatedBy: report.generatedBy,
    sentToEmail: report.sentToEmail,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
    booking: report.booking
      ? {
          id: report.booking.id,
          status: report.booking.status,
          scheduledAt: report.booking.scheduledAt,
          completedAt: report.booking.completedAt,
          property: coalescedProperty,
          service: coalescedService,
          user: report.booking.user
            ? {
                id: report.booking.user.id,
                name: report.booking.user.name,
                email: report.booking.user.email,
              }
            : undefined,
        }
      : undefined,
  };
}
function deriveObservations(
  checklist: NormalizedChecklistItem[],
  images: string[],
  videos: string[],
  notes?: string,
): string {
  if (notes && notes.trim().length > 0) {
    return notes.trim();
  }

  const stats = deriveCompletionStats(checklist);
  const completionPercent = Math.round(clamp(stats.ratio, 0, 1) * 100);

  if (stats.failCount > 0) {
    return `Se detectaron ${stats.failCount} pendientes críticos en el checklist. Registrar rework y comunicar al cliente.`;
  }

  if (stats.warnCount > 0) {
    return `Checklist completado al ${completionPercent}%. Revisar items marcados como seguimiento.`;
  }

  if (images.length === 0) {
    return `Checklist completado al ${completionPercent}%. No se adjuntaron evidencias fotográficas.`;
  }

  return `Checklist completado al ${completionPercent}% con ${images.length} fotos y ${videos.length} video${
    videos.length === 1 ? "" : "s"
  } de evidencia.`;
}

const metricsSchema = z.object({
  generalCleanliness: z.number().min(0).max(5),
  kitchen: z.number().min(0).max(5),
  bathrooms: z.number().min(0).max(5),
  premiumDetails: z.number().min(0).max(5),
  ambiance: z.number().min(0).max(5),
  timeCompliance: z.number().min(0).max(5),
});

const photoSchema = z.object({
  url: z.string().min(5),
  caption: z.string().optional(),
  category: z.enum(["before", "after"]).optional(),
});

const checklistInputSchema = z.object({
  area: z.string().min(1),
  status: z.string().optional(),
  notes: z.string().optional(),
});

const generateReportSchema = z.object({
  bookingId: z.string().min(1),
  metrics: metricsSchema.optional(),
  teamMembers: z.array(z.string()).optional(),
  photos: z.array(photoSchema).optional(),
  images: z.array(z.string().min(5)).optional(),
  videos: z.array(z.string().min(5)).optional(),
  checklist: z.array(checklistInputSchema).optional(),
  observations: z.string().optional(),
  notes: z.string().optional(),
  recommendations: z.array(z.string()).optional(),
  publish: z.boolean().optional(),
});

type GenerateReportInput = z.infer<typeof generateReportSchema>;

const updateReportSchema = z.object({
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
  sendEmail: z.boolean().optional(),
});

// Generate and optionally publish CleanScore report
reports.post("/cleanscore", requireAuth(["ADMIN", "STAFF"]), async (c) => {
  const authUser = getAuthUser(c);

  if (!authUser) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const json = (await c.req.json()) as unknown;
  const parseResult = generateReportSchema.safeParse(json);

  if (!parseResult.success) {
    return c.json(
      {
        error: "Invalid report payload",
        details: parseResult.error.flatten().fieldErrors,
      },
      400,
    );
  }

  const payload: GenerateReportInput = parseResult.data;

  const booking = await db.booking.findUnique({
    where: { id: payload.bookingId },
    include: {
      user: true,
      property: true,
      service: true,
    },
  });

  if (!booking) {
    return c.json({ error: "Booking not found" }, 404);
  }

  if (booking.status !== "COMPLETED") {
    return c.json(
      { error: "Report can only be generated for completed bookings" },
      400,
    );
  }

  const images = normalizeMediaList(payload.images);
  const videos = normalizeMediaList(payload.videos);
  const checklist = normalizeChecklist(payload.checklist);
  const evidence: EvidenceContext = {
    checklist,
    images,
    videos,
  };

  const metrics = payload.metrics ?? deriveMetricsFromEvidence(evidence);
  const bonus = deriveBonus(evidence);
  const score = calculateCleanScore(metrics, { bonus });

  const serviceDate = new Date(
    booking.scheduledAt as string | Date,
  ).toLocaleDateString("es-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const completedAt = booking.completedAt
    ? new Date(booking.completedAt as string | Date).toLocaleString("es-US")
    : new Date().toLocaleString("es-US");

  const photos = buildPhotoEntries(payload.photos, images);
  const recommendations = deriveRecommendations(
    checklist,
    payload.recommendations,
  );
  const observations = deriveObservations(
    checklist,
    images,
    videos,
    payload.observations ?? payload.notes,
  );
  const teamMembers = payload.teamMembers ?? ["Equipo Brisa Cubana"];
  const shouldPublish = payload.publish === true;

  logger.info(
    {
      bookingId: booking.id,
      score,
      clientEmail: booking.user.email,
      publish: shouldPublish,
    },
    "Generating CleanScore report",
  );

  const metricsJson = { ...metrics } as Prisma.JsonObject;
  const teamMembersJson = [...teamMembers] as Prisma.JsonArray;
  const photosJson = photos.map((photo) => ({ ...photo })) as Prisma.JsonArray;
  const videosJson = [...videos] as Prisma.JsonArray;
  const checklistJson = checklist.map((item) => ({
    ...item,
  })) as Prisma.JsonArray;
  const recommendationsJson = [...recommendations] as Prisma.JsonArray;

  const savedReport = await db.cleanScoreReport.upsert({
    where: { bookingId: booking.id },
    create: {
      bookingId: booking.id,
      score,
      metrics: metricsJson,
      teamMembers: teamMembersJson,
      photos: photosJson,
      videos: videosJson,
      checklist: checklistJson,
      observations,
      recommendations: recommendationsJson,
      generatedBy: authUser.sub,
      status: "DRAFT",
    },
    update: {
      score,
      metrics: metricsJson,
      teamMembers: teamMembersJson,
      photos: photosJson,
      videos: videosJson,
      checklist: checklistJson,
      observations,
      recommendations: recommendationsJson,
      generatedBy: authUser.sub,
      updatedAt: new Date(),
    },
  });

  let status = savedReport.status;

  const reportData = {
    bookingId: booking.id,
    clientName: booking.user.name ?? "Cliente",
    clientEmail: booking.user.email,
    propertyName: booking.property.name,
    propertyAddress: booking.property.address,
    serviceName: booking.service.name,
    serviceDate,
    teamMembers,
    score,
    metrics,
    photos,
    videos,
    checklist,
    observations,
    recommendations,
    completedAt,
  } satisfies Parameters<typeof sendCleanScoreReport>[0];

  if (shouldPublish) {
    const emailResult = await sendCleanScoreReport(reportData);
    if (emailResult.success) {
      await db.cleanScoreReport.update({
        where: { id: savedReport.id },
        data: {
          status: "PUBLISHED",
          sentToEmail: booking.user.email,
        },
      });
      status = "PUBLISHED";
    } else {
      logger.error(
        { bookingId: booking.id },
        "Failed to send CleanScore report during publish",
      );
    }
  }

  return c.json({
    success: true,
    message: shouldPublish
      ? status === "PUBLISHED"
        ? "CleanScore report published and delivered to client"
        : "Report generated but email delivery failed"
      : "CleanScore report generated (status: borrador)",
    score,
    bookingId: booking.id,
    reportId: savedReport.id,
    status,
  });
});

// Preview CleanScore report (HTML only, no email)
reports.post(
  "/cleanscore/preview",
  requireAuth(["ADMIN", "STAFF"]),
  async (c) => {
    const authUser = getAuthUser(c);

    if (!authUser) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const json = (await c.req.json()) as unknown;
    const parseResult = generateReportSchema.safeParse(json);

    if (!parseResult.success) {
      return c.json(
        {
          error: "Invalid report payload",
          details: parseResult.error.flatten().fieldErrors,
        },
        400,
      );
    }

    const payload: GenerateReportInput = parseResult.data;

    const booking = await db.booking.findUnique({
      where: { id: payload.bookingId },
      include: {
        user: true,
        property: true,
        service: true,
      },
    });

    if (!booking) {
      return c.json({ error: "Booking not found" }, 404);
    }

    const images = normalizeMediaList(payload.images);
    const videos = normalizeMediaList(payload.videos);
    const checklist = normalizeChecklist(payload.checklist);
    const evidence: EvidenceContext = {
      checklist,
      images,
      videos,
    };

    const metrics = payload.metrics ?? deriveMetricsFromEvidence(evidence);
    const bonus = deriveBonus(evidence);
    const score = calculateCleanScore(metrics, { bonus });

    const serviceDate = new Date(
      booking.scheduledAt as string | Date,
    ).toLocaleDateString("es-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const completedAt = booking.completedAt
      ? new Date(booking.completedAt as string | Date).toLocaleString("es-US")
      : new Date().toLocaleString("es-US");

    const photos = buildPhotoEntries(payload.photos, images);
    const recommendations = deriveRecommendations(
      checklist,
      payload.recommendations,
    );
    const observations = deriveObservations(
      checklist,
      images,
      videos,
      payload.observations ?? payload.notes,
    );
    const teamMembers = payload.teamMembers ?? ["Equipo Brisa Cubana"];

    const { generateCleanScoreReport } = await import("../services/reports");

    const html = generateCleanScoreReport({
      bookingId: booking.id,
      clientName: booking.user.name ?? "Cliente",
      clientEmail: booking.user.email,
      propertyName: booking.property.name,
      propertyAddress: booking.property.address,
      serviceName: booking.service.name,
      serviceDate,
      teamMembers,
      score,
      metrics,
      photos,
      videos,
      checklist,
      observations,
      recommendations,
      completedAt,
    });

    return c.json({
      success: true,
      html,
      data: {
        bookingId: booking.id,
        teamMembers,
        score,
        metrics,
        photos,
        videos,
        checklist,
        observations,
        recommendations,
        completedAt,
      },
    });
  },
);

reports.patch(
  "/cleanscore/:bookingId",
  requireAuth(["ADMIN", "STAFF"]),
  async (c) => {
    const authUser = getAuthUser(c);

    if (!authUser) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { bookingId } = c.req.param();
    const json = (await c.req.json()) as unknown;
    const parseResult = updateReportSchema.safeParse(json ?? {});

    if (!parseResult.success) {
      return c.json(
        {
          error: "Invalid payload",
          details: parseResult.error.flatten().fieldErrors,
        },
        400,
      );
    }

    const payload = parseResult.data;

    const report = await db.cleanScoreReport.findUnique({
      where: { bookingId },
      include: {
        booking: {
          include: {
            user: true,
            property: true,
            service: true,
          },
        },
      },
    });

    if (!report) {
      return c.json({ error: "CleanScore report not found" }, 404);
    }

    const booking = report.booking;
    const serviceDate = new Date(
      booking.scheduledAt as string | Date,
    ).toLocaleDateString("es-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const completedAt = booking.completedAt
      ? new Date(booking.completedAt as string | Date).toLocaleString("es-US")
      : new Date().toLocaleString("es-US");

    const teamMembers = coerceStringArray(report.teamMembers);
    const photos = coercePhotoEntries(report.photos);
    const videos = coerceStringArray(report.videos);
    const checklist = coerceChecklistEntries(report.checklist);
    const metrics = parseMetricsJson(report.metrics);
    const recommendations = coerceStringArray(report.recommendations);
    const observations =
      typeof report.observations === "string" &&
      report.observations.trim().length > 0
        ? report.observations.trim()
        : deriveObservations(
            checklist,
            photos.map((photo) => photo.url),
            videos,
            undefined,
          );

    let status = report.status;
    const updateData: Prisma.CleanScoreReportUpdateInput = {};
    let emailSent = false;

    if (payload.status && payload.status !== report.status) {
      updateData.status = payload.status;
      status = payload.status;
    }

    const skipEmailDelivery =
      process.env.USE_FAKE_API_DATA === "1" ||
      process.env.NEXT_PUBLIC_USE_FAKE_API_DATA === "1";

    if (payload.sendEmail && !skipEmailDelivery) {
      const clientEmail = booking.user?.email?.trim();

      if (!clientEmail) {
        logger.warn(
          { bookingId },
          "CleanScore report published sin enviar correo (booking sin email de cliente)",
        );
      } else {
        const reportData = {
          bookingId: report.bookingId,
          clientName: booking.user?.name ?? "Cliente",
          clientEmail,
          propertyName: booking.property?.name ?? "Propiedad sin nombre",
          propertyAddress: booking.property?.address ?? "",
          serviceName: booking.service?.name ?? "Servicio sin nombre",
          serviceDate,
          teamMembers:
            teamMembers.length > 0 ? teamMembers : ["Equipo Brisa Cubana"],
          score: report.score,
          metrics,
          photos,
          videos,
          checklist,
          observations,
          recommendations:
            recommendations.length > 0
              ? recommendations
              : deriveRecommendations(checklist),
          completedAt,
        } satisfies Parameters<typeof sendCleanScoreReport>[0];

        const emailResult = await sendCleanScoreReport(reportData);
        if (emailResult.success) {
          updateData.sentToEmail = clientEmail;
          emailSent = true;
        } else {
          logger.warn(
            { bookingId },
            "CleanScore report published sin enviar correo (Resend no configurado)",
          );
        }
      }

      if (status !== "PUBLISHED") {
        updateData.status = "PUBLISHED";
        status = "PUBLISHED";
      }
    } else if (payload.sendEmail && skipEmailDelivery) {
      logger.info(
        { bookingId },
        "CleanScore report publicado sin email por modo de datos fake",
      );
      if (status !== "PUBLISHED") {
        updateData.status = "PUBLISHED";
        status = "PUBLISHED";
      }
    }

    if (Object.keys(updateData).length > 0) {
      const updated = await db.cleanScoreReport.update({
        where: { id: report.id },
        data: updateData,
      });
      status = updated.status;
    }

    return c.json({
      success: true,
      status,
      emailSent,
    });
  },
);

// Get revenue report
reports.get("/revenue", requireAuth(["ADMIN"]), async (c) => {
  const from = c.req.query("from");
  const to = c.req.query("to");

  // Default to current month if no dates provided
  const fromDate = from
    ? new Date(from)
    : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const toDate = to ? new Date(to) : new Date();

  // Get all completed bookings in date range
  const bookings = await db.booking.findMany({
    where: {
      status: "COMPLETED",
      completedAt: {
        gte: fromDate,
        lte: toDate,
      },
    },
    include: {
      service: {
        select: {
          name: true,
        },
      },
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  // Calculate totals
  const totalRevenue = bookings.reduce(
    (sum: number, booking: { totalPrice: { toString: () => string } }) =>
      sum + parseFloat(booking.totalPrice.toString()),
    0,
  );
  const bookingsCount = bookings.length;
  const averageBookingValue =
    bookingsCount > 0 ? totalRevenue / bookingsCount : 0;

  // Group by service
  type RevenueGroup = Record<string, { revenue: number; count: number }>;
  interface BookingWithRelations {
    service: { name: string };
    totalPrice: { toString: () => string };
    paymentStatus: string;
  }

  const revenueByService = bookings.reduce(
    (acc: RevenueGroup, booking: BookingWithRelations) => {
      const serviceName = booking.service.name;
      if (!acc[serviceName]) {
        acc[serviceName] = {
          revenue: 0,
          count: 0,
        };
      }
      acc[serviceName].revenue += parseFloat(booking.totalPrice.toString());
      acc[serviceName].count += 1;
      return acc;
    },
    {} as RevenueGroup,
  );

  // Group by payment status
  const revenueByPaymentStatus = bookings.reduce(
    (acc: RevenueGroup, booking: BookingWithRelations) => {
      const status = booking.paymentStatus;
      if (!acc[status]) {
        acc[status] = {
          revenue: 0,
          count: 0,
        };
      }
      acc[status].revenue += parseFloat(booking.totalPrice.toString());
      acc[status].count += 1;
      return acc;
    },
    {} as RevenueGroup,
  );

  return c.json({
    period: {
      from: fromDate.toISOString(),
      to: toDate.toISOString(),
    },
    summary: {
      totalRevenue: totalRevenue.toFixed(2),
      bookingsCount,
      averageBookingValue: averageBookingValue.toFixed(2),
    },
    byService: revenueByService,
    byPaymentStatus: revenueByPaymentStatus,
    recentBookings: bookings
      .slice(0, 10)
      .map(
        (b: {
          id: string;
          user: { name: string | null; email: string };
          service: { name: string };
          totalPrice: { toString: () => string };
          completedAt: Date | null;
          paymentStatus: string;
        }) => ({
          id: b.id,
          client: b.user.name ?? b.user.email,
          service: b.service.name,
          amount: b.totalPrice.toString(),
          completedAt: b.completedAt,
          paymentStatus: b.paymentStatus,
        }),
      ),
  });
});

// Get CleanScore report by booking ID
reports.get("/cleanscore/:bookingId", requireAuth(), async (c) => {
  const authUser = getAuthUser(c);
  const { bookingId } = c.req.param();

  if (!authUser) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const report = await db.cleanScoreReport.findUnique({
    where: { bookingId },
    include: {
      booking: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          property: true,
          service: true,
        },
      },
    },
  });

  if (!report) {
    return c.json(
      { error: "CleanScore report not found for this booking" },
      404,
    );
  }

  // Check authorization - only booking owner, staff, and admins can view
  if (
    authUser.role !== "ADMIN" &&
    authUser.role !== "STAFF" &&
    report.booking.userId !== authUser.sub
  ) {
    return c.json(
      { error: "Forbidden - not authorized to view this report" },
      403,
    );
  }

  return c.json(serializeCleanScoreReport(report));
});
// List all CleanScore reports (admin/staff only)
reports.get("/cleanscore", requireAuth(["ADMIN", "STAFF"]), async (c) => {
  const authUser = getAuthUser(c);

  if (!authUser) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const limit = parseInt(c.req.query("limit") ?? "20", 10);
  const offset = parseInt(c.req.query("offset") ?? "0", 10);

  const reports = await db.cleanScoreReport.findMany({
    take: limit,
    skip: offset,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      booking: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          property: {
            select: {
              id: true,
              name: true,
              address: true,
            },
          },
          service: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  const total = await db.cleanScoreReport.count();

  return c.json({
    reports: reports.map(serializeCleanScoreReport),
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    },
  });
});

export default reports;
