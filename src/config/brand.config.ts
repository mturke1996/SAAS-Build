import type { BrandConfig } from './brand.types';

/**
 * ============================================================================
 *  DEFAULT BRAND — "Air Blue & Slate" + connected Firebase project
 * ============================================================================
 *  Palette: trust-forward blue + cool slate surfaces (UI/UX Pro Max · fintech).
 *  Firebase: wired to the live "company-test-adafd" project.
 *
 *  To re-theme or re-wire at runtime, users can edit via /settings/branding —
 *  no code changes required.
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

  // ═════ Air Blue & Slate (primary = trust / open UI) ═════
  palette: {
    primary: '#2563EB',   // blue-600
    secondary: '#F59E0B', // amber-500 (accents / warmth)
    success: '#059669',   // emerald-600
    warning: '#F59E0B',   // amber-500
    danger: '#E11D48',    // rose-600
    info: '#0EA5E9',      // sky-500
  },

  typography: {
    sansStack: "'Inter', 'Outfit', system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
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
