"use client";

import { track } from "@vercel/analytics";
import { loadSentry } from "./sentry/lazy";
type PosthogClient = {
  capture: (event: string, properties?: Record<string, unknown>) => void;
};

type AllowedPropertyValue = string | number | boolean | null;
type EventData = Record<string, AllowedPropertyValue | undefined>;

const POSTHOG_DISABLED =
  (process.env.NEXT_PUBLIC_POSTHOG_DISABLED ?? "").toLowerCase() === "true";
const HAS_POSTHOG_KEY =
  !POSTHOG_DISABLED && Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY);
const globalScope =
  typeof window !== "undefined"
    ? (window as unknown as {
        __brisaPostHogClient?: PosthogClient;
        __brisaPostHogPromise?: Promise<PosthogClient>;
      })
    : undefined;

function captureWithPosthog(
  event: string,
  properties?: Record<string, unknown>,
) {
  if (POSTHOG_DISABLED || !HAS_POSTHOG_KEY || !globalScope) {
    return;
  }

  const attemptCapture = (client: PosthogClient | undefined) => {
    if (!client) {
      return;
    }

    try {
      client.capture(event, properties);
    } catch {
      // posthog optional
    }
  };

  if (globalScope.__brisaPostHogClient) {
    attemptCapture(globalScope.__brisaPostHogClient);
    return;
  }

  globalScope.__brisaPostHogPromise
    ?.then((client) => {
      attemptCapture(client);
    })
    .catch(() => {
      // posthog optional
    });
}

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

  captureWithPosthog(event, posthogProperties);

  void loadSentry()
    .then((sentry) => {
      if (typeof sentry.addBreadcrumb === "function") {
        sentry.addBreadcrumb({
          category,
          message: event,
          data: payload,
          level: "info",
        });
      }
    })
    .catch(() => {
      // sentry optional
    });
}

export function recordMarketingEvent(event: string, data?: EventData) {
  recordAnalyticsEvent("marketing", event, data);
}

export function recordCheckoutEvent(event: string, data?: EventData) {
  recordAnalyticsEvent("checkout", event, data);
}

export function recordCalendarEvent(event: string, data?: EventData) {
  recordAnalyticsEvent("calendar", event, data);
}
