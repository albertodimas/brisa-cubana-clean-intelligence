import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary"],
      exclude: [
        "node_modules/**",
        "dist/**",
        "**/*.test.ts",
        "**/*.spec.ts",
        "prisma/**",
        "src/server.ts", // Entry point
      ],
      thresholds: {
        lines: 85,
        functions: 65,
        branches: 50,
        statements: 85,
      },
    },
  },
});
