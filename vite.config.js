import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src',
  server: {
    port: 5173
  },
  test: {
    root: 'test/unit',
    include: ['**/*.test.js'],
    exclude: ['**/e2e-tests/**']
  }
});
