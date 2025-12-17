import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import fs from 'fs';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,  // Fail if port 5173 is in use, don't auto-switch
    https: fs.existsSync('./skynet-api-builder.ssnc-corp.lab+3-key.pem')
      ? {
          key: fs.readFileSync('./skynet-api-builder.ssnc-corp.lab+3-key.pem'),
          cert: fs.readFileSync('./skynet-api-builder.ssnc-corp.lab+3.pem'),
        }
      : undefined,
    allowedHosts: ['skynet-api-builder.ssnc-corp.lab', '.ssnc-corp.lab'],
  },
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          vendor: [
            'react-router-dom',
            '@tanstack/react-query',
            'react-hook-form',
            'zod',
            'js-yaml',
            'classnames',
          ],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './vitest.setup.ts',
  },
});
