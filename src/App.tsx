import { useEffect, useMemo, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

import { BrandProvider, useBrand } from './config/BrandProvider';
import { useBrandStore } from './stores/useBrandStore';
import { useThemeStore } from './stores/useThemeStore';
import { useAuthStore } from './stores/useAuthStore';
import { useDataStore } from './stores/useDataStore';
import { useAppLockStore } from './stores/useAppLockStore';
import { createMuiBridge } from './design-system/theme/createMuiBridge';

// Eager shells + critical paths
import { AppShell } from './ui/shells/AppShell';
import { LoginPage } from './ui/pages/LoginPage';
import { HomePage } from './ui/pages/HomePage';
import { LoadingScreen } from './ui/feedback/LoadingScreen';
import { AppLockGuard } from './ui/AppLockGuard';

// Lazy: settings + feature pages (code-split; only loaded when visited)
const BrandingSettingsPage   = lazy(() => import('./ui/pages/BrandingSettingsPage').then(m => ({ default: m.BrandingSettingsPage })));
const ClientsPage            = lazy(() => import('./ui/pages-legacy/ClientsPage').then(m => ({ default: m.ClientsPage })));
const ClientProfilePage      = lazy(() => import('./ui/pages-legacy/ClientProfilePage').then(m => ({ default: m.ClientProfilePage })));
const InvoicesPage           = lazy(() => import('./ui/pages-legacy/InvoicesPage').then(m => ({ default: m.InvoicesPage })));
const NewInvoicePage         = lazy(() => import('./ui/pages-legacy/NewInvoicePage').then(m => ({ default: m.NewInvoicePage })));
const InvoiceDetailsPage     = lazy(() => import('./ui/pages-legacy/InvoiceDetailsPage').then(m => ({ default: m.InvoiceDetailsPage })));
const ExpensesPage           = lazy(() => import('./ui/pages-legacy/ExpensesPage').then(m => ({ default: m.ExpensesPage })));
const PaymentsPage           = lazy(() => import('./ui/pages-legacy/PaymentsPage').then(m => ({ default: m.PaymentsPage })));
const DebtsPage              = lazy(() => import('./ui/pages-legacy/DebtsPage').then(m => ({ default: m.DebtsPage })));
const UsersPage              = lazy(() => import('./ui/pages-legacy/UsersPage').then(m => ({ default: m.UsersPage })));
const FundPage               = lazy(() => import('./ui/pages-legacy/FundPage').then(m => ({ default: m.FundPage })));
const LettersPage            = lazy(() => import('./ui/pages-legacy/LettersPage').then(m => ({ default: m.LettersPage })));

// Register @gsap/react plugin once — enables useGSAP hook everywhere
gsap.registerPlugin(useGSAP);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function AppContent() {
  const brand = useBrand();
  const { mode } = useThemeStore();
  const { checkAuth, isAuthenticated, isLoading } = useAuthStore();
  const { initialize } = useDataStore();

  // Rebuild MUI theme when brand or mode changes
  const theme = useMemo(() => createMuiBridge(brand, mode), [brand, mode]);

  useEffect(() => {
    const unsub = checkAuth();
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [checkAuth]);

  useEffect(() => {
    if (isAuthenticated) {
      const unsubscribeData = initialize();
      const unsubscribeLock = useAppLockStore.getState().initAppLockSync();
      return () => {
        unsubscribeData?.();
        unsubscribeLock?.();
      };
    }
  }, [isAuthenticated, initialize]);

  if (isLoading) return <LoadingScreen />;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Toaster
        position="top-center"
        gutter={8}
        toastOptions={{
          duration: 3000,
          style: {
            fontSize: '0.8125rem',
            fontWeight: 600,
            borderRadius: '12px',
            padding: '10px 14px',
            boxShadow: 'var(--shadow-lg)',
            background: 'var(--surface-panel)',
            color: 'var(--text-primary)',
            border: '1px solid var(--surface-border)',
            maxWidth: '90vw',
          },
          success: {
            iconTheme: { primary: 'var(--brand-success)' as any, secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: 'var(--brand-danger)' as any, secondary: '#fff' },
          },
        }}
      />

      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route
              path="/login"
              element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" replace />}
            />

            <Route element={isAuthenticated ? <AppShell /> : <Navigate to="/login" replace />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/settings/branding" element={<BrandingSettingsPage />} />

              <Route path="/clients" element={<AppLockGuard module="clients" requireScreen><ClientsPage /></AppLockGuard>} />
              <Route path="/clients/:id" element={<AppLockGuard module="clients" requireScreen><ClientProfilePage /></AppLockGuard>} />

              <Route path="/invoices" element={<AppLockGuard module="invoices" requireScreen><InvoicesPage /></AppLockGuard>} />
              <Route path="/invoices/new" element={<AppLockGuard module="invoices" requireScreen><NewInvoicePage /></AppLockGuard>} />
              <Route path="/invoices/:id" element={<AppLockGuard module="invoices" requireScreen><InvoiceDetailsPage /></AppLockGuard>} />

              <Route path="/expenses" element={<AppLockGuard module="expenses" requireScreen><ExpensesPage /></AppLockGuard>} />
              <Route path="/payments" element={<AppLockGuard module="payments" requireScreen><PaymentsPage /></AppLockGuard>} />
              <Route path="/debts" element={<AppLockGuard module="debts" requireScreen><DebtsPage /></AppLockGuard>} />
              <Route path="/users" element={<AppLockGuard module="users" requireScreen><UsersPage /></AppLockGuard>} />
              <Route path="/fund" element={<AppLockGuard module="balances" requireScreen><FundPage /></AppLockGuard>} />
              <Route path="/letters" element={<AppLockGuard module="letters" requireScreen><LettersPage /></AppLockGuard>} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default function App() {
  useBrandStore.getState();
  return (
    <QueryClientProvider client={queryClient}>
      <BrandProvider>
        <AppContent />
      </BrandProvider>
    </QueryClientProvider>
  );
}
