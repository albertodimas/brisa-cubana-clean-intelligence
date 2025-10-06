import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  transpilePackages: ["@brisa/ui"],
  experimental: {
    externalDir: true,
    serverActions: {
      allowedOrigins: [
        "https://brisacubana.com",
        "https://www.brisacubana.com",
        "https://app.brisacubana.com",
        "https://brisa-cubana.vercel.app",
        "localhost:3000",
        "127.0.0.1:3000",
      ],
    },
  },
  // Production-grade security headers
  // References:
  // - https://nextjs.org/docs/pages/guides/content-security-policy
  // - https://blog.arcjet.com/next-js-security-checklist/
  // Consulted: 2025-10-02
  //
  // Note: CSP is now applied dynamically in middleware.ts with nonce-based directives
  // to eliminate 'unsafe-inline' and prevent XSS attacks.
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
