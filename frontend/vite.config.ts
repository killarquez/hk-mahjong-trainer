import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 8080,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: process.env.VITE_BACKEND_URL || 'http://localhost:8000',
        changeOrigin: true,
      },
      '/static/tiles': {
        target: process.env.VITE_BACKEND_URL || 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
});
