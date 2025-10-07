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
  totalAmount: number;
  status: string;
  service: { id: string; name: string; basePrice: number };
  property: { id: string; label: string; city: string };
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type ApiListResponse<T> = {
  data: T;
};

async function safeFetch<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
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

export async function fetchUpcomingBookings(): Promise<Booking[]> {
  const data = await safeFetch<Booking[]>("/api/bookings");
  return data ?? [];
}
