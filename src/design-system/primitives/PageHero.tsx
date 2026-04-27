import { ReactNode } from 'react';
import { cn } from './cn';

export type PageHeroAccent = 'brand' | 'success' | 'danger' | 'warning';

const ACCENT_GRADIENTS: Record<PageHeroAccent, { bg: string; blob1: string; blob2: string }> = {
  brand: {
    bg: 'linear-gradient(150deg, #0a0f1c 0%, #1A2B58 50%, #1e3260 100%)',
    blob1: 'radial-gradient(closest-side, rgba(253,226,230,0.2) 0%, transparent 70%)',
    blob2: 'radial-gradient(closest-side, rgba(96,130,200,0.32) 0%, transparent 72%)',
  },
  success: {
    bg: 'linear-gradient(135deg, #052e16 0%, #14532d 40%, #16a34a 100%)',
    blob1: 'radial-gradient(closest-side, rgba(52,211,153,0.45) 0%, transparent 70%)',
    blob2: 'radial-gradient(closest-side, rgba(16,185,129,0.35) 0%, transparent 70%)',
  },
  danger: {
    bg: 'linear-gradient(135deg, #350a0a 0%, #7f1d1d 40%, #dc2626 100%)',
    blob1: 'radial-gradient(closest-side, rgba(251,113,133,0.45) 0%, transparent 70%)',
    blob2: 'radial-gradient(closest-side, rgba(225,29,72,0.35) 0%, transparent 70%)',
  },
  warning: {
    bg: 'linear-gradient(135deg, #1c1107 0%, #713f12 40%, #ca8a04 100%)',
    blob1: 'radial-gradient(closest-side, rgba(251,191,36,0.4) 0%, transparent 70%)',
    blob2: 'radial-gradient(closest-side, rgba(245,158,11,0.32) 0%, transparent 70%)',
  },
};

export type PageHeroStat = { label: string; value: ReactNode };

export interface PageHeroProps {
  eyebrow: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  headlineLabel?: ReactNode;
  headline?: ReactNode;
  accent?: PageHeroAccent;
  footerStats?: [PageHeroStat, PageHeroStat];
  footerStatsTriple?: [PageHeroStat, PageHeroStat, PageHeroStat];
  trailing?: ReactNode;
  className?: string;
  /**
   * @deprecated Rounded is always 2xl (dashboard strip). Kept for API compat.
   */
  rounded?: '2xl' | '3xl';
  /**
   * Home / shell: one step tighter (padding + type). List pages use default dense layout.
   */
  compact?: boolean;
  reveal?: boolean;
  brand?: ReactNode;
}

/**
 * PageHero — app-shell strip (fintech / cockpit density).
 * No oversized display type; hierarchy via weight + color, not scale (see design-taste-frontend).
 */
export function PageHero({
  eyebrow,
  title,
  subtitle,
  headlineLabel,
  headline,
  accent = 'brand',
  footerStats,
  footerStatsTriple,
  trailing,
  className,
  compact = false,
  reveal,
  brand: brandSlot,
}: PageHeroProps) {
  const gradient = ACCENT_GRADIENTS[accent];
  const micro = compact;

  return (
    <section
      {...(reveal ? { 'data-reveal': '' as const } : {})}
      className={cn('relative overflow-hidden rounded-2xl grain text-white border border-white/10', className)}
      style={{
        background: gradient.bg,
        boxShadow: micro
          ? '0 4px 20px -6px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.08)'
          : '0 6px 24px -8px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.09), inset 0 -1px 0 rgba(255,255,255,0.03)',
      }}
    >
      {/* Restrained orbs — static, no animated aurora (calmer, more “product”) */}
      <div
        aria-hidden
        className="pointer-events-none absolute -end-[20%] -top-[40%] h-[min(80%,360px)] w-[min(70%,320px)] rounded-full opacity-[0.12] blur-[64px] motion-reduce:opacity-[0.06]"
        style={{ background: gradient.blob1 }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-[45%] -start-[15%] h-[min(70%,300px)] w-[min(65%,280px)] rounded-full opacity-[0.1] blur-[72px] motion-reduce:opacity-0"
        style={{ background: gradient.blob2 }}
      />
      <div
        className={cn('pointer-events-none absolute inset-0 bg-gradient-to-t to-transparent', micro ? 'from-black/15' : 'from-black/18')}
      />

      <div
        className={cn(
          'relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between',
          micro ? 'gap-2 p-2.5 sm:gap-2.5 sm:px-3 sm:py-2.5' : 'gap-2.5 p-2.5 sm:gap-3 sm:px-3.5 sm:py-3'
        )}
      >
        <div className="min-w-0 flex-1">
          {brandSlot && (
            <div className={cn('origin-top', micro ? 'mb-1 scale-[0.92]' : 'mb-1.5')}>{brandSlot}</div>
          )}

          {eyebrow && (
            <div className={cn('flex flex-wrap items-center gap-1.5', micro ? 'mb-1' : 'mb-1.5')}>
              <div
                className={cn(
                  'inline-flex min-h-6 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.08] px-2 py-0.5 font-arabic font-bold text-white/90 backdrop-blur-sm',
                  micro ? 'text-[0.6rem]' : 'text-[0.65rem] sm:text-[0.7rem]'
                )}
              >
                {eyebrow}
              </div>
            </div>
          )}

          <h1
            className={cn(
              'font-arabic font-bold leading-snug tracking-tight text-white',
              micro ? 'text-sm sm:text-base' : 'text-[0.9rem] sm:text-[0.95rem] lg:text-base'
            )}
          >
            {title}
          </h1>

          {subtitle && (
            <p
              className={cn(
                'mt-0.5 max-w-lg font-arabic leading-relaxed text-white/72',
                micro ? 'text-2xs sm:text-xs' : 'text-2xs sm:text-xs'
              )}
            >
              {subtitle}
            </p>
          )}

          {headline && (
            <div className={micro ? 'mt-1.5 sm:mt-2' : 'mt-2 sm:mt-2.5'}>
              {headlineLabel && (
                <div className="text-2xs font-bold tracking-tight text-white/60 mb-0.5 font-arabic">{headlineLabel}</div>
              )}
              <div
                className={cn(
                  'font-extrabold tracking-tight font-num tabular-nums leading-none text-white',
                  'text-lg sm:text-xl lg:text-2xl',
                  'max-w-full'
                )}
              >
                {headline}
              </div>
            </div>
          )}
        </div>

        {trailing && (
          <div className="flex shrink-0 items-center justify-end gap-1.5 sm:justify-start">{trailing}</div>
        )}
      </div>

      {footerStatsTriple && (
        <div className="relative z-10 grid grid-cols-3 divide-x divide-white/10 border-t border-white/10 bg-black/20 backdrop-blur-md rtl:divide-x-reverse">
          {footerStatsTriple.map((s, i) => (
            <div key={i} className="px-1.5 py-2 text-center transition-colors hover:bg-white/[0.04] sm:px-2 sm:py-2.5">
              <div className="text-[0.65rem] font-bold text-white/60 font-arabic leading-tight sm:text-2xs">{s.label}</div>
              <div className="mt-0.5 text-sm font-extrabold text-white font-num tabular-nums sm:text-base">{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {footerStats && !footerStatsTriple && (
        <div className="relative z-10 grid grid-cols-2 divide-x divide-white/10 border-t border-white/10 bg-black/20 backdrop-blur-md rtl:divide-x-reverse">
          <div className="px-1.5 py-2 text-center transition-colors hover:bg-white/[0.04] sm:px-2 sm:py-2.5">
            <div className="text-[0.65rem] font-bold text-white/60 font-arabic sm:text-2xs">{footerStats[0].label}</div>
            <div className="mt-0.5 text-sm font-extrabold text-white font-num tabular-nums sm:text-base">{footerStats[0].value}</div>
          </div>
          <div className="px-1.5 py-2 text-center transition-colors hover:bg-white/[0.04] sm:px-2 sm:py-2.5">
            <div className="text-[0.65rem] font-bold text-white/60 font-arabic sm:text-2xs">{footerStats[1].label}</div>
            <div className="mt-0.5 text-sm font-extrabold text-white font-num tabular-nums sm:text-base">{footerStats[1].value}</div>
          </div>
        </div>
      )}
    </section>
  );
}
