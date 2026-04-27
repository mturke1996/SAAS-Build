import { createTheme, ThemeOptions } from '@mui/material/styles';
import type { BrandConfig, ThemeMode } from '../../config/brand.types';
import { radii, shadows } from '../tokens';

/**
 * ============================================================================
 *  createMuiBridge
 * ============================================================================
 *  Builds a MUI theme from the active `BrandConfig`. This exists so every
 *  legacy MUI surface inherits the white-label palette & typography without
 *  any per-component changes.
 *
 *  Component overrides here mirror the design-system primitives in /primitives:
 *  - 8px grid spacing unit
 *  - soft radii (md=8, lg=12)
 *  - minimal shadows
 *  - brand-driven focus ring
 * ============================================================================
 */

export function createMuiBridge(brand: BrandConfig, mode: ThemeMode = 'light') {
  const isDark = mode === 'dark';
  const p = brand.palette;

  const options: ThemeOptions = {
    direction: brand.direction,
    spacing: 4, // 4 * 2 = 8px for the default `1` spacing. Grid-friendly.
    palette: {
      mode,
      primary: { main: p.primary, contrastText: '#ffffff' },
      secondary: { main: p.secondary, contrastText: '#ffffff' },
      success: { main: p.success, contrastText: '#ffffff' },
      warning: { main: p.warning, contrastText: '#1b1b1f' },
      error: { main: p.danger, contrastText: '#ffffff' },
      info: { main: p.info, contrastText: '#ffffff' },
      background: {
        default: isDark ? '#0a0c12' : '#F3F1EC',
        paper: isDark ? '#121620' : '#ffffff',
      },
      text: {
        primary: isDark ? '#e8eaed' : '#0F1A35',
        secondary: isDark ? '#9aa1aa' : '#3D4A64',
      },
      divider: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,43,88,0.1)',
    },
    typography: {
      fontFamily:
        brand.direction === 'rtl' && brand.typography.arabicStack
          ? brand.typography.arabicStack
          : brand.typography.sansStack,
      h1: { fontWeight: 800, letterSpacing: '-0.025em' },
      h2: { fontWeight: 800, letterSpacing: '-0.02em' },
      h3: { fontWeight: 700, letterSpacing: '-0.015em' },
      h4: { fontWeight: 700 },
      h5: { fontWeight: 700 },
      h6: { fontWeight: 600 },
      subtitle1: { fontWeight: 600 },
      subtitle2: { fontWeight: 600 },
      body1: { fontWeight: 400, fontSize: '0.9375rem', lineHeight: 1.55 },
      body2: { fontWeight: 400, fontSize: '0.875rem', lineHeight: 1.55 },
      button: { fontWeight: 600, textTransform: 'none', letterSpacing: 0 },
      caption: { fontWeight: 500, fontSize: '0.75rem' },
    },
    shape: { borderRadius: 12 },
    components: {
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            borderRadius: radii.md,
            padding: '8px 16px',
            fontWeight: 600,
            fontSize: '0.875rem',
            transition: 'background-color .18s ease, box-shadow .18s ease, transform .12s ease',
            '&:active': { transform: 'translateY(1px)' },
          },
          sizeLarge: { padding: '12px 20px', fontSize: '0.9375rem' },
          sizeSmall: { padding: '6px 12px', fontSize: '0.8125rem', borderRadius: radii.sm },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: radii.md,
            transition: 'background-color .15s ease, transform .12s ease',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: radii.lg,
            boxShadow: isDark ? shadows.sm : shadows.sm,
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)'}`,
            backgroundImage: 'none',
          },
        },
      },
      MuiPaper: {
        styleOverrides: { root: { backgroundImage: 'none' } },
      },
      MuiDialog: {
        styleOverrides: {
          paper: { borderRadius: radii.xl, boxShadow: shadows.xl, backgroundImage: 'none' },
        },
      },
      MuiTextField: {
        defaultProps: { size: 'small' },
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: radii.md,
              transition: 'box-shadow .15s ease',
              '&.Mui-focused': { boxShadow: `0 0 0 3px rgba(${hexRgb(p.primary)} / 0.22)` },
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { fontWeight: 600, borderRadius: radii.sm },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            fontWeight: 600,
            fontSize: '0.75rem',
            borderRadius: radii.sm,
            backgroundColor: isDark ? '#2a2f38' : '#1b1f24',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            boxShadow: 'none',
            borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)'}`,
          },
        },
      },
      MuiDivider: {
        styleOverrides: {
          root: { borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)' },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            borderRadius: radii.sm,
            fontWeight: 500,
            margin: '2px 4px',
            minHeight: 36,
          },
        },
      },
    },
  };

  return createTheme(options);
}

function hexRgb(hex: string): string {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const num = parseInt(full, 16);
  return `${(num >> 16) & 255} ${(num >> 8) & 255} ${num & 255}`;
}
