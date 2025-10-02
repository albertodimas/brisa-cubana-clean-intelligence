import type {
  BookingSummary,
  DashboardData,
  PropertySummary,
  ServiceSummary,
} from "./client";

interface BuildOptions {
  userId: string;
  userRole?: string | null;
  canManageBookings: boolean;
  includeAlerts?: boolean;
}

export function buildFakeDashboardData({
  userId,
  userRole,
  canManageBookings,
  includeAlerts = false,
}: BuildOptions): DashboardData {
  const services: ServiceSummary[] = [
    {
      id: "fallback-basic-clean",
      name: "Limpieza Básica",
      description: "Limpieza estándar de espacios residenciales y oficinas",
      basePrice: 89.99,
      durationMinutes: 120,
    },
    {
      id: "fallback-deep-clean",
      name: "Limpieza Profunda",
      description: "Limpieza detallada incluyendo áreas difíciles",
      basePrice: 149.99,
      durationMinutes: 180,
    },
    {
      id: "fallback-vacation",
      name: "Turnover Vacation Rental",
      description: "Express entre huéspedes con reporte fotográfico",
      basePrice: 119.99,
      durationMinutes: 90,
    },
  ];

  const properties: PropertySummary[] = [
    {
      id: "fallback-property",
      name: "Brickell Luxury Apartment",
      address: "1234 Brickell Ave, Unit 2501",
      city: "Miami",
      state: "FL",
      zipCode: "33131",
      size: 1200,
      bedrooms: 2,
      bathrooms: 2,
      notes: null,
    },
  ];

  const bookings: BookingSummary[] = [
    {
      id: "fallback-booking-confirmed",
      scheduledAt: new Date().toISOString(),
      status: "CONFIRMED",
      totalPrice: 149.99,
      serviceName: "Limpieza Profunda",
      propertyName: "Brickell Luxury Apartment",
      propertyAddress: "1234 Brickell Ave, Unit 2501",
      clientName: "Maria Rodriguez",
      clientEmail: "client@brisacubanaclean.com",
      paymentStatus: "PENDING_PAYMENT",
      stripeCheckoutSessionId: "cs_test_123",
    },
    {
      id: "fallback-booking-failed",
      scheduledAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      status: "IN_PROGRESS",
      totalPrice: 189.99,
      serviceName: "Limpieza Profunda",
      propertyName: "Brickell Luxury Apartment",
      propertyAddress: "1234 Brickell Ave, Unit 2501",
      clientName: "Admin User",
      clientEmail: "admin@brisacubanaclean.com",
      paymentStatus: includeAlerts ? "FAILED" : "PENDING_PAYMENT",
    },
    {
      id: "fallback-booking-pending",
      scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      status: "PENDING",
      totalPrice: 119.99,
      serviceName: "Turnover Vacation Rental",
      propertyName: "Wynwood Vacation Rental",
      propertyAddress: "567 NW 2nd Ave",
      clientName: "Carlos Mendez",
      clientEmail: "carlos.mendez@example.com",
      paymentStatus: "PENDING_PAYMENT",
    },
  ];

  const managedBookings = canManageBookings ? bookings : undefined;

  const paymentMetrics = bookings.reduce<Record<string, number>>(
    (acc, booking) => {
      const status = booking.paymentStatus ?? "PENDING_PAYMENT";
      acc[status] = (acc[status] ?? 0) + 1;
      return acc;
    },
    {},
  );

  const bookingMetrics = bookings.reduce<Record<string, number>>(
    (acc, booking) => {
      acc[booking.status] = (acc[booking.status] ?? 0) + 1;
      return acc;
    },
    {},
  );

  return {
    user: {
      id: userId,
      email: "admin@brisacubanaclean.com",
      name: "Admin User",
      role: userRole ?? "ADMIN",
      properties,
    },
    bookings,
    services,
    managedBookings,
    canManageBookings,
    paymentMetrics,
    bookingMetrics,
    failedPaymentsLast24h: bookings.filter(
      (booking) => booking.paymentStatus === "FAILED",
    ),
  };
}
