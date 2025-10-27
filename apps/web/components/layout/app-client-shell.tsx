"use client";

import { Suspense, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { ThemeProvider } from "@/components/theme-provider";
import { ToastProvider } from "@/components/ui";
import { WebVitalsReporter } from "@/components/analytics/web-vitals-reporter";
import { PostHogAnalytics } from "@/components/analytics/posthog-analytics";
import { SpeedInsightsClient } from "@/components/analytics/speed-insights-client";

const MainHeaderSimple = dynamic(
  () =>
    import("@/components/main-header-simple").then(
      (module) => module.MainHeaderSimple,
    ),
  { ssr: false },
);

const WhatsAppWidgetSimple = dynamic(
  () =>
    import("@/components/whatsapp-widget-simple").then(
      (module) => module.WhatsAppWidgetSimple,
    ),
  { ssr: false },
);

type AppClientShellProps = {
  children: ReactNode;
  enableSpeedInsights: boolean;
};

export function AppClientShell({
  children,
  enableSpeedInsights,
}: AppClientShellProps) {
  return (
    <ThemeProvider>
      <MainHeaderSimple />
      <ToastProvider>{children}</ToastProvider>
      <WebVitalsReporter />
      <WhatsAppWidgetSimple />
      <PostHogAnalytics />
      <Suspense fallback={null}>
        <SpeedInsightsClient enabled={enableSpeedInsights} />
      </Suspense>
    </ThemeProvider>
  );
}
