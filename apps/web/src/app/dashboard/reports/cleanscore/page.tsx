import { auth } from "@/server/auth/config";
import { redirect } from "next/navigation";
import CleanScoreDashboard from "./clean-score-dashboard";

export const metadata = {
  title: "CleanScore™ | Brisa Cubana",
  description:
    "Supervisa reportes CleanScore™, genera nuevas inspecciones y publica resultados para los clientes.",
};

export default async function CleanScoreReportsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:3001";

  const response = await fetch(`${apiBase}/api/reports/cleanscore?limit=50`, {
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    cache: "no-store",
  });

  const data = (await response.json()) as {
    reports?: unknown[];
    pagination?: unknown;
  };

  return (
    <CleanScoreDashboard
      initialReports={(data.reports as CleanScoreReport[]) ?? []}
      apiBase={apiBase}
    />
  );
}

export interface CleanScoreReport {
  id: string;
  bookingId: string;
  status: "DRAFT" | "PUBLISHED";
  score: number;
  metrics: {
    generalCleanliness: number;
    kitchen: number;
    bathrooms: number;
    premiumDetails: number;
    ambiance: number;
    timeCompliance: number;
  };
  photos: Array<{ url: string; caption: string; category: "before" | "after" }>;
  videos: string[];
  checklist: Array<{
    area: string;
    status: "PASS" | "WARN" | "FAIL";
    notes?: string;
  }>;
  observations: string;
  recommendations: string[];
  teamMembers: string[];
  generatedBy: string;
  sentToEmail: string | null;
  createdAt: string;
  updatedAt: string;
  booking?: {
    id: string;
    status: string;
    scheduledAt: string;
    completedAt: string | null;
    property?: { name: string | null; address: string | null };
    service?: { name: string | null };
    user?: { id: string; name: string | null; email: string };
  };
}
