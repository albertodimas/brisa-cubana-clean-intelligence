import { defineConfig, devices } from "@playwright/test";

const isCI = Boolean(process.env.CI);
const baseApiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const authSecret = process.env.AUTH_SECRET ?? "test-auth-secret";
const jwtSecret = process.env.JWT_SECRET ?? "test-jwt-secret";
const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5433/brisa_cubana_e2e";
const heartbeatSeconds = Number(process.env.E2E_HEARTBEAT_SECONDS ?? "15");
const loginRateLimit = process.env.E2E_LOGIN_RATE_LIMIT ?? "20"; // Increased for parallel E2E tests
const loginRateLimitWindow = "60000";
const posthogKey =
  (process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "").trim() || "phc_test_e2e";
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  timeout: 60_000,
  retries: isCI ? 1 : 0,
  globalSetup: "./tests/e2e/global-setup.ts",
  projects: [
    // Smoke Tests: Critical functionality only (~2-3s)
    {
      name: "smoke",
      testMatch: /.*\.spec\.ts$/,
      grep: /@smoke/,
      use: { ...devices["Desktop Chrome"] },
    },
    // Critical Tests: Main business flows + smoke (~5-6s)
    {
      name: "critical",
      testMatch: /.*\.spec\.ts$/,
      grep: /@critical/,
      use: { ...devices["Desktop Chrome"] },
      workers: 1,
    },
    // Full Suite: All tests (~8-10s)
    {
      name: "full",
      testMatch: /.*\.spec\.ts$/,
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: isCI
    ? [
        // CI: Use production builds (already compiled by workflow)
        {
          command: "pnpm --filter @brisa/api start",
          url: `${baseApiUrl}/health`,
          reuseExistingServer: false,
          stdout: "pipe",
          stderr: "pipe",
          env: {
            NODE_ENV: "production",
            DATABASE_URL: databaseUrl,
            DATABASE_URL_UNPOOLED: databaseUrl,
            JWT_SECRET: jwtSecret,
            LOGIN_RATE_LIMIT: loginRateLimit,
            LOGIN_RATE_LIMIT_WINDOW_MS: loginRateLimitWindow,
            ENABLE_TEST_UTILS: "true",
            PORT: process.env.API_PORT ?? "3001",
          },
          timeout: 120_000,
        },
        {
          command: "pnpm --filter @brisa/web start",
          url: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
          reuseExistingServer: false,
          stdout: "pipe",
          stderr: "pipe",
          env: {
            NODE_ENV: "production",
            AUTH_SECRET: authSecret,
            AUTH_COOKIE_SECURE: "false",
            NEXT_PUBLIC_API_URL: baseApiUrl,
            NEXT_PUBLIC_BASE_URL:
              process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
            NEXT_PUBLIC_POSTHOG_KEY: posthogKey,
            NEXT_PUBLIC_POSTHOG_HOST:
              process.env.NEXT_PUBLIC_POSTHOG_HOST ??
              "https://us.i.posthog.com",
            NEXT_PUBLIC_POSTHOG_FORCE_ENABLE: "true",
            NEXTAUTH_URL:
              process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
            PORT: process.env.WEB_PORT ?? "3000",
          },
          timeout: 120_000,
        },
      ]
    : [
        // Local dev: Setup DB and use dev servers
        {
          command:
            "pnpm db:push --force-reset && pnpm db:seed && pnpm --filter @brisa/api build && pnpm --filter @brisa/api start",
          url: `${baseApiUrl}/health`,
          reuseExistingServer: true,
          stdout: "pipe",
          stderr: "pipe",
          env: {
            NODE_ENV: "production",
            DATABASE_URL: databaseUrl,
            DATABASE_URL_UNPOOLED: databaseUrl,
            JWT_SECRET: jwtSecret,
            LOGIN_RATE_LIMIT: loginRateLimit,
            LOGIN_RATE_LIMIT_WINDOW_MS: loginRateLimitWindow,
            ENABLE_TEST_UTILS: "true",
            PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION:
              process.env.PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION ?? "si",
            PORT: process.env.API_PORT ?? "3001",
          },
          timeout: 120_000,
        },
        {
          command:
            "pnpm --filter @brisa/web build && pnpm --filter @brisa/web start",
          url: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
          reuseExistingServer: true,
          stdout: "pipe",
          stderr: "pipe",
          env: {
            NODE_ENV: "production",
            AUTH_SECRET: authSecret,
            AUTH_COOKIE_SECURE: "false",
            NEXT_PUBLIC_API_URL: baseApiUrl,
            NEXT_PUBLIC_BASE_URL:
              process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
            NEXT_PUBLIC_POSTHOG_KEY: posthogKey,
            NEXT_PUBLIC_POSTHOG_HOST:
              process.env.NEXT_PUBLIC_POSTHOG_HOST ??
              "https://us.i.posthog.com",
            NEXT_PUBLIC_POSTHOG_FORCE_ENABLE: "true",
            NEXTAUTH_URL:
              process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
            PORT: process.env.WEB_PORT ?? "3000",
          },
          timeout: 120_000,
        },
      ],
  workers: isCI ? 2 : undefined,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
    video: "retain-on-failure",
    screenshot: "only-on-failure",
    actionTimeout: heartbeatSeconds * 1000,
  },
});
