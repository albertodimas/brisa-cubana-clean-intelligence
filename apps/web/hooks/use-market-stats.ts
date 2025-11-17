"use client";

import { useMemo } from "react";
import {
  resolveMarketStats,
  type ResolvedMarketStat,
} from "@/lib/market-stats";

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
  return useMemo(() => resolveMarketStats(), []);
}
