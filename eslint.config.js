// ESLint config for root (monorepo workspace)
// Individual apps/packages have their own eslint.config.mjs

export default [
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.next/**",
      "**/build/**",
      "**/coverage/**",
      "**/.turbo/**",
      "**/site/**",
      "**/_archived/**",
      "**/apps/api/src/generated/**",
    ],
  },
];
