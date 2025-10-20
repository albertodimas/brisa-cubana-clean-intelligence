import type { MetadataRoute } from "next";

/**
 * Robots configuration served by Next.js routing.
 * Mantiene un sitemap único y bloquea rutas internas sensibles sin exponer un archivo físico en `public/`.
 */
const DEFAULT_SITE_URL = "https://brisacubanacleanintelligence.com";

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_BASE_URL ??
    DEFAULT_SITE_URL;

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
