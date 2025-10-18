"use client";

import { track } from "@vercel/analytics";
import * as Sentry from "@sentry/nextjs";

type AllowedPropertyValue = string | number | boolean | null;
type EventData = Record<string, AllowedPropertyValue | undefined>;

function sanitizeData(
  data?: EventData,
): Record<string, AllowedPropertyValue> | undefined {
  if (!data) return undefined;
  const entries = Object.entries(data).filter(
    ([, value]) => value !== undefined,
  );
  if (entries.length === 0) return undefined;
  return Object.fromEntries(entries) as Record<string, AllowedPropertyValue>;
}

function recordAnalyticsEvent(
  category: string,
  event: string,
  data?: EventData,
) {
  const payload = sanitizeData(data);
  try {
    if (payload) {
      track(event, payload);
    } else {
      track(event);
    }
  } catch {
    // analytics optional
  }

  try {
    Sentry.addBreadcrumb({
      category,
      message: event,
      data: payload,
      level: "info",
    });
  } catch {
    // sentry optional
  }
}

export function recordMarketingEvent(event: string, data?: EventData) {
  recordAnalyticsEvent("marketing", event, data);
}

export function recordCheckoutEvent(event: string, data?: EventData) {
  recordAnalyticsEvent("checkout", event, data);
}
