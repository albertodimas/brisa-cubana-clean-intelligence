import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/generated/**',
        '**/*.test.ts',
        '**/*.config.ts',
        'dist/'
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70
      }
    },
    include: ['src/**/*.test.ts'],
    exclude: ['node_modules', 'dist', 'src/generated']
  }
});
