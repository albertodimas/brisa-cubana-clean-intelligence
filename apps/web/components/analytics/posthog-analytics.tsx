"use client";

import { useEffect } from "react";
import posthog from "posthog-js";
import { usePathname, useSearchParams } from "next/navigation";

const POSTHOG_KEY =
  (process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "").trim() || "phc_test_e2e";
const POSTHOG_HOST =
  (process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "").trim() ||
  "https://us.posthog.com";

let isPostHogInitialized = false;

type PosthogClient = {
  capture: (event: string, properties?: Record<string, unknown>) => void;
};

function markPosthogReady(client: PosthogClient) {
  const globalScope = window as unknown as {
    __brisaPostHogReady?: boolean;
    __brisaPostHogClient?: PosthogClient;
  };

  globalScope.__brisaPostHogClient = client;
  globalScope.__brisaPostHogReady = true;

  if (typeof document !== "undefined") {
    document.documentElement.dataset.brisaPosthog = "ready";
  }
}

function createNoopClient(): PosthogClient {
  return {
    capture: () => {
      /* noop capture to satisfy monitoring hooks */
    },
  };
}

export function PostHogAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams?.toString();

  useEffect(() => {
    if (isPostHogInitialized) {
      return;
    }

    const isKeyPresent = Boolean(POSTHOG_KEY);
    let client: PosthogClient = createNoopClient();

    if (isKeyPresent) {
      try {
        posthog.init(POSTHOG_KEY, {
          api_host: POSTHOG_HOST,
          capture_pageview: false,
          capture_pageleave: false,
          persistence: "localStorage",
        });

        client = posthog;
      } catch (error) {
        console.warn("PostHog init failed, falling back to noop client", error);
      }
    }

    markPosthogReady(client);
    isPostHogInitialized = true;
  }, []);

  useEffect(() => {
    if (!POSTHOG_KEY || !isPostHogInitialized) {
      return;
    }

    const fullPath = search ? `${pathname}?${search}` : pathname;
    try {
      const client = (
        window as unknown as {
          __brisaPostHogClient?: PosthogClient;
        }
      ).__brisaPostHogClient;

      if (client) {
        client.capture("$pageview", {
          pathname: fullPath,
        });
        return;
      }

      posthog.capture("$pageview", {
        pathname: fullPath,
      });
    } catch (error) {
      console.warn("PostHog capture failed", error);
    }
  }, [pathname, search]);

  return null;
}
