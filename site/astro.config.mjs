// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://ramiefathy.com',
  output: 'static',
  integrations: [react()],
  vite: {
    optimizeDeps: {
      // Playwright E2E runs against the dev server. Some large, island-only deps (notably framer-motion)
      // can trigger Vite's "Outdated Optimize Dep" 504 during hydration, which makes islands fail to
      // hydrate (AppsGallery, Dermoscopy dashboard, MindMapApp). Pre-bundle the known heavy deps up
      // front so the dev server is stable under parallel test load.
      include: ['framer-motion', 'react', 'react-dom', 'd3', 'html-to-image', 'jspdf']
    },
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
