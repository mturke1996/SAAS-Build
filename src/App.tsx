import { useEffect, useMemo } from 'react';
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

// New shells / pages
import { AppShell } from './ui/shells/AppShell';
import { LoginPage } from './ui/pages/LoginPage';
import { HomePage } from './ui/pages/HomePage';
import { BrandingSettingsPage } from './ui/pages/BrandingSettingsPage';
import { LoadingScreen } from './ui/feedback/LoadingScreen';
import { AppLockGuard } from './ui/AppLockGuard';

// Legacy feature pages (preserved fully, themed via MUI bridge)
import { ClientsPage } from './ui/pages-legacy/ClientsPage';
import { ClientProfilePage } from './ui/pages-legacy/ClientProfilePage';
import { InvoicesPage } from './ui/pages-legacy/InvoicesPage';
import { NewInvoicePage } from './ui/pages-legacy/NewInvoicePage';
import { InvoiceDetailsPage } from './ui/pages-legacy/InvoiceDetailsPage';
import { ExpensesPage } from './ui/pages-legacy/ExpensesPage';
import { PaymentsPage } from './ui/pages-legacy/PaymentsPage';
import { DebtsPage } from './ui/pages-legacy/DebtsPage';
import { UsersPage } from './ui/pages-legacy/UsersPage';
import { FundPage } from './ui/pages-legacy/FundPage';
import { LettersPage } from './ui/pages-legacy/LettersPage';

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

      <BrowserRouter>
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
