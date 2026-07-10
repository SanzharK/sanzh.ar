import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';

export default defineConfig({
  redirects: {
    '/tools': '/apps',
  },
  integrations: [react(), mdx()],
  vite: {
    plugins: [tailwindcss()],
  },
});
