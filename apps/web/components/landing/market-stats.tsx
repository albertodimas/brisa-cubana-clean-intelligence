"use client";

import { useMemo } from "react";
import {
  CountUp,
  Tooltip,
  ScrollReveal,
  StaggerContainer,
  StaggerItem,
} from "@/components/ui";
import {
  useMarketStats,
  type ResolvedMarketStat,
} from "@/hooks/use-market-stats";

type StatDescriptor = {
  id: string;
  description: string;
};

const SNAPSHOT_STATS: StatDescriptor[] = [
  { id: "occupancy_rate", description: "Ocupación promedio anual" },
  { id: "adr_miami", description: "Tarifa diaria media (ADR) en Miami" },
  { id: "active_listings", description: "Listados activos en el mercado STR" },
  { id: "total_visitors", description: "Visitantes totales durante 2024" },
];

const HIGHLIGHT_STATS = [
  {
    id: "turnovers_per_property",
    heading: "Rotaciones por propiedad",
    body: "Media anual en STR de EE. UU.; planificamos buffers para temporadas pico sin afectar revenue.",
  },
  {
    id: "review_impact_cleaning",
    heading: "Impacto en reseñas",
    body: "Los viajeros priorizan limpieza impecable; integrar QA reduce cancelaciones y mejora ratings.",
  },
  {
    id: "occupancy_rate",
    heading: "Programación garantizada",
    prefixText: "24/7",
    body: "Disponibilidad continua con equipo en guardia, portal de cliente y alertas en tiempo real.",
  },
  {
    id: "active_listings",
    heading: "Mercado Miami",
    body: "Inventario activo al cierre de Q3 2025; coordinamos lanzamientos con foco en stays back-to-back.",
  },
];

function formatLastUpdated(value?: string) {
  if (!value) return "Fecha no disponible";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Fecha no disponible";
  }
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

function MetricValue({
  stat,
  fallback,
  className,
}: {
  stat?: ResolvedMarketStat;
  fallback: string;
  className?: string;
}) {
  if (!stat || stat.isStale) {
    return (
      <span
        className={`text-sm font-medium text-gray-400 dark:text-brisa-500 ${className ?? ""}`}
      >
        {fallback}
      </span>
    );
  }

  const presentation = stat.presentation ?? {};
  const decimals = presentation.decimals ?? 0;
  const prefix = presentation.prefix ?? "";
  const suffix = presentation.suffix ?? "";

  if (presentation.format === "range" && typeof stat.valueMax === "number") {
    return (
      <span className={`inline-flex items-baseline gap-1 ${className ?? ""}`}>
        <CountUp
          end={stat.value}
          decimals={decimals}
          prefix={prefix}
          className="font-semibold"
        />
        <span aria-hidden className="font-semibold">
          –
        </span>
        <CountUp
          end={stat.valueMax}
          decimals={decimals}
          prefix={prefix}
          suffix={suffix}
          className="font-semibold"
        />
      </span>
    );
  }

  return (
    <CountUp
      end={stat.value}
      decimals={decimals}
      prefix={prefix}
      suffix={suffix}
      className={className ? `font-semibold ${className}` : "font-semibold"}
    />
  );
}

function MetricTooltipContent({ stat }: { stat?: ResolvedMarketStat }) {
  if (!stat) {
    return <span>Fuente no disponible</span>;
  }

  const sourceNode = stat.sourceUrl ? (
    <a
      href={stat.sourceUrl}
      target="_blank"
      rel="noreferrer"
      className="underline underline-offset-2 text-teal-100"
    >
      {stat.source}
    </a>
  ) : (
    <span>{stat.source}</span>
  );

  return (
    <div className="max-w-[240px] space-y-1">
      <p className="text-xs font-semibold text-white/90">{sourceNode}</p>
      {stat.period ? (
        <p className="text-[11px] text-white/70">Periodo: {stat.period}</p>
      ) : null}
      <p className="text-[11px] text-white/70">
        Actualizado: {formatLastUpdated(stat.lastUpdated)}
      </p>
      {stat.notes ? (
        <p className="text-[11px] text-white/60">{stat.notes}</p>
      ) : null}
    </div>
  );
}

export function MarketStatsSnapshot() {
  const { get, fallbackLabel } = useMarketStats();

  const stats = useMemo(
    () =>
      SNAPSHOT_STATS.map((descriptor) => ({
        descriptor,
        stat: get(descriptor.id),
      })),
    [get],
  );

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
            <Tooltip
              content={<MetricTooltipContent stat={stat} />}
              position="top"
            >
              <span className="inline-block text-lg font-semibold text-brisa-700 dark:text-brisa-300">
                <MetricValue stat={stat} fallback={fallbackLabel} />
              </span>
            </Tooltip>
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

export function MarketHighlightsGrid() {
  const { get, fallbackLabel } = useMarketStats();
  const highlights = useMemo(
    () =>
      HIGHLIGHT_STATS.map((item) => ({
        ...item,
        stat: get(item.id),
      })),
    [get],
  );

  return (
    <ScrollReveal variant="scale" delay={0.2}>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 rounded-3xl border border-white/70 glass-strong p-6 shadow-xl">
        <StaggerContainer staggerDelay={0.15}>
          {highlights.map((item) => (
            <StaggerItem key={item.id}>
              <div className="flex flex-col gap-1">
                <span className="text-sm uppercase tracking-[0.2em] text-brisa-500 dark:text-brisa-300">
                  {item.heading}
                </span>
                {item.prefixText ? (
                  <span className="text-3xl font-semibold text-brisa-700 dark:text-white tabular-nums">
                    {item.prefixText}
                  </span>
                ) : (
                  <Tooltip
                    content={<MetricTooltipContent stat={item.stat} />}
                    position="top"
                  >
                    <span className="text-3xl font-semibold text-brisa-700 dark:text-white tabular-nums">
                      <MetricValue
                        stat={item.stat}
                        fallback={fallbackLabel}
                        className="text-3xl"
                      />
                    </span>
                  </Tooltip>
                )}
                <p className="text-sm text-gray-600 dark:text-brisa-300 leading-snug">
                  {item.body}
                </p>
                {item.stat ? (
                  <p className="text-[11px] text-gray-500 dark:text-brisa-500">
                    {item.stat.sourceUrl ? (
                      <a
                        href={item.stat.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="underline underline-offset-2 text-[#0f8c94] dark:text-[#7adfe9]"
                      >
                        {item.stat.source}
                      </a>
                    ) : (
                      <span>{item.stat.source}</span>
                    )}
                    {item.stat.lastUpdated ? (
                      <>
                        {" "}
                        ·{" "}
                        <time dateTime={item.stat.lastUpdated}>
                          {formatLastUpdated(item.stat.lastUpdated)}
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
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </ScrollReveal>
  );
}
