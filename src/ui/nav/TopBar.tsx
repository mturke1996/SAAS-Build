import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { LogoMark } from '../brand/LogoMark';
import { IconButton } from '../../design-system/primitives';
import { Menu as MenuIcon, ArrowBack, ArrowForward } from '@mui/icons-material';
import { MobileDrawer } from './MobileDrawer';
import { PRIMARY_NAV, SECONDARY_NAV, navLabel } from './navItems';
import { useBrand } from '../../config/BrandProvider';

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
      <header className="lg:hidden sticky top-0 z-[100] frosted border-b border-[var(--surface-border)] pwa-safe-top">
        <div className="h-14 px-3 flex items-center gap-2">
          {/* Menu button */}
          <IconButton
            size="md"
            label={rtl ? 'فتح القائمة' : 'Open menu'}
            onClick={() => setDrawerOpen(true)}
            className="bg-surface-sunken hover:bg-surface-hover"
          >
            <MenuIcon sx={{ fontSize: 22 }} />
          </IconButton>

          {/* Back button (non-home pages) */}
          {!isHome && (
            <IconButton
              size="md"
              label={rtl ? 'رجوع' : 'Back'}
              onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
              className="bg-surface-sunken hover:bg-surface-hover"
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
              <span className="text-sm font-extrabold text-fg truncate font-arabic">{title}</span>
            )}
          </div>

          {/* Balance spacer */}
          <div className={`shrink-0 ${!isHome ? 'w-10 h-10' : 'w-10 h-10'}`} />
        </div>
      </header>

      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
