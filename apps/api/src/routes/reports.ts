import { Hono } from "hono";
import { db } from "../lib/db";
import { getAuthUser, requireAuth } from "../middleware/auth";
import { rateLimiter, RateLimits } from "../middleware/rate-limit";
import { sendCleanScoreReport, calculateCleanScore } from "../services/reports";
import { logger } from "../lib/logger";
import { z } from "zod";

const reports = new Hono();

// Apply rate limiting
reports.use("/", rateLimiter(RateLimits.read));

const generateReportSchema = z.object({
  bookingId: z.string().min(1),
  metrics: z.object({
    generalCleanliness: z.number().min(0).max(5),
    kitchen: z.number().min(0).max(5),
    bathrooms: z.number().min(0).max(5),
    premiumDetails: z.number().min(0).max(5),
    ambiance: z.number().min(0).max(5),
    timeCompliance: z.number().min(0).max(5),
  }),
  teamMembers: z.array(z.string()).optional(),
  photos: z
    .array(
      z.object({
        url: z.string().url(),
        caption: z.string(),
        category: z.enum(["before", "after"]),
      }),
    )
    .optional(),
  observations: z.string().optional(),
  recommendations: z.array(z.string()).optional(),
});

type GenerateReportInput = z.infer<typeof generateReportSchema>;

// Generate and send CleanScore report
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

  // Fetch booking with relations
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

  // Calculate CleanScore
  const score = calculateCleanScore(payload.metrics);

  // Format dates
  const serviceDate = new Date(booking.scheduledAt).toLocaleDateString(
    "es-US",
    {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  );

  const completedAt = booking.completedAt
    ? new Date(booking.completedAt).toLocaleString("es-US")
    : new Date().toLocaleString("es-US");

  // Prepare report data
  const reportData = {
    bookingId: booking.id,
    clientName: booking.user.name ?? "Cliente",
    clientEmail: booking.user.email,
    propertyName: booking.property.name,
    propertyAddress: booking.property.address,
    serviceName: booking.service.name,
    serviceDate,
    teamMembers: payload.teamMembers ?? ["Equipo Brisa Cubana"],
    score,
    metrics: payload.metrics,
    photos: payload.photos ?? [],
    observations: payload.observations ?? "",
    recommendations: payload.recommendations ?? [],
    completedAt,
  };

  logger.info(
    {
      bookingId: booking.id,
      score,
      clientEmail: booking.user.email,
    },
    "Generating CleanScore report",
  );

  // Generate and send report (async, non-blocking)
  void sendCleanScoreReport(reportData);

  // Store report metadata in database (for future retrieval)
  // TODO: Create Report model in Prisma schema and store here

  return c.json({
    success: true,
    message: "CleanScore report is being generated and will be sent shortly",
    score,
    bookingId: booking.id,
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

    // Fetch booking with relations
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

    // Calculate CleanScore
    const score = calculateCleanScore(payload.metrics);

    // Format dates
    const serviceDate = new Date(booking.scheduledAt).toLocaleDateString(
      "es-US",
      {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      },
    );

    const completedAt = booking.completedAt
      ? new Date(booking.completedAt).toLocaleString("es-US")
      : new Date().toLocaleString("es-US");

    // Import here to avoid circular dependency
    const { generateCleanScoreReport } = await import("../services/reports");

    const html = generateCleanScoreReport({
      bookingId: booking.id,
      clientName: booking.user.name ?? "Cliente",
      clientEmail: booking.user.email,
      propertyName: booking.property.name,
      propertyAddress: booking.property.address,
      serviceName: booking.service.name,
      serviceDate,
      teamMembers: payload.teamMembers ?? ["Equipo Brisa Cubana"],
      score,
      metrics: payload.metrics,
      photos: payload.photos ?? [],
      observations: payload.observations ?? "",
      recommendations: payload.recommendations ?? [],
      completedAt,
    });

    // Return HTML for preview
    return c.html(html);
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
    (sum, booking) => sum + parseFloat(booking.totalPrice.toString()),
    0,
  );
  const bookingsCount = bookings.length;
  const averageBookingValue =
    bookingsCount > 0 ? totalRevenue / bookingsCount : 0;

  // Group by service
  const revenueByService = bookings.reduce(
    (acc, booking) => {
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
    {} as Record<string, { revenue: number; count: number }>,
  );

  // Group by payment status
  const revenueByPaymentStatus = bookings.reduce(
    (acc, booking) => {
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
    {} as Record<string, { revenue: number; count: number }>,
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
    recentBookings: bookings.slice(0, 10).map((b) => ({
      id: b.id,
      client: b.user.name ?? b.user.email,
      service: b.service.name,
      amount: b.totalPrice.toString(),
      completedAt: b.completedAt,
      paymentStatus: b.paymentStatus,
    })),
  });
});

export default reports;
