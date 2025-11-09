import fs from "node:fs";
import path from "node:path";
import nextEnv from "@next/env";
import dotenv from "dotenv";
const { loadEnvConfig } = nextEnv;
import { withSentryConfig } from "@sentry/nextjs";
import bundleAnalyzer from "@next/bundle-analyzer";

const projectDir = process.cwd();
const monorepoRoot = path.resolve(projectDir, "..", "..");
loadEnvConfig(projectDir, false);
if (monorepoRoot !== projectDir) {
  loadEnvConfig(monorepoRoot, false);
}
const isDevLike =
  !process.env.NODE_ENV ||
  process.env.NODE_ENV === "development" ||
  process.env.NODE_ENV === "test";
if (isDevLike) {
  loadEnvConfig(projectDir, true);
  if (monorepoRoot !== projectDir) {
    loadEnvConfig(monorepoRoot, true);
  }
}

const fallbackEnvFiles = [
  `.env.${process.env.NODE_ENV ?? "production"}.local`,
  `.env.${process.env.NODE_ENV ?? "production"}`,
  ".env.local",
  ".env",
];
for (const envFile of fallbackEnvFiles) {
  const absolutePath = path.join(monorepoRoot, envFile);
  if (fs.existsSync(absolutePath)) {
    dotenv.config({ path: absolutePath, override: false });
  }
}

if (
  process.env.PLAYWRIGHT_TEST_RUN === "true" &&
  !process.env.NEXT_PUBLIC_PLAYWRIGHT_TEST_RUN
) {
  process.env.NEXT_PUBLIC_PLAYWRIGHT_TEST_RUN = "true";
}

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
  const isPlaywrightRun = process.env.PLAYWRIGHT_TEST_RUN === "true";
  const playwrightApiBase =
    process.env.PLAYWRIGHT_API_BASE ?? "http://localhost:3001";
  let apiBase =
    process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? null;

  if (!apiBase) {
    const previewBase = derivePreviewApiBase();
    if (previewBase) {
      apiBase = previewBase;
    }
  }

  if (isPlaywrightRun) {
    apiBase = playwrightApiBase;
  } else if (!apiBase) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "NEXT_PUBLIC_API_URL or INTERNAL_API_URL must be defined in production environments.",
      );
    }
    apiBase = "http://localhost:3001";
  }

  if (isPlaywrightRun || !process.env.NEXT_PUBLIC_API_URL) {
    process.env.NEXT_PUBLIC_API_URL = apiBase;
  }

  if (isPlaywrightRun || !process.env.INTERNAL_API_URL) {
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

/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_PLAYWRIGHT_TEST_RUN:
      process.env.NEXT_PUBLIC_PLAYWRIGHT_TEST_RUN,
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
