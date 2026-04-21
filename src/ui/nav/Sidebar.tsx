import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LogoMark } from '../brand/LogoMark';
import { cn } from '../../design-system/primitives/cn';
import { SIDEBAR_NAV, SIDEBAR_GROUP_SLICES, NavItem, navLabel } from './navItems';
import { useAppLockStore } from '../../stores/useAppLockStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { useThemeStore } from '../../stores/useThemeStore';
import { useBrand } from '../../config/BrandProvider';
import { IconButton } from '../../design-system/primitives';
import { AppLockSettingsDialog } from '../AppLockSettingsDialog';
import {
  Brightness4,
  Brightness7,
  Logout,
  ChevronLeft,
  ChevronRight,
  LockOpen,
  Lock as LockIcon,
  Security,
  Settings as SettingsIcon,
  VerifiedUser,
} from '@mui/icons-material';

/**
 * Desktop sidebar (lg+): full-viewport rail, layered visuals, integrated app lock.
 * Hidden on mobile — replaced by MobileDrawer + MobileBottomNav.
 */
export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { canAccess } = useAppLockStore();
  const { user, logout } = useAuthStore();
  const { mode, toggleTheme } = useThemeStore();
  const brand = useBrand();
  const rtl = brand.direction === 'rtl';
  const ChevronOut = rtl ? ChevronLeft : ChevronRight;
  const [appLockDialogOpen, setAppLockDialogOpen] = useState(false);

  const visible = (item: NavItem) => !item.module || canAccess(item.module as any);
  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside
      className={cn(
        'app-shell-sidebar relative isolate hidden h-full min-h-0 shrink-0 overflow-hidden',
        'lg:flex lg:flex-col w-[272px] xl:w-[288px]',
        'border-[var(--surface-border)] bg-surface-panel rtl:border-l ltr:border-r z-[1]',
        'pb-[max(0px,env(safe-area-inset-bottom))]',
        'shadow-[inset_-1px_0_0_0_color-mix(in_oklab,var(--surface-border)_80%,transparent)]'
      )}
    >
      {/* Full-height ambience */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(165deg,color-mix(in_oklab,var(--surface-sunken)_90%,transparent)_0%,transparent_100%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-[10%] -start-[20%] size-[min(140%,500px)] rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--brand-primary)_12%,transparent)_0%,transparent_70%)] opacity-80 animate-aurora"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 start-0 w-[2px] bg-gradient-to-b from-[color-mix(in_oklab,var(--brand-primary)_80%,transparent)] via-[color-mix(in_oklab,var(--brand-primary)_20%,transparent)] to-transparent"
      />

      <div className="relative z-[1] flex h-full min-h-0 flex-1 flex-col">
        {/* Brand */}
        <div className="flex h-[3.5rem] shrink-0 items-center border-b border-[color-mix(in_oklab,var(--surface-border)_90%,transparent)] px-3 backdrop-blur-[2px]">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex w-full min-w-0 items-center gap-2.5 rounded-xl py-2 ps-1 -ms-0.5 cursor-pointer transition-[opacity,transform] duration-fast hover:opacity-95 active:scale-[0.99]"
            aria-label="Home"
          >
            <LogoMark size={34} showName />
          </button>
        </div>

        {/* Nav — full app map */}
        <nav
          className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2 py-3"
          aria-label={rtl ? 'القائمة الرئيسية' : 'Main navigation'}
        >
          {SIDEBAR_GROUP_SLICES.map((group) => {
            const slice = SIDEBAR_NAV.slice(group.start, group.end).filter(visible);
            if (slice.length === 0) return null;
            const title = rtl ? group.titleAr : group.titleEn;
            return (
              <SidebarSection key={`${group.start}-${group.end}`} label={title}>
                {slice.map((item) => (
                  <SidebarLink
                    key={item.path}
                    item={item}
                    active={isActive(item.path)}
                    onClick={() => navigate(item.path)}
                    label={navLabel(item, brand.direction)}
                    rtl={rtl}
                    ChevronOut={ChevronOut}
                  />
                ))}
              </SidebarSection>
            );
          })}
        </nav>

        {/* App lock — session + settings */}
        <SidebarAppLockBlock rtl={rtl} onOpenSettings={() => setAppLockDialogOpen(true)} />

        {/* User */}
        <div className="shrink-0 border-t border-[color-mix(in_oklab,var(--surface-border)_60%,transparent)] bg-[color-mix(in_oklab,var(--surface-panel)_70%,transparent)] p-3 backdrop-blur-xl relative z-10">
          <div className="flex items-center gap-3">
            <div
              className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-gradient-to-br from-[var(--brand-primary)] to-[#c084fc] text-white text-sm font-bold shadow-[0_4px_10px_rgba(109,40,217,0.3)] border border-white/20"
              aria-hidden
            >
              {user?.displayName?.charAt(0)?.toUpperCase() || 'U'}
              <span className="absolute -bottom-1 -end-1 size-3.5 rounded-full border-2 border-[var(--surface-panel)] bg-green-500 shadow-sm" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-extrabold text-fg font-arabic">{user?.displayName || (rtl ? 'المستخدم' : 'User')}</div>
              <div className="truncate text-2xs text-fg-muted font-mono">{user?.email}</div>
            </div>
            <div className="flex flex-col gap-1">
              <IconButton size="sm" label={rtl ? 'تبديل السمة' : 'Toggle theme'} onClick={toggleTheme} className="bg-surface-sunken hover:bg-surface-hover hover:text-[var(--brand-primary)]">
                {mode === 'dark' ? <Brightness7 fontSize="small" /> : <Brightness4 fontSize="small" />}
              </IconButton>
              <IconButton size="sm" label={rtl ? 'تسجيل الخروج' : 'Sign out'} onClick={handleLogout} className="bg-surface-sunken hover:bg-surface-hover hover:text-red-500">
                <Logout fontSize="small" />
              </IconButton>
            </div>
          </div>
        </div>
      </div>

      <AppLockSettingsDialog open={appLockDialogOpen} onClose={() => setAppLockDialogOpen(false)} />
    </aside>
  );
}

function SidebarAppLockBlock({ rtl, onOpenSettings }: { rtl: boolean; onOpenSettings: () => void }) {
  const {
    isLocked,
    isAppLockReady,
    pinCode,
    lockSession,
    isSessionUnlocked,
  } = useAppLockStore();
  const hasPin = Boolean(pinCode && String(pinCode).trim().length > 0);
  const sessionUnlocked = isSessionUnlocked();

  if (!isAppLockReady) {
    return (
      <div className="shrink-0 px-2 pb-2" aria-busy="true" aria-label={rtl ? 'جاري تحميل إعدادات الأمان' : 'Loading security'}>
        <div className="rounded-2xl border border-[var(--surface-border)] bg-surface-sunken/40 px-3 py-3">
          <div className="mb-2 h-2.5 w-[55%] animate-pulse rounded-md bg-surface-sunken" />
          <div className="h-2 w-full animate-pulse rounded-md bg-surface-sunken/80" />
        </div>
      </div>
    );
  }

  const title = rtl ? 'أمان التطبيق' : 'App security';
  const configure = rtl ? 'إدارة' : 'Manage';

  if (!hasPin || !isLocked) {
    return (
      <div className="shrink-0 px-2 pb-2">
        <div className="rounded-2xl border border-dashed border-[color-mix(in_oklab,var(--surface-border)_95%,var(--brand-primary))] bg-[color-mix(in_oklab,var(--surface-sunken)_35%,transparent)] px-3 py-2.5">
          <div className="flex items-start gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-panel/80 text-fg-muted shadow-sm ring-1 ring-[var(--surface-border)]">
              <Security sx={{ fontSize: 20 }} />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-xs font-semibold text-fg">{title}</p>
              <p className="mt-0.5 text-[0.6875rem] leading-snug text-fg-muted">
                {rtl ? 'فعّل قفل الشاشة للحماية الإضافية.' : 'Enable screen lock for extra protection.'}
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenSettings}
              className={cn(
                'shrink-0 inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-2xs font-semibold',
                'bg-[color:var(--brand-primary-soft)] text-[color:var(--brand-primary)]',
                'transition-colors hover:bg-[color-mix(in_oklab,var(--brand-primary-soft)_85%,var(--surface-raised))]',
                'focus:outline-none focus-visible:shadow-focus'
              )}
            >
              <SettingsIcon sx={{ fontSize: 15 }} />
              {configure}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="shrink-0 px-3 pb-3 relative z-10">
      <div
        className={cn(
          'rounded-[20px] p-3 shadow-sm transition-all duration-300 relative overflow-hidden group border',
          sessionUnlocked
            ? 'bg-surface-panel hover:shadow-md hover:border-green-500/30 border-[var(--surface-border)]'
            : 'bg-gradient-to-br from-red-500/10 to-transparent hover:shadow-[0_4px_20px_rgba(239,68,68,0.15)] border-red-500/30'
        )}
      >
        {/* Glow backdrop inside the widget */}
        <div className={cn(
          "absolute -inset-10 opacity-0 group-hover:opacity-10 transition-opacity duration-700 blur-2xl rounded-full",
          sessionUnlocked ? "bg-green-500" : "bg-red-500"
        )}></div>

        <div className="flex items-center gap-3 relative z-10">
          <span
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-xs transition-colors duration-300',
              sessionUnlocked
                ? 'bg-green-500/10 text-green-600 border border-green-500/20'
                : 'bg-red-500 text-white shadow-[0_4px_10px_rgba(239,68,68,0.4)]'
            )}
          >
            {sessionUnlocked ? <VerifiedUser sx={{ fontSize: 20 }} /> : <LockIcon sx={{ fontSize: 20 }} className="animate-pulse-ring rounded-full" />}
          </span>
          <div className="min-w-0 flex-1">
            <p className={cn("text-sm font-extrabold font-arabic truncate leading-tight", !sessionUnlocked && "text-red-500")}>{title}</p>
            <p className="mt-0.5 text-2xs text-fg-muted font-arabic leading-snug">
              {sessionUnlocked
                ? rtl
                  ? 'مفتوح وصلاحية كاملة'
                  : 'Session unlocked'
                : rtl
                  ? 'النظام مقفل وتالقيود مفعلة'
                  : 'Enter PIN for access'}
            </p>
          </div>
        </div>
        
        <div className="mt-3 flex gap-2 relative z-10">
          {sessionUnlocked ? (
            <button
              type="button"
              onClick={() => {
                lockSession();
                toast.success(rtl ? 'تم تفعيل التقييد' : 'Session locked.', { duration: 2200 });
              }}
              className={cn(
                'inline-flex flex-1 items-center justify-center gap-1.5 rounded-[10px] px-2 py-2 text-xs font-bold font-arabic',
                'bg-surface-sunken text-fg-subtle border border-[var(--surface-border)]',
                'hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-300 shadow-sm hover:shadow-md focus:outline-none focus-visible:shadow-focus'
              )}
            >
              <LockIcon sx={{ fontSize: 16 }} />
              {rtl ? 'قفل النظام' : 'Lock session'}
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenSettings}
              className={cn(
                'inline-flex flex-1 items-center justify-center gap-1.5 rounded-[10px] px-2 py-2 text-xs font-bold font-arabic',
                'bg-surface-panel border-2 border-red-500/20 text-red-500',
                'hover:bg-red-500 hover:text-white transition-all duration-300 shadow-[0_2px_8px_rgba(239,68,68,0.2)] focus:outline-none'
              )}
            >
              <LockOpen sx={{ fontSize: 16 }} />
              {rtl ? 'فك القفل' : 'Unlock'}
            </button>
          )}
          <button
            type="button"
            onClick={onOpenSettings}
            className={cn(
              'inline-flex items-center justify-center gap-1 rounded-[10px] w-10 border border-[var(--surface-border)] bg-surface-sunken text-fg-subtle',
              'hover:bg-[var(--brand-primary)] hover:text-white hover:border-[var(--brand-primary)] hover:shadow-brand transition-all duration-300 focus:outline-none focus-visible:shadow-focus'
            )}
            title={rtl ? 'إعدادات القفل' : 'Lock info'}
          >
            <SettingsIcon sx={{ fontSize: 18 }} />
          </button>
        </div>
      </div>
    </div>
  );
}

function SidebarSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 last:mb-1">
      <div className="mb-2 px-2 text-[0.6875rem] font-semibold tracking-tight text-fg-muted/90">{label}</div>
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  );
}

function SidebarLink({
  item,
  active,
  onClick,
  label,
  rtl,
  ChevronOut,
}: {
  item: NavItem;
  active: boolean;
  onClick: () => void;
  label: string;
  rtl: boolean;
  ChevronOut: React.ComponentType<any>;
}) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative flex w-full min-h-[46px] cursor-pointer items-center gap-3 rounded-2xl px-2.5 mb-1',
        'text-sm transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand',
        'overflow-hidden',
        active
          ? 'bg-[var(--surface-raised)] text-[var(--brand-primary)] font-extrabold shadow-[0_2px_12px_rgba(109,40,217,0.08)] border border-[var(--brand-primary-soft)]'
          : 'text-fg-subtle hover:bg-surface-hover hover:text-fg font-bold border border-transparent'
      )}
    >
      {/* Active BG Glow */}
      {active && (
        <span
          className="absolute inset-0 bg-gradient-to-r from-[var(--brand-primary-soft)] to-transparent opacity-50"
          aria-hidden
        />
      )}
      
      {/* Indicator bar */}
      <span
        className={cn(
          'absolute top-1/2 h-[50%] w-1 -translate-y-1/2 rounded-full transition-all duration-300',
          rtl ? 'end-0' : 'start-0',
          active ? 'bg-[var(--brand-primary)] shadow-[0_0_10px_var(--brand-primary)]' : 'bg-transparent'
        )}
        aria-hidden
      />
      
      <span
        className={cn(
          'relative flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] transition-all duration-300',
          active
            ? 'bg-gradient-to-br from-[var(--brand-primary)] to-[#8b5cf6] text-white shadow-md'
            : 'bg-surface-sunken text-fg-muted group-hover:text-[var(--brand-primary)] group-hover:scale-105 group-hover:-rotate-3'
        )}
      >
        <Icon sx={{ fontSize: active ? 19 : 20 }} className={cn(active && 'animate-pulse-ring rounded-full')} />
      </span>
      <span className="relative min-w-0 flex-1 truncate text-start leading-snug font-arabic tracking-tight">{label}</span>
      {active && <ChevronOut sx={{ fontSize: 18, opacity: 0.9, flexShrink: 0 }} className="relative text-[var(--brand-primary)] transition-transform group-hover:translate-x-1" />}
    </button>
  );
}
