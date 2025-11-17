"use client";

import { useMemo } from "react";
import { useMarketStats } from "@/hooks/use-market-stats";
import { HIGHLIGHT_STATS, formatLastUpdated } from "./market-stats-shared";
import {
  CountUp,
  ScrollReveal,
  StaggerContainer,
  StaggerItem,
  Tooltip,
} from "@/components/ui";

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

function MetricValue({
  stat,
  fallback,
  className,
}: {
  stat?: ReturnType<typeof useMarketStats>["get"] extends (
    ...args: any[]
  ) => infer R
    ? R
    : undefined;
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

function MetricTooltipContent({
  stat,
}: {
  stat?: ReturnType<typeof useMarketStats>["get"] extends (
    ...args: any[]
  ) => infer R
    ? R
    : undefined;
}) {
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
