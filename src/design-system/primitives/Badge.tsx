import { CSSProperties, HTMLAttributes } from 'react';
import { cn } from './cn';

type Tone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  subtle?: boolean;
}

const colorVar: Record<Tone, string> = {
  neutral: 'var(--text-primary)',
  brand: 'var(--brand-primary)',
  success: 'var(--brand-success)',
  warning: 'var(--brand-warning)',
  danger: 'var(--brand-danger)',
  info: 'var(--brand-info)',
};

/**
 * Badge — compact status pill. `subtle` uses a 12% wash of the tone color
 * (via `color-mix`), `solid` uses the raw tone. Keeps opacity consistent
 * across arbitrary brand colors without relying on RGB triplets.
 */
export function Badge({ tone = 'neutral', subtle = true, className, style, ...rest }: BadgeProps) {
  const solidText = tone === 'warning' ? '#1b1b1f' : '#ffffff';
  const styles: CSSProperties = subtle
    ? {
        backgroundColor:
          tone === 'neutral'
            ? 'var(--surface-sunken)'
            : `color-mix(in srgb, ${colorVar[tone]} 14%, transparent)`,
        color: tone === 'neutral' ? 'var(--text-primary)' : colorVar[tone],
      }
    : {
        backgroundColor: colorVar[tone],
        color: solidText,
      };

  return (
    <span
      style={{ ...styles, ...style }}
      className={cn(
        'inline-flex items-center h-6 px-2 rounded-sm text-2xs font-semibold tracking-wide',
        className
      )}
      {...rest}
    />
  );
}
