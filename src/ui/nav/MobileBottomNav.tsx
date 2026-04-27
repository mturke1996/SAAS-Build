import { useLocation, useNavigate } from 'react-router-dom';
import { PRIMARY_NAV, navLabel } from './navItems';
import { cn } from '../../design-system/primitives/cn';
import { useAppLockStore } from '../../stores/useAppLockStore';
import { useBrand } from '../../config/BrandProvider';

/**
 * MobileBottomNav — Stitch-style: active item = solid navy block + white label/icon.
 * Safe area for iPhone home indicator.
 */
export function MobileBottomNav() {
  const brand = useBrand();
  const location = useLocation();
  const navigate = useNavigate();
  const { canAccess } = useAppLockStore();

  const items = PRIMARY_NAV.filter((item) => !item.module || canAccess(item.module as any));
  const activeIndex = items.findIndex((item) =>
    item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)
  );

  return (
    <nav
      aria-label={brand.direction === 'rtl' ? 'التنقل الرئيسي' : 'Primary'}
      className={cn(
        'lg:hidden fixed bottom-0 left-0 right-0 z-[1000]',
        'frosted-strong border-t border-[var(--surface-border)]',
        'pb-[max(4px,env(safe-area-inset-bottom))]'
      )}
    >
      <div
        className="grid px-1.5 pt-1.5"
        style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}
      >
        {items.map((item, i) => {
          const Icon = item.icon;
          const active = i === activeIndex;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              aria-current={active ? 'page' : undefined}
              aria-label={navLabel(item, brand.direction)}
              className={cn(
                'relative min-h-[56px] flex flex-col items-center justify-center gap-0.5 cursor-pointer',
                'focus:outline-none focus-visible:shadow-focus',
                'transition-[background-color,color,transform,box-shadow] duration-[220ms] ease-[cubic-bezier(0.23,1,0.32,1)]',
                'active:scale-[0.95] active:transition-[transform] active:duration-[120ms]',
                'rounded-2xl mb-1 mx-0.5',
                active
                  ? 'text-white bg-[color:var(--brand-primary)] shadow-[0_4px_12px_-2px_rgba(26,43,88,0.35),inset_0_1px_0_rgba(255,255,255,0.12)]'
                  : 'text-fg-muted hover:text-fg hover:bg-surface-sunken/80'
              )}
            >
              <Icon sx={{ fontSize: active ? 22 : 20, transition: 'font-size .18s ease-out' }} />
              <span
                className={cn('text-2xs leading-tight uppercase tracking-wide max-w-full truncate px-0.5', active ? 'font-extrabold' : 'font-semibold')}
              >
                {navLabel(item, brand.direction)}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
