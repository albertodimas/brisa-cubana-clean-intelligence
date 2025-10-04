import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    include: ["src/**/*.test.tsx"],
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "**/*.config.*",
        "**/*.stories.tsx",
        ".next/**",
        "dist/**",
      ],
      thresholds: {
        lines: 10, // Temporal: 10% (actual: 10.85%) - incrementar gradualmente
        functions: 45, // Temporal: 45% (actual: 49.36%) - cerca de pasar
        branches: 50, // Mantener: 50% (actual: 57.55%) - ya cumple
        statements: 10, // Temporal: 10% (actual: 10.85%) - incrementar gradualmente
      },
    },
  },
  resolve: {
    alias: [
      {
        find: "@/",
        replacement: `${path.resolve(__dirname, "./src")}/`,
      },
      {
        find: "@brisa/ui",
        replacement: path.resolve(__dirname, "../../packages/ui/src"),
      },
    ],
  },
});
