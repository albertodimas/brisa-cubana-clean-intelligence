import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "**/*.test.tsx",
        "**/*.config.ts",
        "**/*.config.mjs",
        "**/*.stories.tsx",
        ".storybook/**",
        "dist/",
      ],
      thresholds: {
        lines: 50,
        functions: 60,
        branches: 50,
        statements: 50,
      },
    },
    include: ["src/**/*.test.tsx"],
    setupFiles: ["./vitest.setup.ts"],
  },
});
