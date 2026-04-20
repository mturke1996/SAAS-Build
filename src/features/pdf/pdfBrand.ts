import { useBrandStore } from '../../stores/useBrandStore';

/**
 * ============================================================================
 *  pdfBrand — SINGLE source of truth for PDF templates
 * ============================================================================
 *  Any PDF component calls `getPdfBrand()` once at render-time to receive a
 *  fully-resolved snapshot of the current brand, ready for `@react-pdf/renderer`.
 *
 *  Changes to the brand (name, logo, palette, contact) propagate to every
 *  generated PDF automatically. No hardcoded strings or URLs in templates.
 * ============================================================================
 */

export interface PdfBrandSnapshot {
  name: string;
  fullName: string;
  tagline: string;
  logoUrl: string;
  palette: {
    primary: string;
    primaryDark: string;
    accent: string;
    text: string;
    muted: string;
    border: string;
    rowAlt: string;
    headerBg: string;
    success: string;
    warning: string;
    danger: string;
  };
  contact: {
    phone: string;
    phone2: string;
    email: string;
    website: string;
    address: string;
  };
}

/** Simple hex mix for derived tones (matches applyBrand.ts behavior). */
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

/**
 * Resolve the logo URL for PDF embedding.
 * Accepts: absolute URL, data: URL, or site-root path (e.g. "/brand/logo.svg").
 * @react-pdf/renderer needs something reachable at render time, so we convert
 * leading-slash paths to absolute URLs using the current origin.
 */
function resolveLogo(src: string): string {
  if (!src) return '';
  if (src.startsWith('http://') || src.startsWith('https://')) return src;
  if (src.startsWith('data:')) return src;
  if (typeof window !== 'undefined') {
    if (src.startsWith('/')) return `${window.location.origin}${src}`;
    return new URL(src, window.location.origin).toString();
  }
  return src;
}

export function getPdfBrand(): PdfBrandSnapshot {
  const b = useBrandStore.getState().brand;
  const primary = b.palette.primary || '#4a5d4a';
  const secondary = b.palette.secondary || '#8b7e6a';

  return {
    name: b.name || '',
    fullName: b.fullName || b.name || '',
    tagline: b.tagline || '',
    logoUrl: resolveLogo(b.logo.src),
    palette: {
      primary,
      primaryDark: mix(primary, 0.2, 'black'),
      accent: secondary,
      text: '#1a1f1a',
      muted: mix(primary, 0.25, 'black'),
      border: '#e8e5de',
      rowAlt: '#fafaf8',
      headerBg: primary,
      success: b.palette.success || '#0d9668',
      warning: b.palette.warning || '#e6a817',
      danger: b.palette.danger || '#d64545',
    },
    contact: {
      phone: b.contact.phone || '',
      phone2: b.contact.phoneSecondary || '',
      email: b.contact.email || '',
      website: b.contact.website || '',
      address: b.contact.address || '',
    },
  };
}

/** Build a compact "address | phone" footer string, skipping empties. */
export function buildFooterLine(brand: PdfBrandSnapshot): string {
  return [brand.contact.address, brand.contact.phone, brand.contact.website]
    .filter(Boolean)
    .join(' • ');
}
