import { auth } from "@/auth";
import { cookies, headers as nextHeaders } from "next/headers";

export type Service = {
  id: string;
  name: string;
  description?: string | null;
  basePrice: number;
  durationMin: number;
  active: boolean;
  updatedAt: string;
};

export type Booking = {
  id: string;
  code: string;
  scheduledAt: string;
  durationMin: number;
  totalAmount: number;
  status: string;
  notes?: string | null;
  service: { id: string; name: string; basePrice: number };
  property: { id: string; label: string; city: string };
  customer?: { id: string; fullName: string | null; email: string };
  assignedStaff?: {
    id: string;
    email: string;
    fullName: string | null;
    role: string;
    isActive: boolean;
  } | null;
};

export type Property = {
  id: string;
  label: string;
  addressLine: string;
  city: string;
  state: string;
  zipCode: string;
  type: string;
  ownerId: string;
  bedrooms?: number | null;
  bathrooms?: number | null;
  sqft?: number | null;
  notes?: string | null;
  owner?: {
    id: string;
    email: string;
    fullName: string | null;
  };
};

export type Customer = {
  id: string;
  email: string;
  fullName: string | null;
};

export type User = {
  id: string;
  email: string;
  fullName: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Notification = {
  id: string;
  type: string;
  message: string;
  readAt: string | null;
  createdAt: string;
};

export type Lead = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  propertyCount?: string | null;
  serviceInterest?: string | null;
  planCode?: string | null;
  notes?: string | null;
  status: string;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmContent?: string | null;
  utmTerm?: string | null;
  createdAt: string;
  updatedAt: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export type PaginationInfo = {
  limit: number;
  cursor: string | null;
  nextCursor: string | null;
  hasMore: boolean;
};

type ApiResponse<T> = {
  data: T;
  pagination?: PaginationInfo;
};

export type PaginatedResult<T> = {
  items: T[];
  pageInfo: PaginationInfo;
};

export type PortalBookingsResult = PaginatedResult<Booking> & {
  customer: {
    id: string;
    email: string;
    fullName: string | null;
  };
  session?: {
    expiresAt: string | null;
  };
};

export type PortalBookingDetail = {
  booking: Booking;
  customer: {
    id: string;
    email: string;
    fullName: string | null;
  };
  session?: {
    expiresAt: string | null;
  };
};

async function getPortalTokenFromCookies(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    return cookieStore.get("portal_token")?.value ?? null;
  } catch {
    return null;
  }
}

async function resolveAuthHeader(): Promise<string | null> {
  const session = await auth();
  const token = session?.accessToken;
  if (token) {
    return `Bearer ${token}`;
  }

  const portalToken = await getPortalTokenFromCookies();
  return portalToken ? `Bearer ${portalToken}` : null;
}

type QueryValue = string | number | null | undefined;

function buildQuery(params: Record<string, QueryValue>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.append(key, String(value));
    }
  });
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

async function extractForwardedFor(): Promise<string | null> {
  try {
    const incoming = await nextHeaders();
    const forwarded = incoming.get("x-forwarded-for");
    if (forwarded) {
      const [first] = forwarded.split(",");
      if (first) {
        return first.trim();
      }
    }
    const realIp =
      incoming.get("x-real-ip") ?? incoming.get("cf-connecting-ip");
    return realIp ?? null;
  } catch {
    return null;
  }
}

async function safeFetch<T>(path: string): Promise<ApiResponse<T> | null> {
  const authorization = await resolveAuthHeader();
  try {
    const requestHeaders: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (authorization) {
      requestHeaders.Authorization = authorization;
    }

    const forwardedFor = await extractForwardedFor();
    if (forwardedFor) {
      requestHeaders["x-forwarded-for"] = forwardedFor;
    }

    const res = await fetch(`${API_URL}${path}`, {
      headers: requestHeaders,
      cache: "no-store",
      credentials: "include",
    });

    if (!res.ok) {
      console.warn(`[api] request to ${path} failed with status ${res.status}`);
      return null;
    }

    const json = (await res.json()) as ApiResponse<T>;
    return json;
  } catch (error) {
    console.warn(`[api] request to ${path} threw`, error);
    return null;
  }
}

function normalizePagination(
  pagination?: PaginationInfo,
  fallbackLimit = 0,
): PaginationInfo {
  return {
    limit: pagination?.limit ?? fallbackLimit,
    cursor: pagination?.cursor ?? null,
    nextCursor: pagination?.nextCursor ?? null,
    hasMore: pagination?.hasMore ?? false,
  };
}

function toPaginatedResult<T>(response: ApiResponse<T[]>): PaginatedResult<T> {
  const fallbackLimit = response.pagination?.limit ?? response.data.length;
  return {
    items: response.data,
    pageInfo: normalizePagination(response.pagination, fallbackLimit),
  };
}

type PaginationQuery = {
  limit?: number;
  cursor?: string;
};

type PropertyFilters = {
  ownerId?: string;
};

type FetchPropertiesOptions = PropertyFilters & PaginationQuery;

export async function fetchServicesPage(
  params: PaginationQuery = {},
): Promise<PaginatedResult<Service>> {
  const query = buildQuery(params);
  const response = await safeFetch<Service[]>(`/api/services${query}`);
  if (!response) {
    return { items: [], pageInfo: normalizePagination(undefined) };
  }
  return toPaginatedResult(response);
}

export type BookingFilters = {
  from?: string;
  to?: string;
  status?: string;
  propertyId?: string;
  serviceId?: string;
  customerId?: string;
  assignedStaffId?: string;
};

type FetchBookingsOptions = BookingFilters & PaginationQuery;

export async function fetchBookingsPage(
  options: FetchBookingsOptions = {},
): Promise<PaginatedResult<Booking>> {
  const { limit, cursor, ...filters } = options;
  const query = buildQuery({ limit, cursor, ...filters });
  const response = await safeFetch<Booking[]>(`/api/bookings${query}`);
  if (!response) {
    return { items: [], pageInfo: normalizePagination(undefined) };
  }
  return toPaginatedResult(response);
}

export async function fetchCustomerBookings({
  customerId,
  status,
  limit = 20,
}: {
  customerId: string;
  status?: string;
  limit?: number;
}): Promise<PaginatedResult<Booking>> {
  return fetchBookingsPage({ customerId, status, limit });
}

export async function fetchPortalBookings({
  status,
  limit = 20,
  cursor,
}: {
  status?: string;
  limit?: number;
  cursor?: string;
} = {}): Promise<PortalBookingsResult | null> {
  const query = buildQuery({ status, limit, cursor });
  const authorization = await resolveAuthHeader();

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (authorization) {
      headers.Authorization = authorization;
    }

    const res = await fetch(`${API_URL}/api/portal/bookings${query}`, {
      headers,
      cache: "no-store",
      credentials: "include",
    });

    if (!res.ok) {
      console.warn(
        `[api] portal request failed for /api/portal/bookings${query} with ${res.status}`,
      );
      return null;
    }

    const json = (await res.json()) as {
      data: Booking[];
      customer: { id: string; email: string; fullName: string | null };
      pagination?: PaginationInfo;
      session?: { expiresAt: string | null };
    };

    return {
      items: json.data ?? [],
      customer: json.customer,
      session: {
        expiresAt: json.session?.expiresAt ?? null,
      },
      pageInfo: normalizePagination(
        json.pagination,
        json.data ? json.data.length : 0,
      ),
    };
  } catch (error) {
    console.warn("[api] portal bookings request threw", error);
    return null;
  }
}

export async function fetchPropertiesPage(
  params: FetchPropertiesOptions = {},
): Promise<PaginatedResult<Property>> {
  const query = buildQuery(params);
  const response = await safeFetch<Property[]>(`/api/properties${query}`);
  if (!response) {
    return { items: [], pageInfo: normalizePagination(undefined) };
  }
  return toPaginatedResult(response);
}

export async function fetchPortalBookingDetail(
  bookingId: string,
): Promise<PortalBookingDetail | null> {
  const authorization = await resolveAuthHeader();

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (authorization) {
      headers.Authorization = authorization;
    }

    const res = await fetch(`${API_URL}/api/portal/bookings/${bookingId}`, {
      headers,
      cache: "no-store",
      credentials: "include",
    });

    if (!res.ok) {
      return null;
    }

    const json = (await res.json()) as {
      data?: Booking;
      customer?: { id: string; email: string; fullName: string | null };
      session?: { expiresAt?: string | null };
    };

    if (!json.data || !json.customer) {
      return null;
    }

    return {
      booking: json.data,
      customer: json.customer,
      session: {
        expiresAt: json.session?.expiresAt ?? null,
      },
    };
  } catch (error) {
    console.warn("[api] portal booking detail request threw", error);
    return null;
  }
}

export async function fetchCustomersPage(
  params: PaginationQuery = {},
): Promise<PaginatedResult<Customer>> {
  const query = buildQuery(params);
  const response = await safeFetch<Customer[]>(`/api/customers${query}`);
  if (!response) {
    return { items: [], pageInfo: normalizePagination(undefined) };
  }
  return toPaginatedResult(response);
}

export async function fetchCustomerById(id: string): Promise<Customer> {
  const response = await fetch(`${API_URL}/customers/${id}`, {
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch customer: ${response.statusText}`);
  }
  const result = (await response.json()) as { data: Customer };
  return result.data;
}

export async function fetchPropertyById(id: string): Promise<Property> {
  const response = await fetch(`${API_URL}/properties/${id}`, {
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch property: ${response.statusText}`);
  }
  const result = (await response.json()) as { data: Property };
  return result.data;
}

type FetchUsersOptions = PaginationQuery & {
  search?: string;
  role?: string;
  isActive?: boolean;
};

export async function fetchUsersPage(
  options: FetchUsersOptions = {},
): Promise<PaginatedResult<User>> {
  const { limit, cursor, search, role, isActive } = options;
  const query = buildQuery({
    limit,
    cursor,
    search,
    role,
    isActive: typeof isActive === "boolean" ? String(isActive) : undefined,
  });
  const response = await safeFetch<User[]>(`/api/users${query}`);
  if (!response) {
    return { items: [], pageInfo: normalizePagination(undefined) };
  }
  return toPaginatedResult(response);
}

type FetchNotificationsOptions = PaginationQuery & {
  unreadOnly?: boolean;
};

export async function fetchNotificationsPage(
  options: FetchNotificationsOptions = {},
): Promise<PaginatedResult<Notification>> {
  const { limit, cursor, unreadOnly } = options;
  const query = buildQuery({
    limit,
    cursor,
    unreadOnly: unreadOnly ? "true" : undefined,
  });
  const response = await safeFetch<Notification[]>(
    `/api/notifications${query}`,
  );
  if (!response) {
    return { items: [], pageInfo: normalizePagination(undefined) };
  }
  return toPaginatedResult(response);
}

export async function fetchLeadsPage(): Promise<PaginatedResult<Lead>> {
  const response = await safeFetch<Lead[]>("/api/leads");
  if (!response) {
    return {
      items: [],
      pageInfo: normalizePagination(undefined),
    };
  }
  return toPaginatedResult(response);
}

export async function fetchStaffUsers(): Promise<User[]> {
  const result = await fetchUsersPage({
    role: "STAFF",
    isActive: true,
    limit: 100,
  });
  return result.items;
}

// Dashboard types
export type DashboardStats = {
  bookingsByStatus: {
    status: string;
    count: number;
    percentage: number;
  }[];
  revenueTrend: {
    date: string;
    amount: number;
  }[];
  staffWorkload: {
    staffId: string;
    staffName: string;
    bookingsCount: number;
  }[];
  topProperties: {
    propertyId: string;
    propertyLabel: string;
    bookingsCount: number;
  }[];
  totals: {
    totalBookings: number;
    totalRevenue: number;
    totalActiveStaff: number;
    totalProperties: number;
  };
};

export async function fetchDashboardStats(): Promise<DashboardStats> {
  // Fecha de inicio: últimos 30 días
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const fromDate = thirtyDaysAgo.toISOString();

  // Obtener todas las reservas de los últimos 30 días
  const bookingsPage = await fetchBookingsPage({
    from: fromDate,
    limit: 100, // límite máximo permitido por la API
  });

  const bookings = bookingsPage.items;

  // Edge case: sin datos
  if (bookings.length === 0) {
    return {
      bookingsByStatus: [],
      revenueTrend: [],
      staffWorkload: [],
      topProperties: [],
      totals: {
        totalBookings: 0,
        totalRevenue: 0,
        totalActiveStaff: 0,
        totalProperties: 0,
      },
    };
  }

  // 1. Bookings por estado (ordenados por prioridad de negocio)
  const statusPriority: Record<string, number> = {
    PENDING: 1,
    CONFIRMED: 2,
    IN_PROGRESS: 3,
    COMPLETED: 4,
    CANCELLED: 5,
  };

  const statusCounts = bookings.reduce(
    (acc, booking) => {
      acc[booking.status] = (acc[booking.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const totalBookings = bookings.length;
  const bookingsByStatus = Object.entries(statusCounts)
    .map(([status, count]) => ({
      status,
      count,
      percentage: Math.round((count / totalBookings) * 100),
    }))
    .sort((a, b) => {
      const priorityA = statusPriority[a.status] ?? 999;
      const priorityB = statusPriority[b.status] ?? 999;
      return priorityA - priorityB;
    });

  // 2. Revenue trend (últimos 30 días agrupados por día)
  // Generar todos los días del rango (incluso si no hay datos)
  const revenueByDate: Record<string, number> = {};
  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    const dateStr = date.toISOString().split("T")[0];
    revenueByDate[dateStr] = 0;
  }

  // Agregar datos reales
  bookings.forEach((booking) => {
    const date = new Date(booking.scheduledAt).toISOString().split("T")[0];
    if (revenueByDate[date] !== undefined) {
      revenueByDate[date] += booking.totalAmount;
    }
  });

  const revenueTrend = Object.entries(revenueByDate)
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // 3. Staff workload
  const staffCounts = bookings.reduce(
    (acc, booking) => {
      if (booking.assignedStaff) {
        const key = booking.assignedStaff.id;
        if (!acc[key]) {
          acc[key] = {
            staffId: booking.assignedStaff.id,
            staffName:
              booking.assignedStaff.fullName ?? booking.assignedStaff.email,
            bookingsCount: 0,
          };
        }
        acc[key].bookingsCount++;
      }
      return acc;
    },
    {} as Record<
      string,
      { staffId: string; staffName: string; bookingsCount: number }
    >,
  );

  const staffWorkload = Object.values(staffCounts).sort(
    (a, b) => b.bookingsCount - a.bookingsCount,
  );

  // 4. Top properties
  const propertyCounts = bookings.reduce(
    (acc, booking) => {
      const key = booking.property.id;
      if (!acc[key]) {
        acc[key] = {
          propertyId: booking.property.id,
          propertyLabel: booking.property.label,
          bookingsCount: 0,
        };
      }
      acc[key].bookingsCount++;
      return acc;
    },
    {} as Record<
      string,
      { propertyId: string; propertyLabel: string; bookingsCount: number }
    >,
  );

  const topProperties = Object.values(propertyCounts)
    .sort((a, b) => b.bookingsCount - a.bookingsCount)
    .slice(0, 5); // Top 5

  // 5. Totales
  const totalRevenue = bookings.reduce(
    (sum, booking) => sum + booking.totalAmount,
    0,
  );

  const activeStaffIds = new Set(
    bookings.filter((b) => b.assignedStaff).map((b) => b.assignedStaff!.id),
  );

  const propertiesIds = new Set(bookings.map((b) => b.property.id));

  return {
    bookingsByStatus,
    revenueTrend,
    staffWorkload,
    topProperties,
    totals: {
      totalBookings,
      totalRevenue,
      totalActiveStaff: activeStaffIds.size,
      totalProperties: propertiesIds.size,
    },
  };
}

// ========== MARKETING CONTENT ==========

export type PortfolioStats = {
  activeProperties: number;
  averageRating: string;
  totalTurnovers: number;
  period: string;
  lastUpdated?: string;
};

export type Testimonial = {
  id: string;
  author: string;
  role: string;
  quote: string;
  order: number;
};

export type FAQ = {
  id: string;
  question: string;
  answer: string;
  order: number;
};

export type PricingTier = {
  id: string;
  tierCode: string;
  name: string;
  headline: string;
  description?: string;
  price: string;
  priceSuffix?: string;
  features: string[];
  addons?: string[];
  highlighted?: boolean;
  order: number;
};

export async function getPortfolioStats(): Promise<PortfolioStats | null> {
  const result = await safeFetch<PortfolioStats>(
    "/api/marketing/stats/portfolio",
  );
  return result?.data ?? null;
}

export async function getTestimonials(): Promise<Testimonial[]> {
  const result = await safeFetch<Testimonial[]>("/api/marketing/testimonials");
  return result?.data ?? [];
}

export async function getFAQs(): Promise<FAQ[]> {
  const result = await safeFetch<FAQ[]>("/api/marketing/faqs");
  return result?.data ?? [];
}

export async function getPricingTiers(): Promise<PricingTier[]> {
  const result = await safeFetch<PricingTier[]>("/api/marketing/pricing");
  return result?.data ?? [];
}
