import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Astro preserves JSX for its React integration; standalone Vite 8 tests must transform it.
  oxc: { jsx: { runtime: 'automatic' } },
  test: {
    include: [
      'src/**/*.test.{js,ts,jsx,tsx}',
      'src/**/*.spec.{js,ts,jsx,tsx}',
      'tests/pdf-studio/**/*.test.{js,ts,jsx,tsx}',
      'tests/pdf-studio/**/*.spec.{js,ts,jsx,tsx}'
    ],
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    exclude: ['playwright-report/**', 'test-results/**'],
    coverage: {
      reporter: ['text', 'html'],
      reportsDirectory: './coverage/mindmaps'
    }
  },
  resolve: {
    conditions: ['module', 'import', 'browser']
  }
});
