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

  if (!session?.user?.accessToken) {
    redirect("/auth/signin");
  }

  const accessToken = session.user.accessToken;
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:3001";

  const response = await fetch(`${apiBase}/api/reports/cleanscore?limit=50`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  const data = (await response.json()) as {
    reports?: unknown[];
    pagination?: unknown;
  };

  return (
    <CleanScoreDashboard
      initialReports={(data.reports as CleanScoreReport[]) ?? []}
      accessToken={accessToken}
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
    property: { name: string; address: string };
    service: { name: string };
    user?: { id: string; name: string | null; email: string };
  };
}
