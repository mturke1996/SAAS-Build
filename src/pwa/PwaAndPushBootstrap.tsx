import { useEffect, useRef } from 'react';
import { registerSW } from 'virtual:pwa-register';

import { hasValidFirebase } from '../config/firebase';
import { setupForegroundMessaging } from '../core/push/fcmClient';

/**
 * Registers the PWA service worker (workbox) and, when the user is signed in,
 * subscribes to FCM **foreground** messages (mirrors into the in-app center).
 * Background + system tray: fcm-background.js (generated when VAPID is set) + FCM from console.
 */
export function PwaAndPushBootstrap({ isAuthenticated }: { isAuthenticated: boolean }) {
  const swDone = useRef(false);
  const fcmDone = useRef(false);

  useEffect(() => {
    if (swDone.current) return;
    swDone.current = true;
    try {
      registerSW({
        immediate: true,
        onOfflineReady() {
          if (import.meta.env.DEV) {
            console.info('[PWA] offline cache ready');
          }
        },
        onRegisterError(e) {
          if (import.meta.env.DEV) {
            console.warn('[PWA] register error', e);
          }
        },
      });
    } catch (e) {
      if (import.meta.env.DEV) {
        console.warn('[PWA] registerSW failed', e);
      }
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !hasValidFirebase) return;
    if (fcmDone.current) return;
    fcmDone.current = true;
    void setupForegroundMessaging();
  }, [isAuthenticated]);

  return null;
}
