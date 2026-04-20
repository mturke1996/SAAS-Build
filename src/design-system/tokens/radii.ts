/**
 * Minimal radius scale. ChatGPT/Linear-style: small radii.
 * Avoid pill-shapes for anything other than badges & pills.
 */
export const radii = {
  none: '0px',
  xs: '4px',
  sm: '6px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  full: '9999px',
} as const;

export type RadiusToken = keyof typeof radii;
