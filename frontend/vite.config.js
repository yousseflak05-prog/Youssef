import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// L'API est appelée en chemin relatif (/api/…) : en développement le proxy
// évite CORS, en production le même chemin est servi par le reverse proxy.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY ?? 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
