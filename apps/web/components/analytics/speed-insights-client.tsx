"use client";

import { useEffect, useState } from "react";
import { SpeedInsights } from "@vercel/speed-insights/next";

type SpeedInsightsClientProps = {
  enabled: boolean;
};

function shouldSkipForLighthouse() {
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

export function SpeedInsightsClient({ enabled }: SpeedInsightsClientProps) {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (shouldSkipForLighthouse()) {
      return;
    }

    setShouldRender(true);
  }, [enabled]);

  if (!shouldRender) {
    return null;
  }

  return <SpeedInsights />;
}
