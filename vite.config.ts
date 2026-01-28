import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  base: './', // Critical: Use relative paths for Electron
  server: {
    port: 5173,
    strictPort: false, // Allow port fallback if 5173 is busy
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  publicDir: 'assets',
});
