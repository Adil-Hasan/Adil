import { defineConfig } from 'astro/config';

export default defineConfig({
  site: process.env.SITE_URL || 'https://adil-hasan.github.io',
  base: process.env.BASE_PATH || '/',
  output: 'static',
  server: { host: '127.0.0.1', port: 5173 },
});
