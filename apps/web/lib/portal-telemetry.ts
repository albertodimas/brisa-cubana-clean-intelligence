"use client";

import { track } from "@vercel/analytics";
import { loadSentry } from "./sentry/lazy";

type TelemetryPrimitive = string | number | boolean | null;
type TelemetryData = Record<string, TelemetryPrimitive>;

export function recordPortalEvent(event: string, data?: TelemetryData) {
  try {
    if (data) {
      track(event, data);
    } else {
      track(event);
    }
  } catch {
    // noop when analytics is unavailable
  }

  void loadSentry()
    .then((sentry) => {
      if (typeof sentry.addBreadcrumb === "function") {
        sentry.addBreadcrumb({
          category: "portal",
          message: event,
          data,
          level: "info",
        });
      }
    })
    .catch(() => {
      // noop when Sentry is not configured
    });
}
