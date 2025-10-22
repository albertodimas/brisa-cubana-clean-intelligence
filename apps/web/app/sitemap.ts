import type { MetadataRoute } from "next";

const DEFAULT_SITE_URL = "https://brisacubanacleanintelligence.com";

function getBaseUrl() {
  const url =
    process.env.NEXT_PUBLIC_BASE_URL ??
    process.env.NEXTAUTH_URL ??
    DEFAULT_SITE_URL;
  return url.replace(/\/+$/, "");
}

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getBaseUrl();
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
    },
  ];
}
