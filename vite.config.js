import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Vite v8 (Rolldown) requires manualChunks to be a function, not an object.
        manualChunks(id) {
          if (id.includes('@supabase/supabase-js')) return 'vendor-supabase';
          if (id.includes('date-fns')) return 'vendor-date';
          if (id.includes('framer-motion')) return 'vendor-motion';
          if (id.includes('/three/')) return 'vendor-three';
        },
      },
    },
  },
  test: { environment: 'node', globals: true, include: ['src/**/*.test.{js,jsx}'] },
});
