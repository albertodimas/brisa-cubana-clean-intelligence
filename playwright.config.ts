import { defineConfig, devices } from "@playwright/test";

process.env.USE_FAKE_API_DATA ??= "1";
process.env.NEXT_PUBLIC_USE_FAKE_API_DATA ??= "1";
process.env.DYLD_USE_FAKE_API_DATA ??= "1";

const port = Number(process.env.PORT ?? 3000);

export default defineConfig({
  testDir: "./apps/web/e2e",
  timeout: 60_000,
  expect: {
    timeout: 5_000,
  },
  fullyParallel: true,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${port}`,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: {
    command: `node apps/web/scripts/start-e2e.js`,
    url: `http://127.0.0.1:${port}`,
    timeout: 120_000,
    reuseExistingServer: false,
    env: {
      HOSTNAME: "0.0.0.0",
      PORT: String(port),
      USE_FAKE_API_DATA: process.env.USE_FAKE_API_DATA ?? "1",
      DYLD_USE_FAKE_API_DATA: process.env.DYLD_USE_FAKE_API_DATA ?? "1",
      NEXT_PUBLIC_USE_FAKE_API_DATA:
        process.env.NEXT_PUBLIC_USE_FAKE_API_DATA ?? "1",
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
