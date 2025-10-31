"use client";

import { useEffect, useRef } from "react";
import { useReportWebVitals } from "next/web-vitals";
import { getSentryIfLoaded, loadSentry } from "../../lib/sentry/lazy";

type SentryModule = typeof import("@sentry/nextjs");

type WebVitalName = "CLS" | "FCP" | "FID" | "INP" | "LCP" | "TTFB";

const TRACKED_METRICS: ReadonlySet<WebVitalName> = new Set([
  "CLS",
  "FCP",
  "FID",
  "INP",
  "LCP",
  "TTFB",
]);

const METRIC_UNITS: Partial<Record<WebVitalName, string>> = {
  CLS: "ratio",
};

export function WebVitalsReporter() {
  const metricsRef = useRef<SentryModule["metrics"] | null>(
    getSentryIfLoaded()?.metrics ?? null,
  );

  useEffect(() => {
    let cancelled = false;
    void loadSentry()
      .then((sentry) => {
        if (!cancelled) {
          metricsRef.current = sentry.metrics ?? null;
        }
      })
      .catch(() => {
        // Sentry opcional
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useReportWebVitals((metric) => {
    if (!TRACKED_METRICS.has(metric.name as WebVitalName)) {
      return;
    }

    const metricsApi = metricsRef.current ?? getSentryIfLoaded()?.metrics;
    if (!metricsApi || typeof metricsApi.distribution !== "function") {
      return;
    }

    const metricName = metric.name.toLowerCase();

    (
      metricsApi as typeof metricsApi & {
        distribution: (
          name: string,
          value: number,
          options?: { unit?: string; tags?: Record<string, string> },
        ) => void;
      }
    ).distribution(`web_vital.${metricName}`, metric.value, {
      tags: {
        rating: metric.rating,
        path: typeof window !== "undefined" ? window.location.pathname : "",
      },
      unit: METRIC_UNITS[metric.name as WebVitalName] ?? "millisecond",
    });
  });

  return null;
}
