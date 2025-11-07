import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import bundleAnalyzer from "@next/bundle-analyzer";

// Force rebuild to invalidate Turbo cache after env var configuration fix
const enableHsts = process.env.ENABLE_HSTS !== "false";

const derivePreviewApiBase = () => {
  if (process.env.VERCEL_ENV !== "preview") {
    return null;
  }

  const branchUrl = process.env.VERCEL_BRANCH_URL;
  if (!branchUrl) {
    return null;
  }

  if (!branchUrl.includes("brisa-cubana-clean-intelligence")) {
    return null;
  }

  return branchUrl.replace(
    "brisa-cubana-clean-intelligence",
    "brisa-cubana-clean-intelligence-api",
  );
};

const ensureApiEnvValues = () => {
  let apiBase =
    process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? null;

  if (!apiBase) {
    const previewBase = derivePreviewApiBase();
    if (previewBase) {
      apiBase = previewBase;
    }
  }

  if (!apiBase) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "NEXT_PUBLIC_API_URL or INTERNAL_API_URL must be defined in production environments.",
      );
    }
    apiBase = "http://localhost:3001";
  }

  if (!process.env.NEXT_PUBLIC_API_URL) {
    process.env.NEXT_PUBLIC_API_URL = apiBase;
  }

  if (!process.env.INTERNAL_API_URL) {
    process.env.INTERNAL_API_URL = apiBase;
  }

  return apiBase.endsWith("/") ? apiBase.slice(0, -1) : apiBase;
};

const normalizedApiBase = ensureApiEnvValues();

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
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
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
        {
          module: /import-in-the-middle/,
          message: /.*/, // Ignorar todos los warnings de import-in-the-middle
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

const analyzeMode = process.env.ANALYZE_MODE === "json" ? "json" : "static"; // allow generating JSON stats without opening viewer

const withBundleAnalyzer = bundleAnalyzer({
  enabled:
    process.env.ANALYZE === "true" || process.env.ANALYZE_MODE === "json",
  analyzerMode: analyzeMode,
  openAnalyzer: false,
});

export default withBundleAnalyzer(
  withSentryConfig(nextConfig, sentryWebpackPluginOptions),
);
