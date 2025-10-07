import "server-only";
import { env } from "@/config/env";

const API_BASE_URL = env.apiUrl;

interface PaymentAlertEntry {
  id: string;
  failedPayments: number;
  pendingPayments: number;
  triggeredAt: string;
  payloadHash: string;
}

interface NoteEntry {
  id: string;
  message: string;
  createdAt: string;
  resolvedAt?: string | null;
  author?: { name: string | null; email: string };
  resolvedBy?: { name: string | null; email: string } | null;
}

interface AuditTrailFilters {
  startDate?: string;
  endDate?: string;
  limit?: number;
  authorEmail?: string;
  bookingId?: string;
  minFailed?: number;
  minPending?: number;
}

interface AuditTrailResponse {
  alerts: PaymentAlertEntry[];
  notesResolved: NoteEntry[];
  notesOpen: NoteEntry[];
}

function buildQuery(filters?: AuditTrailFilters) {
  const params = new URLSearchParams();
  if (filters?.startDate) {
    params.set("startDate", filters.startDate);
  }
  if (filters?.endDate) {
    params.set("endDate", filters.endDate);
  }
  if (filters?.limit) {
    params.set("limit", String(filters.limit));
  }
  if (filters?.authorEmail) {
    params.set("authorEmail", filters.authorEmail);
  }
  if (filters?.bookingId) {
    params.set("bookingId", filters.bookingId);
  }
  if (typeof filters?.minFailed === "number") {
    params.set("minFailed", String(filters.minFailed));
  }
  if (typeof filters?.minPending === "number") {
    params.set("minPending", String(filters.minPending));
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

export async function getAuditTrail(
  filters?: AuditTrailFilters,
): Promise<AuditTrailResponse> {
  const query = buildQuery(filters);

  const [alertsResponse, resolvedResponse, openResponse] = await Promise.all([
    fetch(`${API_BASE_URL}/api/alerts/payment${query}`, {
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      cache: "no-store",
    }),
    fetch(`${API_BASE_URL}/api/reconciliation/history/resolved${query}`, {
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      cache: "no-store",
    }),
    fetch(`${API_BASE_URL}/api/reconciliation/history/open${query}`, {
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      cache: "no-store",
    }),
  ]);

  if (!alertsResponse.ok) {
    throw new Error("No se pudieron obtener las alertas");
  }

  if (!resolvedResponse.ok || !openResponse.ok) {
    throw new Error("No se pudieron obtener las notas resueltas");
  }

  return {
    alerts: (await alertsResponse.json()) as PaymentAlertEntry[],
    notesResolved: (await resolvedResponse.json()) as NoteEntry[],
    notesOpen: (await openResponse.json()) as NoteEntry[],
  };
}
