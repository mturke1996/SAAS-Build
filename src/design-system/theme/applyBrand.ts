import type { BrandConfig } from '../../config/brand.types';

/**
 * ============================================================================
 *  applyBrandToDocument — writes brand tokens to :root as CSS variables
 * ============================================================================
 *  Tailwind utilities, MUI bridge, and hand-written CSS all consume these
 *  variables, so any brand change propagates instantly with no re-render.
 *
 *  Also syncs:
 *   - <html dir>  for RTL/LTR
 *   - <html lang> for accessibility / font selection
 *   - document.title
 *   - <meta theme-color>
 * ============================================================================
 */

function hexToRgb(hex: string): string {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const num = parseInt(full, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `${r} ${g} ${b}`;
}

/** Mix toward white or black by pct (0-1). Returns hex. */
function mix(hex: string, pct: number, toward: 'white' | 'black'): string {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const num = parseInt(full, 16);
  let r = (num >> 16) & 255;
  let g = (num >> 8) & 255;
  let b = num & 255;
  const target = toward === 'white' ? 255 : 0;
  r = Math.round(r + (target - r) * pct);
  g = Math.round(g + (target - g) * pct);
  b = Math.round(b + (target - b) * pct);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export function applyBrandToDocument(brand: BrandConfig) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  // ── Document direction + language ─────────────────────────
  root.setAttribute('dir', brand.direction);
  root.setAttribute('lang', brand.locale.split('-')[0]);

  // ── Window title ──────────────────────────────────────────
  const title = brand.features?.showTagline && brand.tagline
    ? `${brand.name} — ${brand.tagline}`
    : brand.name;
  document.title = title;

  // ── Palette → CSS variables ───────────────────────────────
  const p = brand.palette;
  const set = (name: string, value: string) => root.style.setProperty(name, value);

  // Primary
  set('--brand-primary', p.primary);
  set('--brand-primary-rgb', hexToRgb(p.primary));
  set('--brand-primary-hover', mix(p.primary, 0.12, 'black'));
  set('--brand-primary-soft', mix(p.primary, 0.88, 'white'));

  // Secondary
  set('--brand-secondary', p.secondary);
  set('--brand-secondary-rgb', hexToRgb(p.secondary));

  // Semantic
  set('--brand-success', p.success);
  set('--brand-warning', p.warning);
  set('--brand-danger', p.danger);
  set('--brand-info', p.info);

  // Typography stacks
  set('--brand-font-sans', brand.typography.sansStack);
  if (brand.typography.numericStack) set('--brand-font-mono', brand.typography.numericStack);
  if (brand.typography.arabicStack) set('--brand-font-arabic', brand.typography.arabicStack);

  // Derived focus ring (22% alpha on primary)
  set('--brand-focus-ring', `0 0 0 3px rgba(${hexToRgb(p.primary)} / 0.22)`);

  // ── PWA theme color meta ──────────────────────────────────
  const metas = document.querySelectorAll('meta[name="theme-color"]');
  if (metas.length === 0) {
    const meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    meta.setAttribute('content', p.primary);
    document.head.appendChild(meta);
  } else {
    // Only update the unqualified one (without media query)
    metas.forEach((m) => {
      if (!m.getAttribute('media')) m.setAttribute('content', p.primary);
    });
  }
}
