"use client";

import { useEffect } from "react";
import posthog from "posthog-js";
import { usePathname, useSearchParams } from "next/navigation";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.posthog.com";

let isPostHogInitialized = false;

export function PostHogAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams?.toString();

  useEffect(() => {
    if (!POSTHOG_KEY) {
      return;
    }

    if (!isPostHogInitialized) {
      posthog.init(POSTHOG_KEY, {
        api_host: POSTHOG_HOST,
        capture_pageview: false,
        capture_pageleave: false,
        persistence: "localStorage",
      });

      const globalScope = window as unknown as {
        __brisaPostHogReady?: boolean;
        __brisaPostHogClient?: typeof posthog;
      };

      globalScope.__brisaPostHogClient = posthog;
      globalScope.__brisaPostHogReady = true;
      if (typeof document !== "undefined") {
        document.documentElement.dataset.brisaPosthog = "ready";
      }
      isPostHogInitialized = true;
    }
  }, []);

  useEffect(() => {
    if (!POSTHOG_KEY || !isPostHogInitialized) {
      return;
    }

    const fullPath = search ? `${pathname}?${search}` : pathname;
    posthog.capture("$pageview", {
      pathname: fullPath,
    });
  }, [pathname, search]);

  return null;
}
