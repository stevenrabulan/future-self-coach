import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The UI never calls OpenRouter: the browser fetches only /api/*, which the
// dev server proxies to the relay (127.0.0.1:8787, key server-side).
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8787',
        changeOrigin: true,
      },
    },
  },
});
