import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    testTimeout: 300_000,
    hookTimeout: 60_000,
    globalSetup: [],
    include: ['tests/**/*.test.ts'],
    exclude: ['src/**'],
    coverage: {
      enabled: false,
    },
  },
});
