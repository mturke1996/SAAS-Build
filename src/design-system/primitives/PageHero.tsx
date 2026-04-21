import { ReactNode } from 'react';
import { cn } from './cn';

export type PageHeroAccent = 'brand' | 'success' | 'danger' | 'warning';

const ACCENT_GRADIENTS: Record<PageHeroAccent, { bg: string; blob1: string; blob2: string }> = {
  brand: {
    bg: 'linear-gradient(155deg, #0c1222 0%, #1e3a8a 42%, #2563eb 100%)',
    blob1: 'radial-gradient(closest-side, rgba(125,211,252,0.45) 0%, transparent 70%)',
    blob2: 'radial-gradient(closest-side, rgba(37,99,235,0.4) 0%, transparent 72%)',
  },
  success: {
    bg: 'linear-gradient(135deg, #052e16 0%, #14532d 40%, #16a34a 100%)',
    blob1: 'radial-gradient(closest-side, rgba(52,211,153,0.6) 0%, transparent 70%)',
    blob2: 'radial-gradient(closest-side, rgba(16,185,129,0.5) 0%, transparent 70%)',
  },
  danger: {
    bg: 'linear-gradient(135deg, #350a0a 0%, #7f1d1d 40%, #dc2626 100%)',
    blob1: 'radial-gradient(closest-side, rgba(251,113,133,0.6) 0%, transparent 70%)',
    blob2: 'radial-gradient(closest-side, rgba(225,29,72,0.5) 0%, transparent 70%)',
  },
  warning: {
    bg: 'linear-gradient(135deg, #1c1107 0%, #713f12 40%, #ca8a04 100%)',
    blob1: 'radial-gradient(closest-side, rgba(251,191,36,0.6) 0%, transparent 70%)',
    blob2: 'radial-gradient(closest-side, rgba(245,158,11,0.5) 0%, transparent 70%)',
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
  rounded?: '2xl' | '3xl';
  reveal?: boolean;
  /** Optional logo/brand element above the eyebrow */
  brand?: ReactNode;
}

/**
 * PageHero — Premium branded hero with deep gradients, Aurora blobs,
 * grain texture. Always white text on rich accent background.
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
  rounded = '2xl',
  reveal,
  brand: brandSlot,
}: PageHeroProps) {
  const gradient = ACCENT_GRADIENTS[accent];

  return (
    <section
      {...(reveal ? { 'data-reveal': '' as const } : {})}
      className={cn(
        'relative overflow-hidden grain text-white',
        rounded === '3xl' ? 'rounded-[32px]' : 'rounded-[24px]',
        'border border-white/10',
        className
      )}
      style={{
        background: gradient.bg,
        boxShadow: '0 16px 40px -10px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.12)',
      }}
    >
      {/* Aurora blob warm */}
      <div
        aria-hidden
        className="absolute -top-[60%] -right-[30%] w-[150%] h-[150%] rounded-full blur-[100px] pointer-events-none animate-aurora"
        style={{ background: gradient.blob1, opacity: 0.45 }}
      />
      {/* Aurora blob cool */}
      <div
        aria-hidden
        className="absolute -bottom-[50%] -left-[20%] w-[140%] h-[140%] rounded-full blur-[100px] pointer-events-none animate-aurora"
        style={{ background: gradient.blob2, opacity: 0.5, animationDelay: '-6s' }}
      />
      {/* Bottom vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />

      {/* Hero body */}
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between p-5 sm:p-6 lg:p-7 z-10">
        <div className="flex-1 min-w-0">
          {/* Brand slot (logo + company name) */}
          {brandSlot && <div className="mb-3">{brandSlot}</div>}

          {/* Eyebrow pill */}
          {eyebrow && (
            <div className="flex flex-wrap items-center gap-2 mb-2.5">
              <div className="inline-flex items-center text-xs font-bold font-arabic px-3 py-1.5 bg-white/12 backdrop-blur-sm border border-white/15 rounded-full text-white/90 shadow-sm">
                {eyebrow}
              </div>
            </div>
          )}

          {/* Title */}
          <h1 className="text-[1.35rem] sm:text-2xl lg:text-[1.85rem] font-extrabold tracking-tight leading-tight text-white font-arabic drop-shadow-md">
            {title}
          </h1>

          {subtitle && (
            <p className="text-white/75 text-xs sm:text-sm mt-1.5 leading-relaxed max-w-md font-arabic drop-shadow-sm">
              {subtitle}
            </p>
          )}

          {/* Headline */}
          {headline && (
            <div className="mt-4 sm:mt-5">
              {headlineLabel && (
                <div className="text-xs font-bold tracking-tight text-white/65 mb-1.5 font-arabic">
                  {headlineLabel}
                </div>
              )}
              <div className="text-4xl sm:text-[2.5rem] lg:text-[3rem] font-extrabold tracking-tight font-num tabular-nums leading-none text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.3)]">
                {headline}
              </div>
            </div>
          )}
        </div>

        {trailing && <div className="shrink-0 flex items-start gap-2 sm:pt-1">{trailing}</div>}
      </div>

      {/* Footer Stats Triple */}
      {footerStatsTriple && (
        <div className="relative grid grid-cols-3 border-t border-white/15 bg-black/25 backdrop-blur-xl z-10">
          {footerStatsTriple.map((s, i) => (
            <div
              key={i}
              className={cn(
                'p-3 sm:p-5 text-center transition-colors hover:bg-white/5',
                i > 0 && 'border-s border-white/10'
              )}
            >
              <div className="text-xs text-white/65 font-bold font-arabic">{s.label}</div>
              <div className="text-base sm:text-xl font-extrabold text-white mt-1 font-num tabular drop-shadow-sm">{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Footer Stats Dual */}
      {footerStats && !footerStatsTriple && (
        <div className="relative grid grid-cols-2 border-t border-white/15 bg-black/25 backdrop-blur-xl z-10">
          <div className="p-4 sm:p-5 text-center transition-colors hover:bg-white/5 border-s border-white/10">
            <div className="text-xs text-white/65 font-bold font-arabic">{footerStats[0].label}</div>
            <div className="text-lg sm:text-xl font-extrabold text-white mt-1 font-num tabular drop-shadow-sm">{footerStats[0].value}</div>
          </div>
          <div className="p-4 sm:p-5 text-center transition-colors hover:bg-white/5 border-s border-white/10">
            <div className="text-xs text-white/65 font-bold font-arabic">{footerStats[1].label}</div>
            <div className="text-lg sm:text-xl font-extrabold text-white mt-1 font-num tabular drop-shadow-sm">{footerStats[1].value}</div>
          </div>
        </div>
      )}
    </section>
  );
}
