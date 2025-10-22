import type { MetadataRoute } from "next";

const DEFAULT_SITE_URL = "https://brisacubanacleanintelligence.com";

function getBaseUrl() {
  const url =
    process.env.NEXT_PUBLIC_BASE_URL ??
    process.env.NEXTAUTH_URL ??
    DEFAULT_SITE_URL;
  return url.replace(/\/+$/, "");
}

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();
  return {
    host: baseUrl,
    sitemap: `${baseUrl}/sitemap.xml`,
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
    ],
  };
}
