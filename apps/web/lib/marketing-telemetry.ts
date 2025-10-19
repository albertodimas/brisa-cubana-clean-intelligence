"use client";

import { track } from "@vercel/analytics";
import * as Sentry from "@sentry/nextjs";
import posthog from "posthog-js";

type AllowedPropertyValue = string | number | boolean | null;
type EventData = Record<string, AllowedPropertyValue | undefined>;

const HAS_POSTHOG_KEY = Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY);

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
  const posthogProperties = payload ? { ...payload, category } : { category };

  try {
    if (payload) {
      track(event, payload);
    } else {
      track(event);
    }
  } catch {
    // analytics optional
  }

  if (HAS_POSTHOG_KEY) {
    try {
      posthog.capture(event, posthogProperties);
    } catch {
      // posthog optional
    }
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
