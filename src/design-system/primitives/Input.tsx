import { forwardRef, InputHTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  invalid?: boolean;
  label?: string;
  hint?: string;
  /** `lg` — 48px row height; better touch targets on auth / mobile-first flows */
  fieldSize?: 'md' | 'lg';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { leftIcon, rightIcon, invalid, className, label, hint, id, fieldSize = 'md', ...rest },
  ref
) {
  const autoId = id || `input-${Math.random().toString(36).slice(2, 9)}`;
  const rowSize =
    fieldSize === 'lg'
      ? 'min-h-12 h-12 px-3.5 rounded-xl'
      : 'h-10 px-3 rounded-md';
  const inputText = fieldSize === 'lg' ? 'text-base' : 'text-[0.9375rem]';
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={autoId} className="text-xs font-medium text-fg-subtle">
          {label}
        </label>
      )}
      <div
        className={cn(
          'flex items-center gap-2 bg-surface-raised border border-border',
          rowSize,
          'transition-[box-shadow,border-color] duration-fast ease-standard',
          'focus-within:border-[color:var(--brand-primary)] focus-within:shadow-focus',
          invalid && 'border-[color:var(--brand-danger)] focus-within:border-[color:var(--brand-danger)]'
        )}
      >
        {leftIcon && <span className="flex-none text-fg-muted">{leftIcon}</span>}
        <input
          id={autoId}
          ref={ref}
          className={cn(
            'w-full bg-transparent outline-none text-fg placeholder:text-fg-muted',
            inputText,
            className
          )}
          {...rest}
        />
        {rightIcon && <span className="flex-none text-fg-muted">{rightIcon}</span>}
      </div>
      {hint && (
        <span className={cn('text-2xs', invalid ? 'text-[color:var(--brand-danger)]' : 'text-fg-muted')}>{hint}</span>
      )}
    </div>
  );
});
