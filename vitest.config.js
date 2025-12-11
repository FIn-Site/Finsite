import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Vitest project root = repo root, NOT src
  root: '.',
  test: {
    include: ['test/**/*.test.js'],
    environment: 'node',
  },
});
