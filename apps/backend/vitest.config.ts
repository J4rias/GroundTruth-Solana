import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    pool: 'forks',
    coverage: { provider: 'v8', reporter: ['text', 'lcov'] },
    setupFiles: ['./src/__tests__/setup.ts'],
  },
  resolve: {
    alias: {
      '@groundtruth/types': path.resolve('../../packages/types/src/index.ts'),
    },
  },
});
