type PortalTimelineItemProps = {
  title: string;
  status: string;
  meta: string;
};

export function PortalTimelineItem({
  title,
  status,
  meta,
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
    </li>
  );
}
