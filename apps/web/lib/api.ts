import { auth } from "@/auth";
import { cookies } from "next/headers";

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

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

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

async function safeFetch<T>(path: string): Promise<ApiResponse<T> | null> {
  const authorization = await resolveAuthHeader();
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (authorization) {
      headers.Authorization = authorization;
    }

    const res = await fetch(`${API_URL}${path}`, {
      headers,
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
  params: PaginationQuery = {},
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
