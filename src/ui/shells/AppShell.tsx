import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Sidebar } from '../nav/Sidebar';
import { TopBar } from '../nav/TopBar';
import { MobileBottomNav } from '../nav/MobileBottomNav';

/**
 * AppShell — authenticated layout.
 *
 *  lg+ : sidebar + content (no top/bottom bars)
 *  <lg : top bar + content + bottom nav (both frosted, sticky)
 *
 *  Scroll resets to top on every route change.
 */
export function AppShell() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="min-h-[100dvh] bg-surface-canvas flex">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar />
        {/* pb accounts for the fixed mobile bottom nav (only on <lg) */}
        <main className="flex-1 pb-[calc(76px+env(safe-area-inset-bottom))] lg:pb-0">
          <Outlet />
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
