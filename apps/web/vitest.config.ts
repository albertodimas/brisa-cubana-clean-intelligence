import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
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
        lines: 50,
        functions: 50,
        branches: 50,
        statements: 50,
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
