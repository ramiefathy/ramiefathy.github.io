import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    environment: 'node',
    setupFiles: [],
    exclude: ['tests/**', 'playwright-report/**', 'test-results/**'],
    coverage: {
      reporter: ['text', 'html'],
      reportsDirectory: './coverage/mindmaps'
    }
  },
  resolve: {
    conditions: ['module', 'import', 'browser']
  }
});
