import type { Metadata } from "next";
import { headers } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SentryErrorBoundary } from "@/components/sentry-error-boundary";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Brisa Cubana Clean Intelligence",
  description:
    "Plataforma integral de limpieza premium que combina IA, automatización y experiencia boutique para el mercado de Miami-Dade.",
  keywords: ["cleaning", "automation", "clean score", "miami", "event-driven"],
  metadataBase: new URL("https://brisacubanaclean.com"),
  openGraph: {
    title: "Brisa Cubana Clean Intelligence",
    description:
      "Sistema operativo inteligente para crews de limpieza premium con CleanScore™, concierge multimodal y workflows event-driven.",
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Extract nonce from middleware for CSP
  const nonce = (await headers()).get("x-csp-nonce") ?? undefined;

  return (
    <html lang="es">
      <head>{nonce && <meta property="csp-nonce" content={nonce} />}</head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SentryErrorBoundary>{children}</SentryErrorBoundary>
        <Analytics />
      </body>
    </html>
  );
}
