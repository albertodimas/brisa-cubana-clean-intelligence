import { Suspense } from "react";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { MarketingPanel } from "@/components/marketing-panel";
import { Skeleton } from "@/components/ui";

export const metadata: Metadata = {
  title: "Marketing · Panel de Administración",
  description: "Gestión de contenido de marketing",
};

export default async function MarketingPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Solo Admin y Coordinator pueden acceder
  if (session.user.role !== "ADMIN" && session.user.role !== "COORDINATOR") {
    redirect("/panel");
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-brisa-950">
      <Suspense
        fallback={
          <div className="p-8">
            <Skeleton className="h-8 w-64 mb-6" />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Skeleton className="h-48" />
              <Skeleton className="h-48" />
              <Skeleton className="h-48" />
            </div>
          </div>
        }
      >
        <MarketingPanel />
      </Suspense>
    </div>
  );
}
