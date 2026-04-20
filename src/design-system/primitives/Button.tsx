import { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const base =
  'inline-flex items-center justify-center gap-2 font-semibold rounded-md ' +
  'transition-all duration-base ease-standard select-none ' +
  'disabled:opacity-50 disabled:cursor-not-allowed pressable ' +
  'focus:outline-none focus-visible:shadow-focus';

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-10 px-4 text-[0.875rem]',
  lg: 'h-12 px-5 text-base',
};

const variants: Record<Variant, string> = {
  primary:
    'text-white bg-[color:var(--brand-primary)] hover:bg-[color:var(--brand-primary-hover)] shadow-xs hover:shadow-brand',
  secondary:
    'text-fg bg-surface-sunken hover:bg-[color:var(--brand-primary-soft)] hover:text-[color:var(--brand-primary)]',
  ghost: 'text-fg-subtle hover:text-fg hover:bg-surface-sunken',
  outline:
    'text-fg bg-transparent border border-border hover:border-strong hover:bg-surface-sunken',
  danger: 'text-white bg-[color:var(--brand-danger)] hover:brightness-95 shadow-xs',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', block, loading, leftIcon, rightIcon, className, children, disabled, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(base, sizes[size], variants[variant], block && 'w-full', className)}
      {...rest}
    >
      {loading ? (
        <span
          aria-hidden
          className="inline-block h-4 w-4 rounded-full border-2 border-current border-r-transparent animate-spin"
        />
      ) : (
        leftIcon
      )}
      <span className="inline-flex items-center">{children}</span>
      {!loading && rightIcon}
    </button>
  );
});
