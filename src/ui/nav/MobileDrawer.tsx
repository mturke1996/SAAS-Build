import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import gsap from 'gsap';
import {
  Close, Brightness4, Brightness7, Logout,
  Lock as LockIcon, LockOpen, Security, Settings as SettingsIcon,
} from '@mui/icons-material';
import { LogoMark } from '../brand/LogoMark';
import { IconButton } from '../../design-system/primitives';
import { cn } from '../../design-system/primitives/cn';
import { useBrand } from '../../config/BrandProvider';
import { useAuthStore } from '../../stores/useAuthStore';
import { useThemeStore } from '../../stores/useThemeStore';
import { useAppLockStore } from '../../stores/useAppLockStore';
import { AppLockSettingsDialog } from '../AppLockSettingsDialog';
import { PRIMARY_NAV, SECONDARY_NAV, NavItem, navLabel } from './navItems';
import { motion } from '../../design-system/tokens/motion';
import { useState } from 'react';
import toast from 'react-hot-toast';

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
  const { canAccess, isLocked, pinCode, lockSession, isSessionUnlocked, isAppLockReady } = useAppLockStore();
  const panelRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const [appLockOpen, setAppLockOpen] = useState(false);

  const hasPin = Boolean(pinCode && String(pinCode).trim().length > 0);
  const sessionUnlocked = isSessionUnlocked();

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    gsap.fromTo(panelRef.current, { xPercent: rtl ? 100 : -100 }, { xPercent: 0, duration: motion.duration.slow, ease: 'power3.out' });
    gsap.fromTo(backdropRef.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: motion.duration.base, ease: 'power2.out' });
    gsap.fromTo(
      panelRef.current?.querySelectorAll('[data-item]') ?? [],
      { autoAlpha: 0, x: rtl ? 20 : -20 },
      { autoAlpha: 1, x: 0, duration: 0.22, ease: 'power2.out', stagger: 0.025, delay: 0.06 }
    );
  }, [open, rtl]);

  if (!open) return null;

  const visible = (item: NavItem) => !item.module || canAccess(item.module as any);
  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const go = (path: string) => { navigate(path); onClose(); };

  const handleLogout = async () => { await logout(); onClose(); navigate('/login'); };

  return createPortal(
    <div className="fixed inset-0 z-[1300] lg:hidden touch-manipulation" role="dialog" aria-modal="true">
      <div ref={backdropRef} onClick={onClose} className="absolute inset-0 z-0 bg-black/40 backdrop-blur-sm" />

      <div
        ref={panelRef}
        className={cn(
          'fixed z-[1] flex w-[min(88vw,360px)] max-w-[360px] flex-col overflow-hidden min-h-0',
          'bg-surface-panel shadow-2xl border border-[var(--surface-border)]',
          'rtl:right-0 rtl:rounded-l-3xl ltr:left-0 ltr:rounded-r-3xl',
          'top-0 bottom-0'
        )}
        style={{
          paddingTop: 'max(0px, env(safe-area-inset-top))',
          paddingBottom: 'max(0px, env(safe-area-inset-bottom))',
        }}
      >
        {/* ── Header with logo ── */}
        <header data-item className="flex items-center justify-between px-5 py-4 border-b border-[var(--surface-border)] shrink-0">
          <button onClick={() => go('/')} className="flex items-center gap-3 cursor-pointer" aria-label="Home">
            <LogoMark size={32} showName />
          </button>
          <IconButton size="sm" label={rtl ? 'إغلاق' : 'Close'} onClick={onClose} className="bg-surface-sunken hover:bg-surface-hover">
            <Close fontSize="small" />
          </IconButton>
        </header>

        {/* ── User profile card ── */}
        <div data-item className="px-5 py-4 border-b border-[var(--surface-border)] shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-primary-hover)] text-white flex items-center justify-center font-bold text-lg shadow-md border border-white/20"
              aria-hidden
            >
              {user?.displayName?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-extrabold text-fg truncate font-arabic">{user?.displayName || (rtl ? 'المستخدم' : 'User')}</div>
              <div className="text-2xs text-fg-muted truncate font-mono" dir="ltr">{user?.email}</div>
            </div>
          </div>
        </div>

        {/* ── Full Navigation ── */}
        <nav className="flex-1 min-h-0 overflow-y-auto overscroll-contain py-3 px-3" aria-label={rtl ? 'القائمة' : 'Navigation'}>
          {/* Primary Pages */}
          <DrawerSection label={rtl ? 'الصفحات الرئيسية' : 'Main'}>
            {PRIMARY_NAV.filter(visible).map((item) => (
              <DrawerLink key={item.path} item={item} label={navLabel(item, brand.direction)} active={isActive(item.path)} onClick={() => go(item.path)} />
            ))}
          </DrawerSection>

          {/* Secondary Pages */}
          <DrawerSection label={rtl ? 'المزيد والإعدادات' : 'More & Settings'}>
            {SECONDARY_NAV.filter(visible).map((item) => (
              <DrawerLink key={item.path} item={item} label={navLabel(item, brand.direction)} active={isActive(item.path)} onClick={() => go(item.path)} />
            ))}
          </DrawerSection>

          {/* App Lock Widget */}
          {isAppLockReady && hasPin && isLocked && (
            <div data-item className="mx-1 mt-2 mb-3">
              <div className={cn(
                'rounded-2xl p-3 border transition-all',
                sessionUnlocked
                  ? 'bg-surface-panel border-[var(--surface-border)]'
                  : 'bg-red-500/5 border-red-500/20'
              )}>
                <div className="flex items-center gap-3 mb-3">
                  <span className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm',
                    sessionUnlocked
                      ? 'bg-green-500/10 text-green-600 border border-green-500/20'
                      : 'bg-red-500 text-white'
                  )}>
                    {sessionUnlocked ? <Security sx={{ fontSize: 20 }} /> : <LockIcon sx={{ fontSize: 20 }} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={cn('text-sm font-bold font-arabic', !sessionUnlocked && 'text-red-500')}>
                      {rtl ? 'أمان التطبيق' : 'App Security'}
                    </p>
                    <p className="text-2xs text-fg-muted">
                      {sessionUnlocked ? (rtl ? 'مفتوح' : 'Unlocked') : (rtl ? 'مقفل' : 'Locked')}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {sessionUnlocked ? (
                    <button
                      onClick={() => { lockSession(); toast.success(rtl ? 'تم تفعيل التقييد' : 'Locked'); }}
                      className="flex-1 h-10 flex items-center justify-center gap-1.5 rounded-xl text-xs font-bold bg-surface-sunken text-fg-subtle border border-[var(--surface-border)] hover:bg-red-500 hover:text-white hover:border-red-500 transition-all"
                    >
                      <LockIcon sx={{ fontSize: 16 }} />
                      {rtl ? 'قفل' : 'Lock'}
                    </button>
                  ) : (
                    <button
                      onClick={() => setAppLockOpen(true)}
                      className="flex-1 h-10 flex items-center justify-center gap-1.5 rounded-xl text-xs font-bold border-2 border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                    >
                      <LockOpen sx={{ fontSize: 16 }} />
                      {rtl ? 'فك القفل' : 'Unlock'}
                    </button>
                  )}
                  <button
                    onClick={() => setAppLockOpen(true)}
                    className="h-10 w-10 flex items-center justify-center rounded-xl border border-[var(--surface-border)] bg-surface-sunken text-fg-subtle hover:bg-[var(--brand-primary)] hover:text-white transition-all"
                  >
                    <SettingsIcon sx={{ fontSize: 18 }} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </nav>

        {/* ── Footer actions ── */}
        <div className="border-t border-[var(--surface-border)] p-3 flex items-center gap-2 shrink-0 bg-surface-sunken/30">
          <button
            data-item
            onClick={toggleTheme}
            className="flex-1 h-12 flex items-center justify-center gap-2.5 rounded-2xl bg-surface-panel hover:bg-surface-hover text-sm font-bold border border-[var(--surface-border)] transition-colors cursor-pointer shadow-sm"
          >
            {mode === 'dark' ? <Brightness7 sx={{ fontSize: 20 }} /> : <Brightness4 sx={{ fontSize: 20 }} />}
            <span className="font-arabic">{rtl ? (mode === 'dark' ? 'فاتح' : 'داكن') : mode === 'dark' ? 'Light' : 'Dark'}</span>
          </button>
          <button
            data-item
            onClick={handleLogout}
            className="flex-1 h-12 flex items-center justify-center gap-2.5 rounded-2xl text-red-500 hover:bg-red-500/10 text-sm font-bold border border-red-500/10 transition-colors cursor-pointer"
          >
            <Logout sx={{ fontSize: 20 }} />
            <span className="font-arabic">{rtl ? 'خروج' : 'Sign out'}</span>
          </button>
        </div>
      </div>

      <AppLockSettingsDialog open={appLockOpen} onClose={() => setAppLockOpen(false)} />
    </div>,
    document.body
  );
}

function DrawerSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div data-item className="px-3 mb-2 text-[0.65rem] font-bold uppercase tracking-wider text-fg-muted/80 font-arabic">
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
        'group w-full flex items-center gap-3 h-12 px-3 rounded-2xl cursor-pointer',
        'text-sm transition-all duration-200 ease-out',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand text-start',
        active
          ? 'bg-[var(--brand-primary-soft)] text-[var(--brand-primary)] font-extrabold shadow-sm'
          : 'text-fg-subtle hover:text-fg hover:bg-surface-hover font-semibold'
      )}
    >
      <span className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all',
        active
          ? 'bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-primary-hover)] text-white shadow-md'
          : 'bg-surface-sunken text-fg-muted group-hover:text-[var(--brand-primary)] group-hover:scale-105'
      )}>
        <Icon sx={{ fontSize: 20 }} />
      </span>
      <span className="flex-1 truncate font-arabic">{label}</span>
    </button>
  );
}
