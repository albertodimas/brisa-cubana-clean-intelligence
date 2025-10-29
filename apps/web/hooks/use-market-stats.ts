"use client";

import { useMemo } from "react";
import { differenceInCalendarDays, isValid, parseISO } from "date-fns";
import rawMarketStats from "@/data/marketStats.json";

export type MarketStatPresentation = {
  prefix?: string;
  suffix?: string;
  decimals?: number;
  format?: "default" | "range";
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

/**
 * Hook para obtener las métricas de mercado centralizadas y detectar si están desactualizadas.
 * Usa un JSON estático (data/marketStats.json) para evitar que los componentes caigan en valores "0".
 */
export function useMarketStats(): {
  metrics: ResolvedMarketStat[];
  get: (metricId: string) => ResolvedMarketStat | undefined;
  has: (metricId: string) => boolean;
  fallbackLabel: string;
  staleThresholdDays: number;
} {
  return useMemo(() => {
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
        fallbackLabel: "Dato en actualización",
      });
    });

    return {
      metrics: Array.from(entries.values()),
      get: (metricId: string) => entries.get(metricId),
      has: (metricId: string) => entries.has(metricId),
      fallbackLabel: "Dato en actualización",
      staleThresholdDays: STALE_THRESHOLD_DAYS,
    };
  }, []);
}
