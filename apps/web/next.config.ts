import type { NextConfig } from "next";

const baseConnectSources = [
  "'self'",
  "https://api.brisacubana.com",
  "https://vitals.vercel-insights.com",
];

const connectSrc = new Set(baseConnectSources);

const apiUrlFromEnv = process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL;

if (apiUrlFromEnv) {
  try {
    const apiOrigin = new URL(apiUrlFromEnv).origin;
    connectSrc.add(apiOrigin);
  } catch {
    // ignore invalid URLs; fallback to defaults only
  }
}

if (process.env.NODE_ENV !== "production") {
  connectSrc.add("http://localhost:3001");
  connectSrc.add("http://127.0.0.1:3001");
}

const connectSrcValue = Array.from(connectSrc).join(" ");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  transpilePackages: ["@brisa/ui"],
  experimental: {
    externalDir: true,
    serverActions: {
      allowedOrigins: [
        "localhost",
        "brisa-cubana.vercel.app",
        "brisacubana.com",
      ],
    },
  },
  // Production-grade security headers
  // References:
  // - https://nextjs.org/docs/pages/guides/content-security-policy
  // - https://blog.arcjet.com/next-js-security-checklist/
  // Consulted: 2025-10-02
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // HSTS: Force HTTPS (2 years, include subdomains)
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          // Prevent MIME-type sniffing
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          // Clickjacking protection
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          // XSS protection (legacy browsers)
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          // Referrer policy (privacy)
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // Permissions Policy (restrict features)
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(self), payment=(self)",
          },
          // Content Security Policy (CSP) - Strict
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; " +
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://va.vercel-scripts.com; " +
              "style-src 'self' 'unsafe-inline'; " +
              "img-src 'self' data: https: blob:; " +
              "font-src 'self' data:; " +
              `connect-src ${connectSrcValue}; ` +
              "frame-ancestors 'none'; " +
              "base-uri 'self'; " +
              "form-action 'self';",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
