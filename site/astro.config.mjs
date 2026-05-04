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
          manualChunks(id) {
            if (!id.includes('/node_modules/')) return;
            if (id.includes('/react/') || id.includes('/react-dom/')) return 'react';
            if (id.includes('/d3')) return 'd3';
            if (id.includes('/@paper-design/shaders')) return 'shaders';
            if (id.includes('/framer-motion/')) return 'framer';
            if (id.includes('/html-to-image/') || id.includes('/jspdf/')) return 'mindmap';
          }
        }
      },
      chunkSizeWarningLimit: 600
    }
  }
});
