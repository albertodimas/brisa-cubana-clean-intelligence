import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const baseConnectSources = [
  "'self'",
  "https://api.brisacubana.com",
  "https://vitals.vercel-insights.com",
  "https://*.sentry.io", // Sentry error reporting
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
          // Content Security Policy (CSP) - Enhanced
          // Note: 'unsafe-inline' required for Next.js styles and Vercel Analytics
          // TODO: Implement nonce-based CSP in future iteration
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; " +
              "script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com https://*.sentry.io; " +
              "style-src 'self' 'unsafe-inline'; " +
              "img-src 'self' data: https: blob:; " +
              "font-src 'self' data:; " +
              `connect-src ${connectSrcValue}; ` +
              "frame-ancestors 'none'; " +
              "base-uri 'self'; " +
              "form-action 'self'; " +
              "upgrade-insecure-requests;",
          },
        ],
      },
    ];
  },
};

// Wrap config with Sentry for source maps upload and error tracking
// Only apply in production builds to avoid overhead in development
export default process.env.NODE_ENV === "production" &&
process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(nextConfig, {
      // Sentry Webpack Plugin Options
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,

      // Only upload source maps for releases
      silent: true, // Suppresses all logs

      // Upload source maps during build
      widenClientFileUpload: true,

      // Automatically tree-shake Sentry logger statements
      disableLogger: true,

      // Automatically annotate React components for better error grouping
      reactComponentAnnotation: {
        enabled: true,
      },
    })
  : nextConfig;
