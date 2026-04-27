import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const FB_SW_VERSION = '10.7.0';

/**
 * Writes `public/fcm-background.js` for Workbox `importScripts` (FCM onBackground).
 * Enabled when Vite env has Firebase + Web Push VAPID (Firebase Console → Cloud Messaging).
 */
function fcmBackgroundScriptPlugin(): Plugin {
  return {
    name: 'fcm-background-script',
    configResolved(c) {
      const env = loadEnv(c.mode, process.cwd(), 'VITE_');
      const outPath = path.join(__dirname, 'public/fcm-background.js');
      const enable =
        Boolean(env.VITE_FIREBASE_API_KEY) &&
        Boolean(env.VITE_FIREBASE_MESSAGING_SENDER_ID) &&
        Boolean(env.VITE_FIREBASE_VAPID_KEY);
      if (!enable) {
        writeFileSync(
          outPath,
          `// FCM background: set VITE_FIREBASE_* and VITE_FIREBASE_VAPID_KEY in .env to enable system notifications when the app is closed.\nvoid 0;\n`
        );
        return;
      }
      const cfg = {
        apiKey: env.VITE_FIREBASE_API_KEY,
        authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: env.VITE_FIREBASE_APP_ID,
        measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || undefined,
      };
      const body = `importScripts('https://www.gstatic.com/firebasejs/${FB_SW_VERSION}/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/${FB_SW_VERSION}/firebase-messaging-compat.js');
if (!firebase.apps.length) { firebase.initializeApp(${JSON.stringify(cfg)}); }
var messaging = firebase.messaging();
messaging.onBackgroundMessage(function (payload) {
  var n = payload.notification || {};
  var title = n.title || 'إشعار';
  var b = n.body || '';
  return self.registration.showNotification(title, { body: b, icon: '/brand/favicon.svg', badge: '/brand/favicon.svg', data: payload.data || {} });
});
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (cs) {
      for (var i = 0; i < cs.length; i++) { var c = cs[i]; if (c.url && c.focus) return c.focus(); }
      if (self.clients.openWindow) return self.clients.openWindow('/');
    })
  );
});
`;
      writeFileSync(outPath, body.trim() + '\n');
    },
  };
}

/**
 * ============================================================================
 *  Vite config — tuned for mobile PWA + Firebase Cloud Messaging.
 * ============================================================================
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const hasFcmWorkbox =
    Boolean(env.VITE_FIREBASE_API_KEY) &&
    Boolean(env.VITE_FIREBASE_MESSAGING_SENDER_ID) &&
    Boolean(env.VITE_FIREBASE_VAPID_KEY);

  const manifest = JSON.parse(readFileSync(path.join(__dirname, 'public/manifest.json'), 'utf-8')) as Record<
    string,
    unknown
  >;

  return {
    plugins: [
      react(),
      fcmBackgroundScriptPlugin(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        includeAssets: [
          'brand/favicon.svg',
          'brand/logo.svg',
          'brand/apple-touch-icon.svg',
          'fcm-background.js',
        ],
        manifest: {
          ...manifest,
        },
        manifestFilename: 'manifest.json',
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,json}'],
          navigateFallback: 'index.html',
          importScripts: hasFcmWorkbox ? ['/fcm-background.js'] : [],
        },
        devOptions: {
          enabled: true,
          navigateFallback: 'index.html',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        buffer: 'buffer',
      },
    },
    define: {
      'process.env': {},
      global: 'globalThis',
    },
    optimizeDeps: {
      include: [
        'buffer',
        'base64-js',
        'ieee754',
        'gsap',
        '@gsap/react',
        '@react-pdf/renderer',
        'firebase/messaging',
      ],
      esbuildOptions: {
        define: {
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
            'vendor-firebase': [
              'firebase/app',
              'firebase/auth',
              'firebase/firestore',
              'firebase/messaging',
            ],
            'vendor-state': [
              'zustand',
              '@tanstack/react-query',
              'react-hook-form',
              'zod',
              '@hookform/resolvers',
            ],
            'vendor-motion': ['gsap', '@gsap/react'],
            'vendor-pdf': ['@react-pdf/renderer'],
            'vendor-charts': ['recharts'],
            'vendor-xlsx': ['xlsx'],
            'vendor-dayjs': ['dayjs'],
          },
        },
      },
    },
  };
});
