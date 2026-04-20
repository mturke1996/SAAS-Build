import { ReactNode, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from './cn';
import { scaleIn } from '../../core/motion/presets';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg';
  /** Set false to disable backdrop click-to-close. */
  dismissible?: boolean;
}

const widths = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-2xl',
} as const;

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  maxWidth = 'md',
  dismissible = true,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dismissible) onClose();
    };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [open, onClose, dismissible]);

  useEffect(() => {
    if (open && panelRef.current) {
      scaleIn(panelRef.current);
    }
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[1200] flex items-center justify-center p-4"
    >
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={dismissible ? onClose : undefined}
      />
      <div
        ref={panelRef}
        className={cn(
          'relative w-full bg-surface-panel border border-border rounded-xl shadow-xl',
          widths[maxWidth]
        )}
      >
        {(title || description) && (
          <header className="p-5 border-b border-border">
            {title && <h2 className="text-lg font-semibold text-fg leading-snug">{title}</h2>}
            {description && <p className="text-sm text-fg-subtle mt-1">{description}</p>}
          </header>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>,
    document.body
  );
}
