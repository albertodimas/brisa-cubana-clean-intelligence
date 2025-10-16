"use client";

import { track } from "@vercel/analytics";
import * as Sentry from "@sentry/nextjs";

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

  try {
    Sentry.addBreadcrumb({
      category: "portal",
      message: event,
      data,
      level: "info",
    });
  } catch {
    // noop when Sentry is not configured
  }
}
