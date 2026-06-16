import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Rebuild trigger for Tailwind config changes
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: process.env.VITE_API_URL || 'http://localhost:4000', changeOrigin: true }
    }
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      // @imgly/background-removal pulls in onnxruntime-web/* subpaths that
      // aren't installed; it loads its runtime from the imgly CDN (publicPath)
      // at runtime, so the bundler can safely treat these as external.
      external: [/^onnxruntime-web/],
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['react-hot-toast']
        }
      }
    }
  }
});
