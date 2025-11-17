import { differenceInCalendarDays, isValid, parseISO } from "date-fns";
import rawMarketStats from "@/data/marketStats.json";

export type MarketStatPresentation = {
  prefix?: string;
  suffix?: string;
  decimals?: number;
  format?: "default" | "range";
  locale?: string;
};

export type MarketStat = {
  metricId: string;
  label: string;
  value: number;
  valueMax?: number;
  unit?: string;
  period?: string;
  source: string;
  sourceUrl: string;
  lastUpdated: string;
  notes?: string;
  presentation?: MarketStatPresentation;
};

export type ResolvedMarketStat = MarketStat & {
  isStale: boolean;
  fallbackLabel: string;
};

const STALE_THRESHOLD_DAYS = 120;

export function resolveMarketStats(): {
  metrics: ResolvedMarketStat[];
  get: (metricId: string) => ResolvedMarketStat | undefined;
  has: (metricId: string) => boolean;
  fallbackLabel: string;
  staleThresholdDays: number;
} {
  const fallbackLabel = "Dato en actualización";
  const now = new Date();
  const entries = new Map<string, ResolvedMarketStat>();

  (rawMarketStats as MarketStat[]).forEach((stat) => {
    const parsedDate = parseISO(stat.lastUpdated);
    const validDate = isValid(parsedDate);
    const isStale =
      !validDate ||
      differenceInCalendarDays(now, parsedDate) > STALE_THRESHOLD_DAYS;

    entries.set(stat.metricId, {
      ...stat,
      isStale,
      fallbackLabel,
    });
  });

  return {
    metrics: Array.from(entries.values()),
    get: (metricId: string) => entries.get(metricId),
    has: (metricId: string) => entries.has(metricId),
    fallbackLabel,
    staleThresholdDays: STALE_THRESHOLD_DAYS,
  };
}

export { STALE_THRESHOLD_DAYS };
