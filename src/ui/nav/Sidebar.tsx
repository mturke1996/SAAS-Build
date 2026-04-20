import { useLocation, useNavigate } from 'react-router-dom';
import { LogoMark } from '../brand/LogoMark';
import { cn } from '../../design-system/primitives/cn';
import { PRIMARY_NAV, SECONDARY_NAV, NavItem, navLabel } from './navItems';
import { useAppLockStore } from '../../stores/useAppLockStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { useThemeStore } from '../../stores/useThemeStore';
import { useBrand } from '../../config/BrandProvider';
import { IconButton } from '../../design-system/primitives';
import { Brightness4, Brightness7, Logout, ChevronLeft, ChevronRight } from '@mui/icons-material';

/**
 * Desktop sidebar (lg+). 260px rail. Minimal, content-first, ChatGPT-grade.
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

  const visible = (item: NavItem) => !item.module || canAccess(item.module as any);
  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className="hidden lg:flex lg:flex-col h-screen w-[260px] shrink-0 border-[var(--surface-border)] bg-surface-panel sticky top-0 rtl:border-l ltr:border-r">
      {/* Brand */}
      <div className="h-14 flex items-center px-4 border-b border-[var(--surface-border)]">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition-opacity duration-fast"
          aria-label="Home"
        >
          <LogoMark size={30} showName />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2" aria-label={rtl ? 'القائمة الرئيسية' : 'Main'}>
        <SidebarSection label={rtl ? 'مساحة العمل' : 'Workspace'}>
          {PRIMARY_NAV.filter(visible).map((item) => (
            <SidebarLink
              key={item.path}
              item={item}
              active={isActive(item.path)}
              onClick={() => navigate(item.path)}
              label={navLabel(item, brand.direction)}
              ChevronOut={ChevronOut}
            />
          ))}
        </SidebarSection>

        <SidebarSection label={rtl ? 'أقسام أخرى' : 'More'}>
          {SECONDARY_NAV.filter(visible).map((item) => (
            <SidebarLink
              key={item.path}
              item={item}
              active={isActive(item.path)}
              onClick={() => navigate(item.path)}
              label={navLabel(item, brand.direction)}
              ChevronOut={ChevronOut}
            />
          ))}
        </SidebarSection>
      </nav>

      {/* User footer */}
      <div className="border-t border-[var(--surface-border)] p-3 flex items-center gap-2">
        <div
          className="h-9 w-9 rounded-full bg-[color:var(--brand-primary-soft)] text-[color:var(--brand-primary)] flex items-center justify-center font-semibold text-sm shrink-0"
          aria-hidden
        >
          {user?.displayName?.charAt(0)?.toUpperCase() || 'U'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-fg truncate">{user?.displayName || (rtl ? 'المستخدم' : 'User')}</div>
          <div className="text-2xs text-fg-muted truncate">{user?.email}</div>
        </div>
        <IconButton size="sm" label={rtl ? 'تبديل السمة' : 'Toggle theme'} onClick={toggleTheme}>
          {mode === 'dark' ? <Brightness7 fontSize="small" /> : <Brightness4 fontSize="small" />}
        </IconButton>
        <IconButton size="sm" label={rtl ? 'تسجيل الخروج' : 'Sign out'} onClick={handleLogout}>
          <Logout fontSize="small" />
        </IconButton>
      </div>
    </aside>
  );
}

function SidebarSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <div className="px-2 mb-1.5 text-2xs font-semibold uppercase tracking-wider text-fg-muted">
        {label}
      </div>
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  );
}

function SidebarLink({
  item,
  active,
  onClick,
  label,
  ChevronOut,
}: {
  item: NavItem;
  active: boolean;
  onClick: () => void;
  label: string;
  ChevronOut: React.ComponentType<any>;
}) {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative w-full flex items-center gap-2.5 h-10 px-2.5 rounded-md cursor-pointer',
        'text-sm font-medium transition-all duration-fast ease-standard',
        'focus:outline-none focus-visible:shadow-focus',
        active
          ? 'bg-[color:var(--brand-primary-soft)] text-[color:var(--brand-primary)] font-semibold'
          : 'text-fg-subtle hover:text-fg hover:bg-surface-sunken'
      )}
    >
      <Icon sx={{ fontSize: 18 }} />
      <span className="flex-1 truncate text-start">{label}</span>
      {active && <ChevronOut sx={{ fontSize: 16, opacity: 0.7 }} />}
    </button>
  );
}
