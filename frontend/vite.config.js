import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Use '/taskflow/' base for GitHub Pages deployment, '/' for local dev
const base = process.env.VITE_BASE_PATH || '/';

export default defineConfig({
  base,
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    allowedHosts: true,
    proxy: { '/api': 'http://localhost:3001' }
  }
});
