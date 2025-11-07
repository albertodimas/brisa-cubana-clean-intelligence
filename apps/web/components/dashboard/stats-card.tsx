type StatsCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
};

export function StatsCard({
  title,
  value,
  subtitle,
  trend,
  icon,
}: StatsCardProps) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-brisa-800 bg-white dark:bg-brisa-900/60 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 dark:text-brisa-300">
            {title}
          </p>
          <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-sm text-gray-500 dark:text-brisa-400">
              {subtitle}
            </p>
          )}
          {trend && (
            <div className="mt-2 flex items-center gap-1">
              <span
                className={`text-sm font-medium ${
                  trend.isPositive
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
              </span>
              <span className="text-sm text-gray-500 dark:text-brisa-400">
                vs mes anterior
              </span>
            </div>
          )}
        </div>
        {icon && (
          <div className="ml-4 flex-shrink-0 text-gray-400 dark:text-brisa-500">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
