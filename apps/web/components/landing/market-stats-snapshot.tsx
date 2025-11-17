import {
  resolveMarketStats,
  type ResolvedMarketStat,
} from "@/lib/market-stats";
import { SNAPSHOT_STATS, formatLastUpdated } from "./market-stats-shared";

export function MarketStatsSnapshot() {
  const { get, fallbackLabel } = resolveMarketStats();

  const stats = SNAPSHOT_STATS.map((descriptor) => ({
    descriptor,
    stat: get(descriptor.id),
  }));

  return (
    <div
      data-testid="market-stats-snapshot"
      className="grid gap-4 rounded-2xl bg-gradient-to-br from-brisa-100 via-white to-white p-6 dark:from-brisa-900/60 dark:via-brisa-950"
    >
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-semibold text-brisa-700 dark:text-brisa-100">
          Datos clave actualizados
        </p>
        <span className="rounded-full bg-brisa-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-brisa-500 dark:bg-brisa-900/60 dark:text-brisa-300">
          Fuente verificada
        </span>
      </div>
      <dl className="grid grid-cols-2 gap-3 text-sm text-gray-700 dark:text-brisa-200 sm:grid-cols-4">
        {stats.map(({ descriptor, stat }) => (
          <div key={descriptor.id} className="space-y-0.5">
            <span className="inline-block text-lg font-semibold text-brisa-700 dark:text-brisa-300">
              {formatStatValue(stat, fallbackLabel)}
            </span>
            <dd className="text-xs leading-snug text-gray-600 dark:text-brisa-400">
              {stat?.label ?? descriptor.description}
            </dd>
            {stat ? (
              <p className="text-[11px] text-gray-500 dark:text-brisa-500">
                {stat.sourceUrl ? (
                  <a
                    href={stat.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="underline underline-offset-2 text-[#0f8c94] dark:text-[#7adfe9]"
                  >
                    {stat.source}
                  </a>
                ) : (
                  <span>{stat.source}</span>
                )}
                {stat.lastUpdated ? (
                  <>
                    {" "}
                    ·{" "}
                    <time dateTime={stat.lastUpdated}>
                      {formatLastUpdated(stat.lastUpdated)}
                    </time>
                  </>
                ) : null}
              </p>
            ) : (
              <p className="text-[11px] text-gray-400 dark:text-brisa-500">
                Actualización pendiente
              </p>
            )}
          </div>
        ))}
      </dl>
    </div>
  );
}

function formatStatValue(
  stat: ResolvedMarketStat | undefined,
  fallback: string,
) {
  if (!stat || stat.isStale) {
    return fallback;
  }

  const locale = stat.presentation?.locale ?? "en-US";
  const formatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: stat.presentation?.decimals ?? 0,
    maximumFractionDigits: stat.presentation?.decimals ?? 0,
  });

  const prefix = stat.presentation?.prefix ?? "";
  const suffix = stat.presentation?.suffix ?? "";

  if (
    stat.presentation?.format === "range" &&
    typeof stat.valueMax === "number"
  ) {
    return `${prefix}${formatter.format(stat.value)} – ${formatter.format(
      stat.valueMax,
    )}${suffix}`;
  }

  return `${prefix}${formatter.format(stat.value)}${suffix}`;
}
