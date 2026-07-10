import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/e2e/**/*.test.ts'],
    exclude: ['node_modules'],
    testTimeout: 180_000,
    hookTimeout: 30_000,
    fileParallelism: false,
  },
});
