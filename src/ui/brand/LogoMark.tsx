import { useState } from 'react';
import { useBrand } from '../../config/BrandProvider';
import { cn } from '../../design-system/primitives/cn';

interface LogoMarkProps {
  size?: number;
  /** Include the brand name alongside the mark. */
  showName?: boolean;
  /** Inverted variant for dark surfaces. */
  inverted?: boolean;
  className?: string;
}

/**
 * ============================================================================
 *  LogoMark — the single brand surface for the app
 * ============================================================================
 *  Reads `brand.logo` from the active BrandConfig. Tries the image first,
 *  falls back to a letter-tile built from `brand.logo.letter` and the
 *  primary color.
 *
 *  Drop this anywhere a logo is needed. Never import a raw <img> elsewhere.
 * ============================================================================
 */
export function LogoMark({ size = 40, showName, inverted, className }: LogoMarkProps) {
  const brand = useBrand();
  const [failed, setFailed] = useState(false);
  const src = inverted && brand.logo.srcDark ? brand.logo.srcDark : brand.logo.src;

  const letterTile = (
    <div
      style={{
        width: size,
        height: size,
        background:
          'linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-primary-hover) 100%)',
        color: 'white',
        fontSize: Math.round(size * 0.48),
      }}
      className="rounded-md flex items-center justify-center font-bold select-none shadow-sm"
      aria-hidden
    >
      {brand.logo.letter}
    </div>
  );

  return (
    <div className={cn('inline-flex items-center gap-2.5', className)}>
      {failed || !src ? letterTile : (
        <img
          src={src}
          alt={brand.logo.alt}
          width={size}
          height={size}
          onError={() => setFailed(true)}
          style={{ width: size, height: size, objectFit: 'contain' }}
          className="rounded-md"
        />
      )}
      {showName && (
        <div className="flex flex-col leading-tight">
          <span className={cn('font-bold text-[0.95rem]', inverted ? 'text-white' : 'text-fg')}>{brand.name}</span>
          {brand.features?.showTagline && brand.tagline && (
            <span className={cn('text-2xs', inverted ? 'text-white/65' : 'text-fg-muted')}>{brand.tagline}</span>
          )}
        </div>
      )}
    </div>
  );
}
