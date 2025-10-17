import type { ReactNode } from "react";

type PortalCalloutProps = {
  title: string;
  description: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
};

export function PortalCallout({
  title,
  description,
  action,
  icon,
}: PortalCalloutProps) {
  return (
    <section
      className="rounded-3xl border border-white/70 bg-white/90 p-8 text-sm text-gray-700 shadow-xl backdrop-blur-md dark:border-brisa-700/50 dark:bg-brisa-900/80 dark:text-brisa-200"
      aria-live="polite"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-start gap-3">
          {icon ? (
            <div className="h-10 w-10 text-brisa-600 dark:text-brisa-300">
              {icon}
            </div>
          ) : null}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h2>
            <div className="mt-2 max-w-xl text-sm text-gray-600 dark:text-brisa-300">
              {description}
            </div>
          </div>
        </div>
        {action}
      </div>
    </section>
  );
}
