import { redirect } from "next/navigation";
import { auth } from "@/server/auth/config";
import { CalendarView } from "./calendar-view";

export default async function CalendarPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  if (!session.user.accessToken) {
    redirect("/auth/signin");
  }

  // Only STAFF and ADMIN can access calendar
  if (session.user.role === "CLIENT") {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 py-12 px-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-teal-300">
          Brisa Cubana · Calendario
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-white">
          Gestión de reservas
        </h1>
        <p className="text-sm text-neutral-400">
          Vista de calendario con asignación de servicios y disponibilidad de
          cuadrillas.
        </p>
      </div>

      <CalendarView accessToken={session.user.accessToken} />
    </div>
  );
}
