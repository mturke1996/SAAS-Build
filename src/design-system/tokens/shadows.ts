/**
 * Subtle, functional shadows only. No heavy drop-shadows.
 * Tuned for both light and dark modes via CSS vars in applyBrand.ts.
 */
export const shadows = {
  none: 'none',
  xs: '0 1px 1px rgba(15, 23, 42, 0.04)',
  sm: '0 1px 2px rgba(15, 23, 42, 0.06), 0 1px 3px rgba(15, 23, 42, 0.04)',
  md: '0 2px 6px rgba(15, 23, 42, 0.06), 0 4px 12px rgba(15, 23, 42, 0.04)',
  lg: '0 4px 12px rgba(15, 23, 42, 0.08), 0 10px 28px rgba(15, 23, 42, 0.06)',
  xl: '0 12px 32px rgba(15, 23, 42, 0.10), 0 24px 48px rgba(15, 23, 42, 0.06)',
  focus: '0 0 0 3px rgba(79, 70, 229, 0.28)', // overridden per-brand via CSS var
} as const;

export type ShadowToken = keyof typeof shadows;
