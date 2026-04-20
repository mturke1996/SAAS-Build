import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { PRIMARY_NAV, navLabel } from './navItems';
import { cn } from '../../design-system/primitives/cn';
import { useAppLockStore } from '../../stores/useAppLockStore';
import { useBrand } from '../../config/BrandProvider';

/**
 * MobileBottomNav (< lg). Frosted, iOS-style.
 * - 5 primary tabs, 44px+ touch targets
 * - Active pill slides between tabs (GSAP)
 * - Safe-area bottom padding for iPhone home indicator
 * - Press micro-interaction (scale)
 */
export function MobileBottomNav() {
  const brand = useBrand();
  const location = useLocation();
  const navigate = useNavigate();
  const { canAccess } = useAppLockStore();
  const container = useRef<HTMLDivElement>(null);

  const items = PRIMARY_NAV.filter((item) => !item.module || canAccess(item.module as any));
  const activeIndex = items.findIndex((item) =>
    item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)
  );

  // Slide the active pill between tabs
  useGSAP(
    () => {
      if (activeIndex < 0 || !container.current) return;
      const pill = container.current.querySelector<HTMLElement>('[data-pill]');
      const btn = container.current.querySelectorAll<HTMLElement>('[data-tab]')[activeIndex];
      if (!pill || !btn) return;
      const c = container.current.getBoundingClientRect();
      const b = btn.getBoundingClientRect();
      gsap.to(pill, {
        x: b.left - c.left + (b.width - 44) / 2,
        duration: 0.32,
        ease: 'power3.out',
      });
    },
    { scope: container, dependencies: [activeIndex, items.length] }
  );

  useEffect(() => {
    // Ensure pill snaps on first paint (before GSAP tween begins)
    requestAnimationFrame(() => {
      const pill = container.current?.querySelector<HTMLElement>('[data-pill]');
      const btn = container.current?.querySelectorAll<HTMLElement>('[data-tab]')[activeIndex];
      if (!pill || !btn || !container.current) return;
      const c = container.current.getBoundingClientRect();
      const b = btn.getBoundingClientRect();
      pill.style.transform = `translateX(${b.left - c.left + (b.width - 44) / 2}px)`;
    });
  }, [items.length, activeIndex]);

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
        ref={container}
        className="relative grid"
        style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}
      >
        {/* Sliding pill behind active tab icon */}
        <div
          data-pill
          aria-hidden
          className="absolute top-1.5 h-11 w-11 rounded-2xl pointer-events-none"
          style={{
            background: 'var(--brand-primary-soft)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5)',
          }}
        />

        {items.map((item, i) => {
          const Icon = item.icon;
          const active = i === activeIndex;
          return (
            <button
              key={item.path}
              data-tab
              onClick={() => navigate(item.path)}
              aria-current={active ? 'page' : undefined}
              aria-label={navLabel(item, brand.direction)}
              className={cn(
                'relative h-[60px] flex flex-col items-center justify-center gap-0.5 pressable cursor-pointer',
                'focus:outline-none focus-visible:shadow-focus transition-colors duration-fast',
                active ? 'text-[color:var(--brand-primary)]' : 'text-fg-muted hover:text-fg'
              )}
            >
              <Icon sx={{ fontSize: active ? 22 : 20, transition: 'font-size .18s ease' }} />
              <span className={cn('text-2xs leading-tight', active ? 'font-bold' : 'font-medium')}>
                {navLabel(item, brand.direction)}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
