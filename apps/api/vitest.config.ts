import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    env: {
      DATABASE_URL:
        process.env.DATABASE_URL ||
        "postgresql://postgres:postgres@localhost:5432/brisa_cubana_test",
      JWT_SECRET:
        process.env.JWT_SECRET ||
        "test-secret-key-for-vitest-testing-only-do-not-use-in-production",
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      exclude: [
        "node_modules/",
        "src/generated/**",
        "**/*.test.ts",
        "**/*.config.ts",
        "dist/",
        "src/routes/concierge.ts",
        "src/services/ai.ts",
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },
    include: ["src/**/*.test.ts"],
    exclude: [
      "node_modules",
      "dist",
      "src/generated",
      "src/test/integration/**",
    ],
  },
});
