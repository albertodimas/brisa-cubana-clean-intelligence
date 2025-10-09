import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import "../styles/theme.css";

export const metadata: Metadata = {
  title: {
    default: "Brisa Cubana Clean Intelligence",
    template: "%s | Brisa Cubana",
  },
  description:
    "Sistema de gestión profesional para servicios de limpieza premium en Miami. Deep cleaning, turnover para Airbnb y propiedades vacacionales.",
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
    url: "https://brisacubanaclean.com",
    title: "Brisa Cubana Clean Intelligence",
    description:
      "Servicios profesionales de limpieza para propiedades vacacionales y residenciales en Miami",
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
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
