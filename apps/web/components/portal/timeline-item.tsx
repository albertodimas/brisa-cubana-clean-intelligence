type PortalTimelineItemProps = {
  title: string;
  status: string;
  meta: string;
  bookingId?: string;
};

export function PortalTimelineItem({
  title,
  status,
  meta,
  bookingId,
}: PortalTimelineItemProps) {
  return (
    <li className="relative pl-4">
      <span className="absolute left-[-1.1rem] top-1 flex h-3 w-3 rounded-full bg-gradient-to-br from-brisa-400 to-brisa-600 shadow-lg shadow-brisa-200/60 dark:from-brisa-500 dark:to-brisa-300" />
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-3">
        <span className="text-[11px] uppercase tracking-[0.2em] text-gray-500 dark:text-brisa-400">
          {status}
        </span>
        <strong className="text-sm text-gray-900 sm:text-base dark:text-white">
          {title}
        </strong>
      </div>
      <p className="text-xs text-gray-500 dark:text-brisa-400">{meta}</p>
      {bookingId && (
        <a
          href={`/api/portal/bookings/${bookingId}/pdf`}
          download
          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
        >
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Descargar comprobante
        </a>
      )}
    </li>
  );
}
