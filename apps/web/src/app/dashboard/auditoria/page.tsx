import { redirect } from "next/navigation";
import Link from "next/link";
import { Badge, Card } from "@brisa/ui";
import { auth } from "@/server/auth/config";
import { getAuditTrail } from "@/server/api/audit";

interface AuditTrailPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AuditTrailPage(props: AuditTrailPageProps) {
  const searchParams = await props.searchParams;
  const session = await auth();

  if (
    !session?.user ||
    (session.user.role !== "ADMIN" && session.user.role !== "STAFF")
  ) {
    redirect("/auth/signin");
  }

  const startDateParam =
    typeof searchParams?.startDate === "string"
      ? searchParams?.startDate
      : undefined;
  const endDateParam =
    typeof searchParams?.endDate === "string"
      ? searchParams?.endDate
      : undefined;
  const limitParam =
    typeof searchParams?.limit === "string"
      ? Number.parseInt(searchParams?.limit, 10)
      : undefined;

  const authorEmailParam =
    typeof searchParams?.authorEmail === "string"
      ? searchParams?.authorEmail
      : undefined;
  const bookingIdParam =
    typeof searchParams?.bookingId === "string"
      ? searchParams?.bookingId
      : undefined;
  const minFailedRaw =
    typeof searchParams?.minFailed === "string"
      ? Number.parseInt(searchParams?.minFailed, 10)
      : undefined;
  const minPendingRaw =
    typeof searchParams?.minPending === "string"
      ? Number.parseInt(searchParams?.minPending, 10)
      : undefined;
  const minFailedValid =
    minFailedRaw !== undefined && !Number.isNaN(minFailedRaw);
  const minPendingValid =
    minPendingRaw !== undefined && !Number.isNaN(minPendingRaw);
  const currentTab =
    typeof searchParams?.tab === "string" ? searchParams?.tab : "resueltas";

  const { alerts, notesResolved, notesOpen } = await getAuditTrail(
    session.user.accessToken ?? "",
    {
      startDate: startDateParam,
      endDate: endDateParam,
      limit: limitParam && !Number.isNaN(limitParam) ? limitParam : undefined,
      authorEmail: authorEmailParam,
      bookingId: bookingIdParam,
      minFailed: minFailedValid ? minFailedRaw : undefined,
      minPending: minPendingValid ? minPendingRaw : undefined,
    },
  );

  const activeNotes = currentTab === "abiertas" ? notesOpen : notesResolved;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-16 text-neutral-100">
      <div className="flex flex-col gap-3">
        <p className="text-xs uppercase tracking-[0.3em] text-teal-300">
          Brisa Cubana · Auditoría
        </p>
        <h1 className="text-4xl font-semibold text-white">
          Historial de alertas y conciliaciones
        </h1>
        <p className="text-sm text-neutral-400">
          Monitorea el registro de alertas generadas por pagos críticos y revisa
          el seguimiento que el equipo ha realizado en cada nota de
          conciliación.
        </p>
        <Link
          href="/dashboard"
          className="text-xs uppercase tracking-[0.25em] text-teal-200 hover:text-teal-100"
        >
          ← Volver al dashboard
        </Link>
      </div>

      <form
        className="grid gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-4 text-sm text-neutral-200 sm:grid-cols-5"
        method="get"
      >
        <input type="hidden" name="tab" value={currentTab} />
        <label className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-[0.25em] text-neutral-400">
            Desde
          </span>
          <input
            type="date"
            name="startDate"
            defaultValue={startDateParam ?? ""}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-teal-400 focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-[0.25em] text-neutral-400">
            Hasta
          </span>
          <input
            type="date"
            name="endDate"
            defaultValue={endDateParam ?? ""}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-teal-400 focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-[0.25em] text-neutral-400">
            Límite
          </span>
          <input
            type="number"
            name="limit"
            min={1}
            max={100}
            defaultValue={
              limitParam && !Number.isNaN(limitParam)
                ? String(limitParam)
                : "20"
            }
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-teal-400 focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-[0.25em] text-neutral-400">
            Autor (email)
          </span>
          <input
            type="email"
            name="authorEmail"
            defaultValue={authorEmailParam ?? ""}
            placeholder="team@brisa.com"
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-teal-400 focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-[0.25em] text-neutral-400">
            Booking ID
          </span>
          <input
            type="text"
            name="bookingId"
            defaultValue={bookingIdParam ?? ""}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-teal-400 focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-[0.25em] text-neutral-400">
            Mín. fallidos
          </span>
          <input
            type="number"
            name="minFailed"
            min={0}
            defaultValue={minFailedValid ? String(minFailedRaw) : ""}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-teal-400 focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-[0.25em] text-neutral-400">
            Mín. pendientes
          </span>
          <input
            type="number"
            name="minPending"
            min={0}
            defaultValue={minPendingValid ? String(minPendingRaw) : ""}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-teal-400 focus:outline-none"
          />
        </label>
        <div className="flex items-end gap-3">
          <button
            type="submit"
            className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-neutral-200 transition hover:border-teal-300 hover:text-teal-200"
          >
            Aplicar filtros
          </button>
          <Link
            href={`/dashboard/auditoria?tab=${currentTab}`}
            className="rounded-full border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.25em] text-neutral-400 hover:border-white/20 hover:text-white"
          >
            Limpiar
          </Link>
        </div>
        <div className="flex items-end justify-end">
          <Link
            href={`/api/audit/export?${new URLSearchParams({
              ...(startDateParam ? { startDate: startDateParam } : {}),
              ...(endDateParam ? { endDate: endDateParam } : {}),
              ...(limitParam && !Number.isNaN(limitParam)
                ? { limit: String(limitParam) }
                : {}),
              ...(authorEmailParam ? { authorEmail: authorEmailParam } : {}),
              ...(bookingIdParam ? { bookingId: bookingIdParam } : {}),
              ...(minFailedRaw && !Number.isNaN(minFailedRaw)
                ? { minFailed: String(minFailedRaw) }
                : {}),
              ...(minPendingRaw && !Number.isNaN(minPendingRaw)
                ? { minPending: String(minPendingRaw) }
                : {}),
              tab: currentTab,
            }).toString()}`}
            className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-neutral-200 transition hover:border-teal-300 hover:text-teal-200"
          >
            Exportar CSV
          </Link>
        </div>
      </form>

      <div className="flex items-center gap-3">
        <Link
          href={`/dashboard/auditoria?${new URLSearchParams({
            ...Object.fromEntries(
              Object.entries({
                startDate: startDateParam,
                endDate: endDateParam,
                limit: limitParam,
                authorEmail: authorEmailParam,
                bookingId: bookingIdParam,
                minFailed: minFailedRaw?.toString(),
                minPending: minPendingRaw?.toString(),
              }).filter(([, value]) => value),
            ),
            tab: "resueltas",
          }).toString()}`}
          className={`text-xs uppercase tracking-[0.25em] ${currentTab === "resueltas" ? "text-teal-200" : "text-neutral-500 hover:text-neutral-200"}`}
        >
          Notas resueltas
        </Link>
        <Link
          href={`/dashboard/auditoria?${new URLSearchParams({
            ...Object.fromEntries(
              Object.entries({
                startDate: startDateParam,
                endDate: endDateParam,
                limit: limitParam,
                authorEmail: authorEmailParam,
                bookingId: bookingIdParam,
                minFailed: minFailedRaw?.toString(),
                minPending: minPendingRaw?.toString(),
              }).filter(([, value]) => value),
            ),
            tab: "abiertas",
          }).toString()}`}
          className={`text-xs uppercase tracking-[0.25em] ${currentTab === "abiertas" ? "text-teal-200" : "text-neutral-500 hover:text-neutral-200"}`}
        >
          Notas abiertas
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card
          title="Alertas de pago"
          description="Últimos eventos enviados a Slack o registrados por el sistema."
        >
          <ul className="mt-4 space-y-3 text-sm text-neutral-300">
            {alerts.length === 0 ? (
              <li className="rounded border border-white/10 bg-white/[0.05] px-3 py-2 text-neutral-500">
                No se han generado alertas recientemente.
              </li>
            ) : (
              alerts.map((alert) => (
                <li
                  key={alert.id}
                  className="rounded border border-white/10 bg-white/[0.05] px-3 py-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                      {new Date(alert.triggeredAt).toLocaleString("es-US")}
                    </span>
                    <Badge tone="sunset">{alert.failedPayments} fallidos</Badge>
                  </div>
                  <p className="text-xs text-neutral-400">
                    Pendientes: {alert.pendingPayments}
                  </p>
                </li>
              ))
            )}
          </ul>
        </Card>

        <Card
          title={
            currentTab === "abiertas" ? "Notas abiertas" : "Notas resueltas"
          }
          description={
            currentTab === "abiertas"
              ? "Conciliaciones pendientes de resolución."
              : "Últimas conciliaciones marcadas como resueltas por el equipo."
          }
        >
          <ul className="mt-4 space-y-3 text-sm text-neutral-300">
            {activeNotes.length === 0 ? (
              <li className="rounded border border-white/10 bg-white/[0.05] px-3 py-2 text-neutral-500">
                {currentTab === "abiertas"
                  ? "No hay notas abiertas según los filtros."
                  : "Aún no hay notas resueltas en el sistema."}
              </li>
            ) : (
              activeNotes.map((note) => (
                <li
                  key={note.id}
                  className="rounded border border-white/10 bg-white/[0.05] px-3 py-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                      {new Date(
                        note.resolvedAt ?? note.createdAt,
                      ).toLocaleString("es-US")}
                    </span>
                    <Badge tone={currentTab === "abiertas" ? "sunset" : "teal"}>
                      {currentTab === "abiertas" ? "Abierta" : "Resuelta"}
                    </Badge>
                  </div>
                  <p className="text-neutral-200">{note.message}</p>
                  <p className="text-[11px] uppercase tracking-[0.25em] text-neutral-500">
                    Autor:{" "}
                    {note.author?.name ?? note.author?.email ?? "Desconocido"}
                  </p>
                  {note.resolvedBy ? (
                    <p className="text-[11px] uppercase tracking-[0.25em] text-neutral-500">
                      Resuelta por:{" "}
                      {note.resolvedBy.name ?? note.resolvedBy.email}
                    </p>
                  ) : null}
                </li>
              ))
            )}
          </ul>
        </Card>
      </div>
    </div>
  );
}
