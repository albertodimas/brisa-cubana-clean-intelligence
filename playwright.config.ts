import { defineConfig, devices } from "@playwright/test";

const isCI = Boolean(process.env.CI);
const baseApiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const authSecret = process.env.AUTH_SECRET ?? "test-auth-secret";
const jwtSecret = process.env.JWT_SECRET ?? "test-jwt-secret";
const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5433/brisa_cubana_e2e";
const heartbeatSeconds = Number(process.env.E2E_HEARTBEAT_SECONDS ?? "15");

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  timeout: 60_000,
  retries: isCI ? 1 : 0,
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
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
      reuseExistingServer: !isCI,
      stdout: "pipe",
      stderr: "pipe",
      env: {
        NODE_ENV: "test",
        DATABASE_URL: databaseUrl,
        DATABASE_URL_UNPOOLED: databaseUrl,
        JWT_SECRET: jwtSecret,
      },
      timeout: 120_000,
    },
    {
      command: "pnpm --filter @brisa/web dev",
      url: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
      reuseExistingServer: !isCI,
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
