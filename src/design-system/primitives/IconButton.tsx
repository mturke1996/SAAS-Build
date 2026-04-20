import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from './cn';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'ghost' | 'soft' | 'outline';
  label: string; // required for a11y
}

const sizes = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
} as const;

const variants = {
  ghost: 'text-fg-subtle hover:text-fg hover:bg-surface-sunken',
  soft: 'text-fg bg-surface-sunken hover:bg-[color:var(--brand-primary-soft)] hover:text-[color:var(--brand-primary)]',
  outline: 'text-fg border border-border hover:border-border-strong hover:bg-surface-sunken',
} as const;

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { size = 'md', variant = 'ghost', label, className, children, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex items-center justify-center rounded-md transition-colors duration-fast ease-standard',
        'focus:outline-none focus-visible:shadow-focus',
        sizes[size],
        variants[variant],
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
});
