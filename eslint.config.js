// ESLint config for root (monorepo workspace)
// Individual apps/packages have their own eslint.config.mjs
// 
// This is a minimal root config that only validates root-level files.
// To lint the entire workspace, use: pnpm turbo run lint
// To lint individual packages, use: pnpm --filter=@brisa/api lint

export default [
  {
    ignores: [
      // Dependencies and build outputs
      "**/node_modules/**",
      "**/dist/**",
      "**/.next/**",
      "**/build/**",
      "**/coverage/**",
      "**/.turbo/**",
      "**/site/**",
      "**/_archived/**",
      
      // Generated code
      "**/apps/api/src/generated/**",
      
      // Python virtual environments (non-JS code)
      "**/.venv/**",
      "**/.venv-docs/**",
      
      // Ignore all TypeScript files in apps/packages
      // (they have their own eslint configs)
      "**/apps/**/*.ts",
      "**/apps/**/*.tsx",
      "**/packages/**/*.ts",
      "**/packages/**/*.tsx",
      
      // Test files (handled by app-specific configs)
      "**/*.test.ts",
      "**/*.test.tsx",
      "**/__tests__/**",
      
      // Config files that may contain TS syntax
      "**/playwright.config.ts",
      "**/vitest.config.ts",
      "**/tsup.config.ts",
      
      // Storybook generated files
      "**/storybook-static/**",
      "**/.storybook/**",
      "**/playwright-report/**",
      "**/test-results/**",
    ],
  },
];
