import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  integrations: [react(), tailwind()],
  build: {
    inlineStylesheets: 'always' // Inline all CSS to prevent render blocking
  },
  vite: {
    resolve: {
      alias: {
        '@components': '/src/components',
        '@layouts': '/src/layouts'
      }
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            // Split syntax highlighter into separate chunk
            'syntax-highlighter': ['react-syntax-highlighter']
          }
        }
      },
      // Increase chunk size warning limit (636 KB unminified, but only 230 KB gzipped)
      chunkSizeWarningLimit: 700
    }
  }
});