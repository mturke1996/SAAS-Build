/**
 * ============================================================================
 *  SPACING — strict 8px grid
 * ============================================================================
 *  Use these tokens everywhere. NEVER hand-pick pixel values.
 *  Half-steps (2px/4px) exist only for borders/hairlines — not for layout.
 * ============================================================================
 */

export const spacing = {
  0: '0px',
  px: '1px',
  0.5: '2px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  7: '28px',
  8: '32px',
  10: '40px',
  12: '48px',
  14: '56px',
  16: '64px',
  20: '80px',
  24: '96px',
  32: '128px',
} as const;

export type SpacingToken = keyof typeof spacing;
