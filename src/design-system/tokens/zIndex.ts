/** Z-index layering. Keep a single source of truth to avoid stack wars. */
export const zIndex = {
  base: 0,
  raised: 10,
  sticky: 100,
  dropdown: 1000,
  overlay: 1100,
  modal: 1200,
  popover: 1300,
  toast: 1400,
  tooltip: 1500,
  max: 9999,
} as const;
