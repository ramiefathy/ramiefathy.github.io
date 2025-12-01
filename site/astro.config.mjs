// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://ramiefathy.github.io',
  output: 'static',
  integrations: [react()],
  vite: {
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom'],
            d3: ['d3'],
            shaders: ['@paper-design/shaders', '@paper-design/shaders-react'],
            framer: ['framer-motion'],
            mindmap: ['html-to-image', 'jspdf']
          }
        }
      },
      chunkSizeWarningLimit: 600
    }
  }
});
