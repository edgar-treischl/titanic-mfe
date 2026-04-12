import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';

export default defineConfig({
  base: '/analytics-mfe/', // 👈 REQUIRED for GitHub Pages

  plugins: [
    react(),
    federation({
      name: 'analytics',
      filename: 'remoteEntry.js',
      exposes: {
        './AnalyticsApp': './src/App.tsx',
      },
      shared: {
        react: { singleton: true },
        'react-dom': { singleton: true },
      },
    }),
  ],

  server: {
    host: true,
    port: 5174,
    cors: true,
  },

  preview: {
    host: true,
    port: 5174,
  },

  build: {
    target: 'esnext',
    cssCodeSplit: false,
    minify: false,
  },
});