import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // GitHub Pages deploys under /G/ (project page base path)
  base: process.env.GITHUB_ACTIONS ? '/G/' : '/',
  server: { port: 5174 },
});
