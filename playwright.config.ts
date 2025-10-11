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

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  timeout: 60_000,
  retries: isCI ? 1 : 0,
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
            NEXT_PUBLIC_API_URL: baseApiUrl,
          },
          timeout: 120_000,
        },
      ]
    : [
        // Local dev: Setup DB and use dev servers
        {
          command:
            "pnpm --filter @brisa/api db:push --force-reset && pnpm --filter @brisa/api db:seed",
          reuseExistingServer: true,
          stdout: "pipe",
          stderr: "pipe",
          env: {
            DATABASE_URL: databaseUrl,
            DATABASE_URL_UNPOOLED: databaseUrl,
            JWT_SECRET: jwtSecret,
          },
        },
        {
          command: "pnpm --filter @brisa/api dev",
          url: `${baseApiUrl}/health`,
          reuseExistingServer: true,
          stdout: "pipe",
          stderr: "pipe",
          env: {
            NODE_ENV: "test",
            DATABASE_URL: databaseUrl,
            DATABASE_URL_UNPOOLED: databaseUrl,
            JWT_SECRET: jwtSecret,
            LOGIN_RATE_LIMIT: loginRateLimit,
            LOGIN_RATE_LIMIT_WINDOW_MS: loginRateLimitWindow,
          },
          timeout: 120_000,
        },
        {
          command: "pnpm --filter @brisa/web dev",
          url: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
          reuseExistingServer: true,
          stdout: "pipe",
          stderr: "pipe",
          env: {
            NODE_ENV: "test",
            AUTH_SECRET: authSecret,
            NEXT_PUBLIC_API_URL: baseApiUrl,
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
