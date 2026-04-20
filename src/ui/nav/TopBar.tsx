import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { LogoMark } from '../brand/LogoMark';
import { IconButton } from '../../design-system/primitives';
import { Menu as MenuIcon, ArrowBack, ArrowForward } from '@mui/icons-material';
import { MobileDrawer } from './MobileDrawer';
import { PRIMARY_NAV, SECONDARY_NAV, navLabel } from './navItems';
import { useBrand } from '../../config/BrandProvider';

/**
 * Mobile / tablet top bar (< lg).
 *  - Frosted, sticky, auto-respects iOS notch via pwa-safe-top.
 *  - Left: menu (MobileDrawer)
 *  - Right: back if not home
 *  - Center: brand mark (home) / current page title (else)
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
      <header
        className="lg:hidden sticky top-0 z-[100] frosted border-b border-[var(--surface-border)] pwa-safe-top"
      >
        <div className="h-14 px-2 flex items-center gap-1">
          <IconButton size="md" label={rtl ? 'فتح القائمة' : 'Open menu'} onClick={() => setDrawerOpen(true)}>
            <MenuIcon />
          </IconButton>

          {!isHome && (
            <IconButton
              size="md"
              label={rtl ? 'رجوع' : 'Back'}
              onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
            >
              <BackIcon />
            </IconButton>
          )}

          <div className="flex-1 min-w-0 flex items-center justify-center px-2">
            {isHome ? (
              <LogoMark size={28} showName />
            ) : (
              <span className="text-sm font-semibold text-fg truncate">{title}</span>
            )}
          </div>

          {/* balance for centered title */}
          <div className="w-10 h-10 shrink-0" />
        </div>
      </header>

      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
