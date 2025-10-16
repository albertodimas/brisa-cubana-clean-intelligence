import type { Booking } from "@/lib/api";

type PortalBookingCardProps = {
  booking: Booking;
  scheduledLabel: string;
};

export function PortalBookingCard({
  booking,
  scheduledLabel,
}: PortalBookingCardProps) {
  return (
    <li className="rounded-2xl border border-white/70 bg-white/90 p-5 shadow-lg transition-transform hover:-translate-y-1 hover:shadow-xl dark:border-brisa-700/50 dark:bg-brisa-900/70">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-brisa-500 dark:text-brisa-300">
            {booking.status}
          </p>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {booking.service.name} · {booking.property.label}
          </h3>
        </div>
        <span className="rounded-full bg-brisa-100 px-4 py-1.5 text-xs font-semibold text-brisa-700 dark:bg-brisa-800 dark:text-brisa-200">
          {scheduledLabel}
        </span>
      </div>
      <dl className="mt-3 grid grid-cols-1 gap-2 text-sm text-gray-700 dark:text-brisa-200 sm:grid-cols-2">
        <div className="flex flex-col">
          <dt className="text-xs uppercase text-gray-500 dark:text-brisa-400">
            Propiedad
          </dt>
          <dd>{booking.property.label}</dd>
        </div>
        <div className="flex flex-col">
          <dt className="text-xs uppercase text-gray-500 dark:text-brisa-400">
            Ciudad
          </dt>
          <dd>{booking.property.city}</dd>
        </div>
        <div className="flex flex-col">
          <dt className="text-xs uppercase text-gray-500 dark:text-brisa-400">
            Duración estimada
          </dt>
          <dd>{booking.durationMin} minutos</dd>
        </div>
        <div className="flex flex-col">
          <dt className="text-xs uppercase text-gray-500 dark:text-brisa-400">
            Total estimado
          </dt>
          <dd>${booking.totalAmount.toFixed(2)}</dd>
        </div>
      </dl>
    </li>
  );
}
