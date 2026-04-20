import { forwardRef, HTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';

interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  interactive?: boolean;
  title?: ReactNode;
  description?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
}

/**
 * Minimal card. Optional header block (leading + title/description + trailing)
 * followed by arbitrary children.
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { interactive, title, description, leading, trailing, className, children, ...rest },
  ref
) {
  const hasHeader = !!(title || description || leading || trailing);
  return (
    <div
      ref={ref}
      className={cn(
        'bg-surface-panel border border-border rounded-lg',
        'transition-[box-shadow,transform,border-color] duration-base ease-standard',
        interactive && 'cursor-pointer hover:border-border-strong hover:shadow-sm active:translate-y-px',
        className
      )}
      {...rest}
    >
      {hasHeader && (
        <div className="flex items-center gap-3 p-4">
          {leading && <div className="flex-none">{leading}</div>}
          <div className="flex-1 min-w-0">
            {title && <div className="text-[0.9375rem] font-semibold text-fg leading-snug truncate">{title}</div>}
            {description && <div className="text-2xs text-fg-muted mt-0.5 truncate">{description}</div>}
          </div>
          {trailing && <div className="flex-none">{trailing}</div>}
        </div>
      )}
      {children && <div className={cn(hasHeader ? 'px-4 pb-4' : 'p-4')}>{children}</div>}
    </div>
  );
});
