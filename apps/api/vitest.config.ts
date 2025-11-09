import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import { defineConfig } from "vitest/config";

const envFiles = [".env.test", ".env.local", ".env"];
for (const file of envFiles) {
  const fullPath = resolve(process.cwd(), file);
  if (existsSync(fullPath)) {
    loadEnv({ path: fullPath, override: true });
  }
}

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
