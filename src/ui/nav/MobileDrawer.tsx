import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import gsap from 'gsap';
import { Close, Brightness4, Brightness7, Logout } from '@mui/icons-material';
import { LogoMark } from '../brand/LogoMark';
import { IconButton } from '../../design-system/primitives';
import { cn } from '../../design-system/primitives/cn';
import { useBrand } from '../../config/BrandProvider';
import { useAuthStore } from '../../stores/useAuthStore';
import { useThemeStore } from '../../stores/useThemeStore';
import { useAppLockStore } from '../../stores/useAppLockStore';
import { PRIMARY_NAV, SECONDARY_NAV, NavItem, navLabel } from './navItems';
import { motion } from '../../design-system/tokens/motion';

/**
 * ============================================================================
 *  MobileDrawer — full navigation for mobile/tablet (< lg)
 * ============================================================================
 *  - Slides in from the start edge (right for RTL, left for LTR)
 *  - Escape key + backdrop click to close
 *  - GSAP slide in/out within 200-280ms
 *  - Locks body scroll while open
 *  - Contains ALL navigation destinations + theme + logout
 * ============================================================================
 */

interface Props {
  open: boolean;
  onClose: () => void;
}

export function MobileDrawer({ open, onClose }: Props) {
  const brand = useBrand();
  const rtl = brand.direction === 'rtl';
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { mode, toggleTheme } = useThemeStore();
  const { canAccess } = useAppLockStore();
  const panelRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // GSAP slide-in
  useEffect(() => {
    if (!open) return;
    const from = rtl ? '100%' : '-100%';
    gsap.fromTo(
      panelRef.current,
      { xPercent: rtl ? 100 : -100 },
      { xPercent: 0, duration: motion.duration.slow, ease: 'power3.out' }
    );
    gsap.fromTo(
      backdropRef.current,
      { autoAlpha: 0 },
      { autoAlpha: 1, duration: motion.duration.base, ease: 'power2.out' }
    );
    gsap.fromTo(
      panelRef.current?.querySelectorAll('[data-item]') ?? [],
      { autoAlpha: 0, x: rtl ? 20 : -20 },
      { autoAlpha: 1, x: 0, duration: 0.22, ease: 'power2.out', stagger: 0.03, delay: 0.08 }
    );
    void from;
  }, [open, rtl]);

  if (!open) return null;

  const visible = (item: NavItem) => !item.module || canAccess(item.module as any);
  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const go = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleLogout = async () => {
    await logout();
    onClose();
    navigate('/login');
  };

  return createPortal(
    <div className="fixed inset-0 z-[1300] lg:hidden" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        ref={backdropRef}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />

      {/* Panel — slides from start edge */}
      <div
        ref={panelRef}
        className={cn(
          'absolute top-0 bottom-0 w-[84vw] max-w-[340px] bg-surface-panel shadow-xl flex flex-col',
          'rtl:right-0 rtl:rounded-l-2xl ltr:left-0 ltr:rounded-r-2xl'
        )}
      >
        {/* Header */}
        <header className="h-14 flex items-center justify-between px-4 border-b border-[var(--surface-border)] shrink-0">
          <button
            onClick={() => go('/')}
            className="flex items-center gap-2.5 cursor-pointer"
            aria-label="Home"
          >
            <LogoMark size={30} showName />
          </button>
          <IconButton size="sm" label={rtl ? 'إغلاق' : 'Close'} onClick={onClose}>
            <Close fontSize="small" />
          </IconButton>
        </header>

        {/* User card */}
        <div data-item className="px-4 py-3 border-b border-[var(--surface-border)] flex items-center gap-3 shrink-0">
          <div
            className="h-10 w-10 rounded-full bg-[color:var(--brand-primary-soft)] text-[color:var(--brand-primary)] flex items-center justify-center font-bold"
            aria-hidden
          >
            {user?.displayName?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate">{user?.displayName || (rtl ? 'المستخدم' : 'User')}</div>
            <div className="text-2xs text-fg-muted truncate">{user?.email}</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2" aria-label={rtl ? 'القائمة' : 'Navigation'}>
          <Section label={rtl ? 'مساحة العمل' : 'Workspace'}>
            {PRIMARY_NAV.filter(visible).map((item) => (
              <DrawerLink
                key={item.path}
                item={item}
                label={navLabel(item, brand.direction)}
                active={isActive(item.path)}
                onClick={() => go(item.path)}
              />
            ))}
          </Section>

          <Section label={rtl ? 'أقسام أخرى' : 'More'}>
            {SECONDARY_NAV.filter(visible).map((item) => (
              <DrawerLink
                key={item.path}
                item={item}
                label={navLabel(item, brand.direction)}
                active={isActive(item.path)}
                onClick={() => go(item.path)}
              />
            ))}
          </Section>
        </nav>

        {/* Footer actions */}
        <div className="border-t border-[var(--surface-border)] p-3 flex items-center gap-2 shrink-0 pb-[max(12px,env(safe-area-inset-bottom))]">
          <button
            data-item
            onClick={toggleTheme}
            className="flex-1 h-11 flex items-center justify-center gap-2 rounded-md bg-surface-sunken hover:bg-surface-hover text-sm font-medium transition-colors duration-fast cursor-pointer"
          >
            {mode === 'dark' ? <Brightness7 sx={{ fontSize: 18 }} /> : <Brightness4 sx={{ fontSize: 18 }} />}
            <span>{rtl ? (mode === 'dark' ? 'الوضع الفاتح' : 'الوضع الداكن') : mode === 'dark' ? 'Light' : 'Dark'}</span>
          </button>
          <button
            data-item
            onClick={handleLogout}
            className="flex-1 h-11 flex items-center justify-center gap-2 rounded-md text-brand-danger hover:bg-brand-danger/10 text-sm font-medium transition-colors duration-fast cursor-pointer"
          >
            <Logout sx={{ fontSize: 18 }} />
            <span>{rtl ? 'خروج' : 'Sign out'}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div data-item className="px-2 mb-1.5 text-2xs font-semibold uppercase tracking-wider text-fg-muted">
        {label}
      </div>
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  );
}

function DrawerLink({
  item,
  label,
  active,
  onClick,
}: {
  item: NavItem;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;
  return (
    <button
      data-item
      onClick={onClick}
      className={cn(
        'group w-full flex items-center gap-3 h-11 px-3 rounded-md cursor-pointer',
        'text-sm font-medium transition-all duration-fast ease-standard pressable',
        'focus:outline-none focus-visible:shadow-focus text-start',
        active
          ? 'bg-[color:var(--brand-primary-soft)] text-[color:var(--brand-primary)] font-semibold'
          : 'text-fg-subtle hover:text-fg hover:bg-surface-sunken'
      )}
    >
      <Icon sx={{ fontSize: 20 }} />
      <span className="flex-1 truncate">{label}</span>
    </button>
  );
}
