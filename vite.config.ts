import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // env is loaded so VITE_* vars are available; GEMINI_API_KEY stays server-only
    loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          // Forward /api/* to Vercel dev server (vercel dev runs on 3000 by default,
          // but when using plain `vite`, proxy to a separate vercel dev instance if needed)
          '/api': {
            target: 'http://localhost:3001',
            changeOrigin: true,
          },
        },
      },
      plugins: [react()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        },
      },
    };
});
