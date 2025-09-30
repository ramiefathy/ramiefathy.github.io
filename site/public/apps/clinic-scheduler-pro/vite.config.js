/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  root: '.',
  base: './',
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.test.{js,jsx}'],
  },
  build: {
    outDir: 'assets',
    emptyOutDir: true,
    // Increase warning limit since we use CDN-loaded dependencies
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'src/main.jsx'),
        'main-animated': path.resolve(__dirname, 'src/main-animated.jsx')
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: ({ name }) => {
          if (!name) {
            return 'assets/[name]-[hash][extname]';
          }
          if (name.endsWith('.css')) {
            return 'styles/[name]';
          }
          return 'chunks/[name]-[hash][extname]';
        },
        // Manual chunks for better bundle splitting
        manualChunks: (id) => {
          // React and core dependencies
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            if (id.includes('date-fns') || id.includes('dayjs')) {
              return 'vendor-dates';
            }
            if (id.includes('firebase/auth') || id.includes('@firebase/auth')) {
              return 'vendor-firebase-auth';
            }
            if (id.includes('firebase/firestore') || id.includes('@firebase/firestore')) {
              return 'vendor-firebase-firestore';
            }
            if (id.includes('firebase/functions') || id.includes('@firebase/functions')) {
              return 'vendor-firebase-functions';
            }
            if (id.includes('firebase') || id.includes('@firebase')) {
              return 'vendor-firebase-core';
            }
            if (id.includes('framer-motion')) {
              return 'vendor-motion';
            }
            if (id.includes('recharts') || id.includes('d3-')) {
              return 'vendor-charts';
            }
            if (id.includes('lucide')) {
              return 'vendor-icons';
            }
            // Other node_modules in a shared vendor chunk
            return 'vendor';
          }
          // Application code - could split by feature in future
          if (id.includes('/utils/')) {
            return 'app-utils';
          }
        }
      }
    }
  }
});
