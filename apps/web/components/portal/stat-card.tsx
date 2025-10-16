type PortalStatCardProps = {
  title: string;
  value: string | number;
  helper: string;
  variant?: "primary" | "neutral";
};

const baseStyles =
  "rounded-2xl border p-4 shadow-md transition-transform hover:-translate-y-0.5";

const variants: Record<NonNullable<PortalStatCardProps["variant"]>, string> = {
  primary:
    "border-white/70 bg-gradient-to-br from-brisa-200/80 via-brisa-100/80 to-white/90 text-gray-900 dark:border-brisa-700/40 dark:from-brisa-800/70 dark:via-brisa-900/60 dark:to-brisa-950/60 dark:text-white",
  neutral:
    "border-white/70 bg-white/80 text-gray-900 dark:border-brisa-700/40 dark:bg-brisa-900/70 dark:text-white",
};

export function PortalStatCard({
  title,
  value,
  helper,
  variant = "neutral",
}: PortalStatCardProps) {
  return (
    <div className={`${baseStyles} ${variants[variant]}`}>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-brisa-400">
        {title}
      </h3>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
      <span className="text-xs text-gray-600 dark:text-brisa-300">
        {helper}
      </span>
    </div>
  );
}
