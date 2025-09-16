// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://ramiefathy.github.io',
  output: 'static',
  integrations: [react()]
});
