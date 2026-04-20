/**
 * Typographic scale — conservative, reads like ChatGPT/Linear/Stripe.
 * Sizes in rem. Line-heights tuned for density without crowding.
 */
export const typography = {
  size: {
    '2xs': '0.6875rem',  // 11px
    xs: '0.75rem',       // 12px
    sm: '0.8125rem',     // 13px
    base: '0.9375rem',   // 15px  — default body
    md: '1rem',          // 16px
    lg: '1.125rem',      // 18px
    xl: '1.25rem',       // 20px
    '2xl': '1.5rem',     // 24px
    '3xl': '1.875rem',   // 30px
    '4xl': '2.25rem',    // 36px
    '5xl': '3rem',       // 48px
  },
  weight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
  leading: {
    tight: 1.15,
    snug: 1.3,
    normal: 1.5,
    relaxed: 1.65,
  },
  tracking: {
    tighter: '-0.03em',
    tight: '-0.015em',
    normal: '0',
    wide: '0.02em',
    wider: '0.06em',
  },
} as const;
