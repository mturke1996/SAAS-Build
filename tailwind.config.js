/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  darkMode: ['class', "[data-theme='dark']"],
  theme: {
    screens: {
      xs: '375px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        brand: {
          DEFAULT: 'rgb(var(--brand-primary-rgb) / <alpha-value>)',
          primary: 'var(--brand-primary)',
          'primary-hover': 'var(--brand-primary-hover)',
          'primary-soft': 'var(--brand-primary-soft)',
          secondary: 'var(--brand-secondary)',
          success: 'var(--brand-success)',
          warning: 'var(--brand-warning)',
          danger: 'var(--brand-danger)',
          info: 'var(--brand-info)',
        },
        surface: {
          canvas: 'var(--surface-canvas)',
          panel: 'var(--surface-panel)',
          raised: 'var(--surface-raised)',
          sunken: 'var(--surface-sunken)',
          hover: 'var(--surface-hover)',
        },
        border: {
          DEFAULT: 'var(--surface-border)',
          strong: 'var(--surface-border-strong)',
        },
        fg: {
          DEFAULT: 'var(--text-primary)',
          subtle: 'var(--text-secondary)',
          muted: 'var(--text-tertiary)',
          inverse: 'var(--text-inverse)',
        },
      },
      fontFamily: {
        sans: ['var(--brand-font-sans)'],
        mono: ['var(--brand-font-mono)'],
        arabic: ['var(--brand-font-arabic)'],
      },
      spacing: {
        0.5: '2px', 1: '4px', 2: '8px', 3: '12px', 4: '16px',
        5: '20px', 6: '24px', 7: '28px', 8: '32px', 10: '40px',
        12: '48px', 14: '56px', 16: '64px', 18: '72px', 20: '80px',
        'safe-b': 'env(safe-area-inset-bottom)',
        'safe-t': 'env(safe-area-inset-top)',
      },
      borderRadius: {
        xs: '4px', sm: '6px', md: '8px', lg: '12px', xl: '16px', '2xl': '20px',
      },
      boxShadow: {
        xs: 'var(--shadow-xs)',
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
        focus: 'var(--brand-focus-ring)',
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1.2' }],
        xs: ['0.75rem', { lineHeight: '1.4' }],
        sm: ['0.8125rem', { lineHeight: '1.45' }],
        base: ['0.9375rem', { lineHeight: '1.55' }],
        md: ['1rem', { lineHeight: '1.5' }],
        lg: ['1.125rem', { lineHeight: '1.45' }],
        xl: ['1.25rem', { lineHeight: '1.4' }],
        '2xl': ['1.5rem', { lineHeight: '1.3', letterSpacing: '-0.015em' }],
        '3xl': ['1.875rem', { lineHeight: '1.25', letterSpacing: '-0.02em' }],
        '4xl': ['2.25rem', { lineHeight: '1.15', letterSpacing: '-0.025em' }],
        '5xl': ['3rem', { lineHeight: '1.1', letterSpacing: '-0.03em' }],
      },
      transitionDuration: {
        fast: '150ms',
        base: '220ms',
        slow: '300ms',
      },
      transitionTimingFunction: {
        standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
        bounce: 'cubic-bezier(0.34, 1.2, 0.64, 1)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-primary-hover) 100%)',
        'brand-radial': 'radial-gradient(circle at 30% 10%, rgba(var(--brand-primary-rgb)/0.15) 0%, transparent 60%)',
      },
    },
  },
  plugins: [],
};
