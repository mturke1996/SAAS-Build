import type { BrandConfig } from './brand.types';

/**
 * ============================================================================
 *  DEFAULT BRAND — "Navy & Peach" (Stitch-style fintech) + Firebase
 * ============================================================================
 *  Deep navy primary, warm off-white canvas, coral/peach for urgent surfaces.
 *  Firebase: wired to the live "company-test-adafd" project.
 * ============================================================================
 */

export const DEFAULT_BRAND: BrandConfig = {
  name: 'تطبيقك',
  fullName: 'شركتك — اسم كامل قابل للتعديل',
  tagline: 'إدارة متكاملة • فواتير • عملاء • مدفوعات',
  locale: 'ar-LY',
  direction: 'rtl',
  defaultMode: 'light',

  logo: {
    src: '/brand/logo.svg',
    srcDark: '/brand/logo.svg',
    alt: 'شعار الشركة',
    letter: 'ت',
  },

  // ═════ Navy + peach accent (curator / premium SaaS) ═════
  palette: {
    primary: '#1A2B58',   // deep navy — buttons, nav, focus
    secondary: '#C45C4E', // warm coral (secondary actions / warm accent)
    success: '#0D9488',   // teal-600
    warning: '#D97706',   // amber-600
    danger: '#B91C1C',    // red-700 (matches “action” copy on peach)
    info: '#0369A1',      // sky-800
  },

  typography: {
    sansStack: "'Inter', 'Outfit', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    numericStack: "'Outfit', ui-monospace, monospace",
    /** Cairo-first for SaaS Arabic UI; editable in الإعدادات → العلامة التجارية */
    arabicStack: "'Cairo', 'Tajawal', system-ui, sans-serif",
  },

  contact: {
    phone: '',
    email: '',
    website: '',
    address: '',
    social: {},
  },

  /**
   * Firebase — LIVE CONNECTION to `company-test-adafd`.
   *
   * Security note: Firebase web apiKey is a public identifier, NOT a secret.
   * Access control is enforced server-side via Firestore Security Rules.
   * That said, for public repos you should move these to `.env` as
   * VITE_FIREBASE_* (env vars take priority over this default).
   */
  firebase: {
    apiKey: 'AIzaSyD5D3w5DlYMp6G8YRgpDV1FPeNgKzTWimU',
    authDomain: 'company-test-adafd.firebaseapp.com',
    projectId: 'company-test-adafd',
    storageBucket: 'company-test-adafd.firebasestorage.app',
    messagingSenderId: '447127121348',
    appId: '1:447127121348:web:f46c412960da725437c891',
    measurementId: 'G-HNTCQCB23B',
  },

  features: {
    showTagline: true,
    showSocial: false,
    enableDarkMode: true,
  },
};

export default DEFAULT_BRAND;
