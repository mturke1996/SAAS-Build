import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

/**
 * ============================================================================
 *  Vite config — tuned for mobile PWA performance + CJS/ESM interop.
 * ============================================================================
 *  Key concerns:
 *  - `@react-pdf/renderer` pulls in `buffer` → `base64-js` → `ieee754`
 *    (all CommonJS). Vite must PRE-BUNDLE them for ESM consumers.
 *  - Node `global` → browser `globalThis` is required at BOTH the
 *    esbuild pre-bundle step AND the final build step.
 *  - Chunk splitting keeps the initial JS bundle lean on mobile.
 * ============================================================================
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      buffer: 'buffer',
    },
  },
  define: {
    'process.env': {},
    // Without this, `base64-js` references `global` and crashes in the browser
    global: 'globalThis',
  },
  optimizeDeps: {
    // Force Vite to pre-bundle these CJS deps so they get a proper `default` export
    include: [
      'buffer',
      'base64-js',
      'ieee754',
      'gsap',
      '@gsap/react',
      '@react-pdf/renderer',
    ],
    esbuildOptions: {
      define: {
        // Same `global` mapping at the pre-bundle step
        global: 'globalThis',
      },
    },
  },
  server: {
    port: 3000,
    host: true,
  },
  build: {
    chunkSizeWarningLimit: 900,
    target: 'es2020',
    minify: 'esbuild',
    cssMinify: 'esbuild',
    cssCodeSplit: true,
    sourcemap: false,
    reportCompressedSize: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-router': ['react-router-dom'],
          'vendor-mui': ['@mui/material', '@mui/icons-material'],
          'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          'vendor-state': ['zustand', '@tanstack/react-query', 'react-hook-form', 'zod', '@hookform/resolvers'],
          'vendor-motion': ['gsap', '@gsap/react'],
          'vendor-pdf': ['@react-pdf/renderer'],
          'vendor-charts': ['recharts'],
          'vendor-xlsx': ['xlsx'],
          'vendor-dayjs': ['dayjs'],
        },
      },
    },
  },
});
