"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import type { PostHog as PosthogLite } from "posthog-js-lite";

const POSTHOG_KEY =
  (process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "").trim() || "phc_test_e2e";
const POSTHOG_HOST =
  (process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "").trim() ||
  "https://us.i.posthog.com";
const POSTHOG_FORCE_ENABLE =
  (process.env.NEXT_PUBLIC_POSTHOG_FORCE_ENABLE ?? "").toLowerCase() === "true";

let isPostHogInitialized = false;
let posthogClientPromise: Promise<PosthogClient> | undefined;

function shouldSkipAnalytics() {
  if (POSTHOG_FORCE_ENABLE) {
    return false;
  }

  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    const isLocalhost =
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "[::1]";
    if (isLocalhost) {
      return false;
    }
  }

  if (typeof navigator === "undefined") {
    return false;
  }

  const userAgent = navigator.userAgent.toLowerCase();
  const hasSkipFlag =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).has("lhci");

  return (
    userAgent.includes("lighthouse") ||
    userAgent.includes("headlesschrome") ||
    navigator.webdriver === true ||
    hasSkipFlag
  );
}

type PosthogCapture = (
  ...args: Parameters<PosthogLite["capture"]>
) => ReturnType<PosthogLite["capture"]>;

type PosthogClient = {
  capture: PosthogCapture;
};

function markPosthogReady(client: PosthogClient) {
  const globalScope = window as unknown as {
    __brisaPostHogReady?: boolean;
    __brisaPostHogClient?: PosthogClient;
    __brisaPostHogPromise?: Promise<PosthogClient>;
    posthog?: PosthogClient;
  };

  globalScope.__brisaPostHogClient = client;
  globalScope.__brisaPostHogPromise = Promise.resolve(client);
  globalScope.posthog = client;
  globalScope.__brisaPostHogReady = true;

  if (typeof document !== "undefined") {
    document.documentElement.dataset.brisaPosthog = "ready";
  }
}

function createNoopClient(): PosthogClient {
  return {
    capture: (..._args) => {
      /* noop capture to satisfy monitoring hooks */
    },
  };
}

export function PostHogAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (isPostHogInitialized || shouldSkipAnalytics()) {
      return;
    }

    const isKeyPresent = Boolean(POSTHOG_KEY);

    posthogClientPromise = (async () => {
      if (!isKeyPresent) {
        const noopClient = createNoopClient();
        markPosthogReady(noopClient);
        return noopClient;
      }

      try {
        const { default: PostHog } = await import("posthog-js-lite");
        const client = new PostHog(POSTHOG_KEY, {
          host: POSTHOG_HOST,
          autocapture: false,
          captureHistoryEvents: false,
          persistence: "localStorage",
        });
        markPosthogReady(client);
        return client;
      } catch (error) {
        console.warn("PostHog init failed, falling back to noop client", error);
        const fallback = createNoopClient();
        markPosthogReady(fallback);
        return fallback;
      }
    })();
    (
      window as unknown as { __brisaPostHogPromise?: Promise<PosthogClient> }
    ).__brisaPostHogPromise = posthogClientPromise;

    isPostHogInitialized = true;
  }, []);

  useEffect(() => {
    if (!POSTHOG_KEY || !isPostHogInitialized || shouldSkipAnalytics()) {
      return;
    }

    // Capture search params at runtime to avoid Suspense issues
    const search =
      typeof window !== "undefined"
        ? window.location.search.replace(/^\?/, "")
        : "";
    const fullPath = search ? `${pathname}?${search}` : pathname;

    posthogClientPromise
      ?.then((client) => {
        client.capture("$pageview", {
          pathname: fullPath,
        });
      })
      .catch((error) => {
        console.warn("PostHog capture failed", error);
      });
  }, [pathname]);

  return null;
}
