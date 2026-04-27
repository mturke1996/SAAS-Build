import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { LogoMark } from '../brand/LogoMark';
import { IconButton } from '../../design-system/primitives';
import { Menu as MenuIcon, ArrowBack, ArrowForward, Search } from '@mui/icons-material';
import { MobileDrawer } from './MobileDrawer';
import { PRIMARY_NAV, SECONDARY_NAV, navLabel } from './navItems';
import { useBrand } from '../../config/BrandProvider';
import { NotificationBell } from '../notifications/NotificationBell';

/**
 * TopBar — Premium mobile header with centered logo/title.
 * Frosted glass, notch-safe, minimal & elegant.
 */
export function TopBar() {
  const brand = useBrand();
  const rtl = brand.direction === 'rtl';
  const location = useLocation();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isHome = location.pathname === '/';

  const currentLabel =
    [...PRIMARY_NAV, ...SECONDARY_NAV].find((item) =>
      item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)
    );
  const title = currentLabel ? navLabel(currentLabel, brand.direction) : brand.name;

  const BackIcon = rtl ? ArrowForward : ArrowBack;

  return (
    <>
      <header className="lg:hidden sticky top-0 z-[100] bg-surface-panel/75 supports-[backdrop-filter]:bg-surface-panel/60 backdrop-blur-xl border-b border-[color-mix(in_srgb,var(--surface-border)_60%,transparent)] pwa-safe-top transition-colors duration-300">
        <div className="h-14 px-3 flex items-center gap-2">
          {/* Menu button */}
          <IconButton
            size="md"
            label={rtl ? 'فتح القائمة' : 'Open menu'}
            onClick={() => setDrawerOpen(true)}
            className="bg-surface-sunken/50 hover:bg-surface-hover transition-colors duration-200"
          >
            <MenuIcon sx={{ fontSize: 22 }} />
          </IconButton>

          {/* Back button (non-home pages) */}
          {!isHome && (
            <IconButton
              size="md"
              label={rtl ? 'رجوع' : 'Back'}
              onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
              className="bg-surface-sunken/50 hover:bg-surface-hover transition-colors duration-200"
            >
              <BackIcon sx={{ fontSize: 20 }} />
            </IconButton>
          )}

          {/* Centered brand or page title */}
          <div className="flex-1 min-w-0 flex items-center justify-center px-2">
            {isHome ? (
              <div className="flex items-center gap-2">
                <LogoMark size={28} showName />
              </div>
            ) : (
              <span className="text-[0.9375rem] font-extrabold text-fg truncate tracking-tight font-arabic drop-shadow-sm">{title}</span>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <NotificationBell />
            {isHome ? (
              <IconButton
                size="md"
                label={rtl ? 'بحث في العملاء' : 'Search clients'}
                onClick={() => navigate('/clients')}
                className="bg-surface-sunken/50 hover:bg-surface-hover transition-colors duration-200"
              >
                <Search sx={{ fontSize: 22 }} />
              </IconButton>
            ) : (
              <div className="w-10 h-10" aria-hidden />
            )}
          </div>
        </div>
      </header>

      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
