import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import bundleAnalyzer from "@next/bundle-analyzer";

// Force rebuild to invalidate Turbo cache after env var configuration fix
const enableHsts = process.env.ENABLE_HSTS !== "false";

const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  ...(enableHsts
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]
    : []),
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  webpack: (config, { isServer }) => {
    // Suprimir warnings conocidos de OpenTelemetry (Sentry)
    if (isServer) {
      config.ignoreWarnings = [
        {
          module: /@opentelemetry\/instrumentation/,
          message: /Critical dependency/,
        },
        {
          module: /require-in-the-middle/,
          message: /Critical dependency/,
        },
      ];
    }
    return config;
  },
  async headers() {
    return [
      {
        source: "/_next/static/:path*",
        headers: [
          ...securityHeaders,
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  async rewrites() {
    const apiBase =
      process.env.INTERNAL_API_URL ??
      "https://api.brisacubanacleanintelligence.com";
    const normalizedApiBase = apiBase.endsWith("/")
      ? apiBase.slice(0, -1)
      : apiBase;

    return [
      {
        source: "/healthz",
        destination: `${normalizedApiBase}/healthz`,
      },
      {
        source: "/api/healthz",
        destination: `${normalizedApiBase}/healthz`,
      },
    ];
  },
};

const sentryWebpackPluginOptions = {
  silent: true,
  hideSourceMaps: true,
};

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

export default withBundleAnalyzer(
  withSentryConfig(nextConfig, sentryWebpackPluginOptions),
);
