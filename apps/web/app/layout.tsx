import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Suspense } from "react";
import "./globals.css";
import "../styles/theme.css";
import { ToastProvider } from "@/components/ui";
import { ThemeProvider } from "@/components/theme-provider";
import { WebVitalsReporter } from "@/components/analytics/web-vitals-reporter";
import { PostHogAnalytics } from "@/components/analytics/posthog-analytics";
import { SpeedInsightsClient } from "@/components/analytics/speed-insights-client";

const SITE_DESCRIPTION =
  "Servicios profesionales de limpieza premium en Miami con logística inteligente y soporte 24/7 para hogares, alquileres vacacionales y negocios.";
const DEFAULT_SITE_URL = "https://brisacubanacleanintelligence.com";
const SITE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ??
  process.env.NEXTAUTH_URL ??
  DEFAULT_SITE_URL;
const BUSINESS_PHONE = "+1 786-436-7132";
const BUSINESS_STREET = "511 SW 4th Ave";
const BUSINESS_CITY = "Miami";
const BUSINESS_REGION = "FL";
const BUSINESS_POSTAL_CODE = "33130";
const SOCIAL_LINKS = [
  "https://instagram.com/BrisaCleanIntelligence",
  "https://facebook.com/BrisaCleanIntelligence",
  "https://www.linkedin.com/company/brisa-clean-intelligence",
  "https://www.tiktok.com/@brisacleanintelligence",
  "https://www.youtube.com/@BrisaCleanIntelligence",
];

export const metadata: Metadata = {
  title: {
    default: "Brisa Cubana Clean Intelligence",
    template: "%s | Brisa Cubana",
  },
  description: SITE_DESCRIPTION,
  metadataBase: new URL(SITE_URL),
  keywords: [
    "limpieza miami",
    "cleaning service",
    "airbnb cleaning",
    "vacation rental cleaning",
    "deep clean miami",
    "turnover service",
  ],
  authors: [{ name: "Brisa Cubana Clean Intelligence" }],
  creator: "Brisa Cubana Clean Intelligence",
  openGraph: {
    type: "website",
    locale: "es_US",
    url: SITE_URL,
    title: "Brisa Cubana Clean Intelligence",
    description: SITE_DESCRIPTION,
    siteName: "Brisa Cubana Clean Intelligence",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "google-site-verification-code",
  },
  other: {
    "business:contact_data:street_address": BUSINESS_STREET,
    "business:contact_data:locality": BUSINESS_CITY,
    "business:contact_data:region": BUSINESS_REGION,
    "business:contact_data:postal_code": BUSINESS_POSTAL_CODE,
    "business:contact_data:country_name": "United States",
    "business:contact_data:phone_number": BUSINESS_PHONE,
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const enableSpeedInsights =
    process.env.NEXT_PUBLIC_ENABLE_SPEED_INSIGHTS === "true" ||
    process.env.VERCEL === "1";
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "Brisa Cubana Clean Intelligence",
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    telephone: BUSINESS_PHONE,
    address: {
      "@type": "PostalAddress",
      streetAddress: BUSINESS_STREET,
      addressLocality: BUSINESS_CITY,
      addressRegion: BUSINESS_REGION,
      postalCode: BUSINESS_POSTAL_CODE,
      addressCountry: "US",
    },
    sameAs: SOCIAL_LINKS,
  };

  return (
    <html lang="es" className="dark" suppressHydrationWarning>
      <head>
        <meta name="description" content={SITE_DESCRIPTION} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd),
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <ToastProvider>{children}</ToastProvider>
          <WebVitalsReporter />
        </ThemeProvider>
        <PostHogAnalytics />
        <Suspense fallback={null}>
          <SpeedInsightsClient enabled={enableSpeedInsights} />
        </Suspense>
      </body>
    </html>
  );
}
