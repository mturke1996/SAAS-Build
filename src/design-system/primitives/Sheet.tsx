import { ReactNode, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import { cn } from './cn';
import { IconButton } from './IconButton';
import { Close, ArrowBack, ArrowForward } from '@mui/icons-material';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  subtitle?: ReactNode;
  /** Header tone: the top band background. Default brand gradient. */
  toneGradient?: string;
  /** Right-side (or RTL-start) action, e.g. a "+ Add" button. */
  headerAction?: ReactNode;
  /** Below-title row (filters, PDF export, etc). */
  headerExtras?: ReactNode;
  /** Pinned bottom action bar (e.g. "Save" / "Cancel" for forms). */
  footer?: ReactNode;
  children: ReactNode;
  /** Desktop max-width. Below lg the sheet is always full-width. */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
  /** Mobile presentation — default 'full' (full-screen on <lg). */
  mobile?: 'full' | 'bottom';
  /** Optional RTL awareness for the close arrow. Defaults from <html dir>. */
  rtl?: boolean;
  /** Radial glow blob in header (default true). Set false when using a custom toneGradient. */
  headerGlow?: boolean;
}

const widths = {
  sm: 'lg:max-w-lg',
  md: 'lg:max-w-2xl',
  lg: 'lg:max-w-4xl',
  xl: 'lg:max-w-6xl',
} as const;

/**
 * Sheet — modern bottom/full-screen panel that replaces MUI fullScreen Dialog.
 *
 *  - Mobile: slides up from bottom, occupies entire viewport.
 *  - Desktop (lg+): centered rounded panel with the same visual language.
 *  - Renders a brand-gradient header with title + close arrow + optional action.
 *  - Handles ESC + backdrop click dismissal, body-scroll lock, GSAP intro.
 *  - Respects iOS safe-area at top (notch) and bottom (home indicator).
 */
export function Sheet({
  open,
  onClose,
  title,
  subtitle,
  toneGradient,
  headerAction,
  headerExtras,
  footer,
  children,
  maxWidth = 'md',
  mobile = 'full',
  rtl,
  headerGlow = true,
}: SheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  const isRTL =
    rtl ??
    (typeof document !== 'undefined' &&
      document.documentElement.getAttribute('dir') === 'rtl');

  // Lock scroll + ESC handler
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  // GSAP intro: backdrop fade + panel slide-up (explicit from→to so cleanup never leaves panel invisible)
  useEffect(() => {
    if (!open || !panelRef.current || !backdropRef.current) return;
    const backdropEl = backdropRef.current;
    const panelEl = panelRef.current;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    gsap.set(backdropEl, { autoAlpha: 0 });
    gsap.set(panelEl, { autoAlpha: 0, y: reduced ? 0 : 20 });
    const tl = gsap.timeline();
    tl.to(backdropEl, {
      autoAlpha: 1,
      duration: reduced ? 0.01 : 0.22,
      ease: 'power2.out',
    });
    tl.to(
      panelEl,
      {
        autoAlpha: 1,
        y: 0,
        duration: reduced ? 0.01 : 0.28,
        ease: 'power3.out',
      },
      '-=0.15'
    );
    return () => {
      tl.kill();
      // When `open` becomes false, React unmounts the portal before this cleanup runs, so refs are
      // often null. Use captured nodes and only reset if still in the document (avoids GSAP "target not found").
      for (const el of [backdropEl, panelEl]) {
        if (el.isConnected) {
          gsap.set(el, {
            autoAlpha: 1,
            y: 0,
            clearProps: 'transform,opacity,visibility',
          });
        }
      }
    };
  }, [open]);

  if (!open) return null;

  const BackIcon = isRTL ? ArrowForward : ArrowBack;
  /** Slate / trust fintech — matches client profile sheets (no purple default). */
  const defaultGradient = 'linear-gradient(165deg, #0f172a 0%, #1e3a8a 48%, #2563eb 100%)';

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={typeof title === 'string' ? title : 'Sheet'}
      className="fixed inset-0 z-[1200]"
    >
      {/* Backdrop */}
      <div
        ref={backdropRef}
        onClick={onClose}
        className="absolute inset-0 bg-black/55 backdrop-blur-sm"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={cn(
          'absolute inset-x-0 bottom-0 flex flex-col',
          'lg:inset-auto lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2',
          'lg:w-[90vw] lg:h-auto lg:max-h-[90vh]',
          widths[maxWidth],
          mobile === 'full'
            ? 'top-0 rounded-none lg:rounded-2xl'
            : 'top-auto max-h-[92vh] rounded-t-3xl lg:rounded-2xl',
          'bg-surface-canvas overflow-hidden shadow-[0_-12px_44px_rgba(11,10,20,0.22)] lg:shadow-xl'
        )}
      >
        {/* Header band */}
        <header
          className="relative text-white shrink-0"
          style={{ background: toneGradient || defaultGradient }}
        >
          {headerGlow && (
            <div
              aria-hidden
              className="absolute -top-16 -right-12 w-[220px] h-[220px] rounded-full blur-3xl pointer-events-none"
              style={{
                background: 'radial-gradient(closest-side, rgba(14, 165, 233, 0.35) 0%, transparent 70%)',
                opacity: 0.22,
              }}
            />
          )}

          <div
            className={cn(
              'relative flex items-center gap-2 px-3 lg:px-5',
              mobile === 'full' ? 'pwa-safe-top' : ''
            )}
            style={{ paddingTop: mobile === 'full' ? undefined : '16px' }}
          >
            <div className="h-14 flex items-center gap-2 flex-1 min-w-0">
              <button
                onClick={onClose}
                aria-label="Close"
                className="h-10 w-10 flex items-center justify-center rounded-md bg-white/12 hover:bg-white/20 text-white backdrop-blur border border-white/15 transition-colors duration-fast pressable cursor-pointer"
              >
                <BackIcon sx={{ fontSize: 20 }} />
              </button>

              <div className="flex-1 min-w-0 px-1">
                {title && (
                  <div className="text-base lg:text-lg font-extrabold leading-tight truncate">
                    {title}
                  </div>
                )}
                {subtitle && (
                  <div className="text-2xs text-white/70 font-medium truncate">{subtitle}</div>
                )}
              </div>

              {headerAction && <div className="shrink-0">{headerAction}</div>}
            </div>
          </div>

          {headerExtras && <div className="relative px-4 lg:px-6 pb-3">{headerExtras}</div>}
        </header>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto overscroll-contain">{children}</div>

        {/* Footer */}
        {footer && (
          <div
            className={cn(
              'shrink-0 border-t border-[var(--surface-border)] bg-surface-panel',
              'px-4 lg:px-6 py-3',
              mobile === 'full' ? 'pwa-safe-bottom' : 'pb-[max(12px,env(safe-area-inset-bottom))]'
            )}
          >
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

/** A neutral "close X" icon button for sheet headers. */
export function SheetCloseButton({ onClick }: { onClick: () => void }) {
  return (
    <IconButton
      size="md"
      label="Close"
      onClick={onClick}
      className="bg-white/12 hover:bg-white/20 text-white border border-white/15"
    >
      <Close sx={{ fontSize: 18 }} />
    </IconButton>
  );
}
