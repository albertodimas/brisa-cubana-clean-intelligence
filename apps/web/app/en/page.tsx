import type { Metadata } from "next";
import Link from "next/link";
import { GradientMesh, ScrollProgress, ScrollReveal } from "@/components/ui";
import { MarketingLink } from "@/components/landing/marketing-link";

export const metadata: Metadata = {
  title: "Brisa Cubana Clean Intelligence · Premium turnover services in Miami",
  description:
    "Premium turnover, deep cleaning and preventive maintenance for high-end rentals in Miami. Evidence-based operations with 24/7 support.",
  alternates: {
    canonical: "/en",
    languages: {
      es: "/",
      en: "/en",
    },
  },
};

const bulletPoints = [
  "Same-day turnovers with 100+ checkpoint checklists and photographic evidence in less than four hours.",
  "Deep cleaning programs for extended stays, including hypoallergenic supplies and HVAC refresh.",
  "Preventive restocking with RFID tracking, laundry operations and on-site supervision for critical stays.",
];

export default function LandingPageEn() {
  return (
    <main className="min-h-screen bg-white text-gray-900 dark:bg-brisa-950 dark:text-white">
      <ScrollProgress position="top" thickness={3} glow />

      <div className="relative overflow-hidden bg-gradient-to-br from-brisa-100 via-white to-white dark:from-brisa-900/60 dark:via-brisa-950 dark:to-brisa-950">
        <GradientMesh
          colors={{
            primary: "rgba(20, 184, 166, 0.3)",
            secondary: "rgba(139, 92, 246, 0.25)",
            accent: "rgba(6, 182, 212, 0.3)",
          }}
          opacity={0.4}
          shimmer
        />

        <div className="relative mx-auto grid max-w-5xl gap-12 px-4 pb-16 pt-24 sm:px-6 lg:px-8">
          <ScrollReveal variant="fadeDown" delay={0.1}>
            <span className="text-xs tracking-[0.45em] uppercase text-brisa-600 dark:text-brisa-300">
              Brisa Cubana Clean Intelligence
            </span>
          </ScrollReveal>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)] lg:items-center">
            <ScrollReveal variant="fadeUp" delay={0.2}>
              <div className="space-y-6">
                <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
                  Premium turnovers for luxury rentals in Miami.
                </h1>
                <p className="text-lg text-gray-600 dark:text-brisa-200">
                  We deliver enhanced-cleaning compliant turnovers, deep clean
                  programs and preventive maintenance with real-time dashboards,
                  photographic evidence and 24/7 operational support.
                </p>
                <ul className="space-y-3 text-base text-gray-600 dark:text-brisa-200">
                  {bulletPoints.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-brisa-100 text-brisa-600 dark:bg-brisa-900/60 dark:text-brisa-300">
                        ✓
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap gap-4">
                  <MarketingLink
                    href="/?plan=turnover&inventory=6-15%20unidades#contacto"
                    eventName="cta_request_proposal_en"
                    metadata={{ placement: "hero_en", locale: "en" }}
                    className="inline-flex items-center justify-center rounded-full bg-brisa-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-brisa-600/20 transition-all hover:-translate-y-0.5 hover:bg-brisa-700"
                    prefetch={false}
                  >
                    Request a proposal (Spanish form)
                  </MarketingLink>
                  <Link
                    href="mailto:operaciones@brisacubanacleanintelligence.com"
                    className="inline-flex items-center justify-center rounded-full border border-brisa-600 px-6 py-3 text-base font-semibold text-brisa-600 transition-all hover:-translate-y-0.5 hover:bg-brisa-50 dark:border-brisa-300 dark:text-brisa-200 dark:hover:bg-brisa-900"
                  >
                    Contact operations team
                  </Link>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal variant="fadeUp" delay={0.25}>
              <div className="rounded-3xl border border-gray-200 bg-white/90 p-6 shadow-xl dark:border-brisa-800 dark:bg-brisa-950/80">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  What to expect
                </h2>
                <ul className="mt-4 space-y-3 text-sm text-gray-600 dark:text-brisa-200">
                  <li>
                    • Real-time dashboard with SLA tracking and photographic
                    evidence.
                  </li>
                  <li>
                    • Dedicated on-site supervisors and RFID inventory
                    management.
                  </li>
                  <li>
                    • Seamless integrations with Guesty, Hostaway, Breezeway and
                    more.
                  </li>
                </ul>
                <p className="mt-4 text-xs text-gray-500 dark:text-brisa-400">
                  Our operations, portal UI and lead form remain in Spanish
                  while we finalize the full localization. Reach out to the team
                  for English onboarding.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </main>
  );
}
