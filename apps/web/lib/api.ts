import { auth } from "@/auth";

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

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type ApiListResponse<T> = {
  data: T;
};

async function resolveAuthHeader(): Promise<string | null> {
  const session = await auth();
  const token = session?.accessToken;
  return token ? `Bearer ${token}` : null;
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

async function safeFetch<T>(path: string): Promise<T | null> {
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

    const json = (await res.json()) as ApiListResponse<T>;
    return json.data;
  } catch (error) {
    console.warn(`[api] request to ${path} threw`, error);
    return null;
  }
}

export async function fetchServices(): Promise<Service[]> {
  const data = await safeFetch<Service[]>("/api/services");
  return data ?? [];
}

export type BookingFilters = {
  from?: string;
  to?: string;
  status?: string;
  propertyId?: string;
  serviceId?: string;
  customerId?: string;
};

export async function fetchBookings(
  filters: BookingFilters = {},
): Promise<Booking[]> {
  const query = buildQuery(filters);
  const data = await safeFetch<Booking[]>(`/api/bookings${query}`);
  return data ?? [];
}

export async function fetchProperties(): Promise<Property[]> {
  const data = await safeFetch<Property[]>("/api/properties");
  return data ?? [];
}

export async function fetchCustomers(): Promise<Customer[]> {
  const data = await safeFetch<Customer[]>("/api/customers");
  return data ?? [];
}
