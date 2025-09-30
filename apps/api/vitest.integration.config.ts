import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    env: {
      NODE_ENV: "test",
      JWT_SECRET:
        process.env.JWT_SECRET ||
        "test-secret-key-for-vitest-testing-only-do-not-use-in-production",
    },
    // Integration tests can take longer (container startup, migrations)
    testTimeout: 60000,
    hookTimeout: 60000,
    // Run integration tests sequentially (avoid parallel DB conflicts)
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    include: ["src/test/integration/**/*.integration.test.ts"],
    exclude: ["node_modules", "dist", "src/generated"],
  },
});
