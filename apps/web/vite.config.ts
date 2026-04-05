import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  if (mode === 'production' && !process.env.VITE_API_BASE_URL?.trim()) {
    console.warn(
      '[vite] VITE_API_BASE_URL is unset — the production bundle will use relative /api. ' +
        'On a static host (e.g. Render) that usually breaks auth; set VITE_API_BASE_URL to your API base (…/api).',
    );
  }

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      chunkSizeWarningLimit: 1000,
    },
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
      },
    },
  };
});
