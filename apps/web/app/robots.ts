import type { MetadataRoute } from "next";

/**
 * Robots configuration served by Next.js routing.
 * Mantiene un sitemap único y bloquea rutas internas sensibles sin exponer un archivo físico en `public/`.
 */
const PRODUCTION_URL = "https://brisa-cubana-clean-intelligence.vercel.app";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? PRODUCTION_URL;

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/"],
        disallow: ["/api", "/panel/api", "/panel/api/*"],
      },
    ],
    sitemap: `${baseUrl.replace(/\/+$/, "")}/sitemap.xml`,
  };
}
