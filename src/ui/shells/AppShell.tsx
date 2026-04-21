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
    <div className="app-shell-root">
      <Sidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <TopBar />
        {/*
          Mobile: page scroll is usually window/body; pb clears the fixed tab bar + home indicator.
          lg+: .app-shell-main gets overflow-y auto + min-height 0 so iOS PWA sidebar split scrolls correctly.
        */}
        <main className="app-shell-main flex-1 pb-[calc(76px+env(safe-area-inset-bottom))] lg:pb-0">
          <Outlet />
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
