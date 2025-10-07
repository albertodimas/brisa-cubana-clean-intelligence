import "server-only";

import { cookies } from "next/headers";
import { isFakeDataEnabled } from "@/server/utils/fake";
import { buildFakeDashboardData } from "./fake-dashboard";
import { env } from "@/config/env";
import { logger } from "@/server/logger";

const API_BASE_URL = env.apiUrl;

type FetchOptions = Omit<RequestInit, "headers"> & {
  headers?: Record<string, string>;
  forwardCookies?: boolean; // Forward brisa_access/brisa_refresh cookies from request
};

class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function fetchJson<T>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const { forwardCookies = true, ...fetchOptions } = options;

  // Server-side: forward auth cookies from user's request to API
  let cookieHeader: string | undefined;
  if (forwardCookies && typeof window === "undefined") {
    try {
      const cookieStore = await cookies();
      const brisaAccess = cookieStore.get("brisa_access");
      const brisaRefresh = cookieStore.get("brisa_refresh");

      const cookiePairs: string[] = [];
      if (brisaAccess) cookiePairs.push(`brisa_access=${brisaAccess.value}`);
      if (brisaRefresh) cookiePairs.push(`brisa_refresh=${brisaRefresh.value}`);

      if (cookiePairs.length > 0) {
        cookieHeader = cookiePairs.join("; ");
      }
    } catch (error) {
      logger.warn(
        { error: error instanceof Error ? error.message : "unknown" },
        "[api] Could not read cookies",
      );
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...fetchOptions,
    headers: {
      "content-type": "application/json",
      // Server-side: forward cookies from user's request
      // Client-side: cookies are sent automatically via credentials: include
      ...(cookieHeader ? { cookie: cookieHeader } : {}),
      ...(options.headers ?? {}),
    },
    cache: "no-store",
    credentials: "include", // Client-side: include cookies automatically
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "<unreadable>");
    logger.error(
      {
        path,
        status: response.status,
        body,
      },
      "[api] Request failed",
    );
    const message = await response
      .json()
      .catch(() => ({ error: response.statusText }));
    throw new ApiError(
      typeof message?.error === "string"
        ? message.error
        : "Unexpected API error",
      response.status,
    );
  }

  return response.json() as Promise<T>;
}

interface ApiService {
  id: string;
  name: string;
  description?: string | null;
  basePrice: string | number;
  duration: number;
}

interface ApiProperty {
  id: string;
  name: string;
  address: string;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  size?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  notes?: string | null;
}

interface ApiBooking {
  id: string;
  scheduledAt: string;
  status: string;
  totalPrice: string | number;
  notes?: string | null;
  service: { id: string; name: string; basePrice: string | number };
  property: { id: string; name: string; address: string };
  user?: { id: string; name: string | null; email: string };
  paymentStatus?: string | null;
  paymentIntentId?: string | null;
  checkoutSessionId?: string | null;
}

interface ApiUserResponse {
  id: string;
  email: string;
  name?: string | null;
  role?: string;
  phone?: string | null;
  properties: ApiProperty[];
}

export interface ServiceSummary {
  id: string;
  name: string;
  description?: string | null;
  basePrice: number;
  durationMinutes: number;
}

export interface PropertySummary {
  id: string;
  name: string;
  address: string;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  size?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  notes?: string | null;
}

export interface BookingSummary {
  id: string;
  scheduledAt: string;
  status: string;
  totalPrice: number;
  serviceName: string;
  propertyName: string;
  propertyAddress: string;
  clientName?: string | null;
  clientEmail?: string;
  paymentStatus?: string;
  stripePaymentIntentId?: string;
  stripeCheckoutSessionId?: string;
}

export interface DashboardData {
  user: {
    id: string;
    email: string;
    name?: string | null;
    role?: string;
    properties: PropertySummary[];
  };
  bookings: BookingSummary[];
  services: ServiceSummary[];
  managedBookings?: BookingSummary[];
  canManageBookings: boolean;
  paymentMetrics?: Record<string, number>;
  bookingMetrics?: Record<string, number>;
  failedPaymentsLast24h?: BookingSummary[];
}

function toCurrencyNumber(value: string | number): number {
  return typeof value === "string" ? Number.parseFloat(value) : value;
}

function mapBooking(booking: ApiBooking): BookingSummary {
  const paymentAware = booking as ApiBooking & {
    paymentStatus?: string | null;
    paymentIntentId?: string | null;
    checkoutSessionId?: string | null;
  };
  return {
    id: booking.id,
    scheduledAt: booking.scheduledAt,
    status: booking.status,
    totalPrice: toCurrencyNumber(booking.totalPrice),
    serviceName: booking.service.name,
    propertyName: booking.property.name,
    propertyAddress: booking.property.address,
    clientName: booking.user?.name,
    clientEmail: booking.user?.email,
    paymentStatus: paymentAware.paymentStatus ?? undefined,
    stripePaymentIntentId: paymentAware.paymentIntentId ?? undefined,
    stripeCheckoutSessionId: paymentAware.checkoutSessionId ?? undefined,
  };
}

export async function getDashboardData(
  userId: string,
  userRole?: string | null,
): Promise<DashboardData> {
  const canManageBookings = userRole === "ADMIN" || userRole === "STAFF";
  if (isFakeDataEnabled()) {
    return buildFakeDashboardData({
      userId,
      userRole,
      canManageBookings,
      includeAlerts: true,
    });
  }

  try {
    const userPromise = fetchJson<ApiUserResponse>(`/api/users/${userId}`);
    const servicesPromise = fetchJson<ApiService[]>(`/api/services`);

    let personalBookings: ApiBooking[] = [];
    let managedBookings: ApiBooking[] | undefined;

    if (canManageBookings) {
      const [managedResponse, personalResponse] = await Promise.all([
        fetchJson<{ data: ApiBooking[] }>(`/api/bookings?limit=20`),
        fetchJson<ApiBooking[]>(`/api/bookings/mine`).catch(() => []),
      ]);
      managedBookings = managedResponse.data;
      personalBookings = Array.isArray(personalResponse)
        ? personalResponse
        : [];
    } else {
      personalBookings = await fetchJson<ApiBooking[]>(`/api/bookings/mine`);
    }

    const [user, services] = await Promise.all([userPromise, servicesPromise]);

    const mappedServices: ServiceSummary[] = services.map((service) => ({
      id: service.id,
      name: service.name,
      description: service.description ?? undefined,
      basePrice: toCurrencyNumber(service.basePrice),
      durationMinutes: service.duration,
    }));

    const mappedProperties: PropertySummary[] = user.properties.map(
      (property) => ({
        id: property.id,
        name: property.name,
        address: property.address,
        city: property.city ?? null,
        state: property.state ?? null,
        zipCode: property.zipCode ?? null,
        size: property.size ?? null,
        bedrooms: property.bedrooms ?? null,
        bathrooms: property.bathrooms ?? null,
        notes: property.notes ?? null,
      }),
    );

    const mappedBookings: BookingSummary[] = personalBookings.map(mapBooking);
    const mappedManagedBookings = managedBookings?.map(mapBooking);

    const sourceForMetrics = mappedManagedBookings ?? mappedBookings;

    const paymentMetrics = sourceForMetrics.reduce<Record<string, number>>(
      (acc, booking) => {
        const status = booking.paymentStatus ?? "PENDING_PAYMENT";
        acc[status] = (acc[status] ?? 0) + 1;
        return acc;
      },
      {},
    );

    const bookingMetrics = sourceForMetrics.reduce<Record<string, number>>(
      (acc, booking) => {
        acc[booking.status] = (acc[booking.status] ?? 0) + 1;
        return acc;
      },
      {},
    );

    const now = Date.now();
    const failedPaymentsLast24h = mappedManagedBookings
      ?.filter((booking) => booking.paymentStatus === "FAILED")
      .filter(
        (booking) =>
          now - new Date(booking.scheduledAt).getTime() <= 86_400_000,
      );

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name ?? undefined,
        role: user.role,
        properties: mappedProperties,
      },
      bookings: mappedBookings,
      services: mappedServices,
      managedBookings: mappedManagedBookings,
      canManageBookings,
      paymentMetrics,
      bookingMetrics,
      failedPaymentsLast24h,
    };
  } catch (error) {
    logger.warn(
      { error: error instanceof Error ? error.message : "unknown" },
      "[api] Falling back to static dashboard data",
    );
    return buildFakeDashboardData({
      userId,
      userRole,
      canManageBookings,
      includeAlerts: true,
    });
  }
}

export { ApiError };
