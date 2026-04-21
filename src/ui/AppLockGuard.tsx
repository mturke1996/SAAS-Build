import { FormEvent, ReactNode, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from '@mui/icons-material';
import { useAppLockStore, AppModule } from '../store/useAppLockStore';
import { Button, Input } from '../design-system/primitives';
import { cn } from '../design-system/primitives/cn';

interface Props {
  module: AppModule;
  children: ReactNode;
  fallback?: ReactNode;
  requireScreen?: boolean;
}

const MODULE_AR: Partial<Record<AppModule, string>> = {
  stats: 'الإحصائيات',
  clients: 'العملاء',
  invoices: 'الفواتير',
  payments: 'المدفوعات',
  debts: 'الديون',
  expenses: 'المصروفات',
  users: 'المستخدمين',
  workers: 'العمال',
  balances: 'صندوق العهد',
  letters: 'الرسائل',
};

/**
 * Full-screen PIN gate for protected routes — brand-aligned (violet / glass), iOS safe-area friendly.
 */
export const AppLockGuard = ({ module, children, fallback = null, requireScreen = false }: Props) => {
  const { canAccess, unlockSession } = useAppLockStore();
  const navigate = useNavigate();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  if (canAccess(module)) {
    return <>{children}</>;
  }

  if (!requireScreen) {
    return <>{fallback}</>;
  }

  const handleUnlock = (e?: FormEvent) => {
    e?.preventDefault();
    if (unlockSession(pin)) {
      setError(false);
      setPin('');
    } else {
      setError(true);
      setPin('');
    }
  };

  const label = MODULE_AR[module] ?? 'هذا القسم';

  return (
    <div
      className={cn(
        'fixed inset-0 z-[9998] flex flex-col items-center justify-center p-4',
        'grain text-white pwa-safe-top pwa-safe-bottom'
      )}
      style={{
        background: 'linear-gradient(145deg, #1B0F3B 0%, #4C1D95 48%, #0f0c1a 100%)',
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 end-0 h-72 w-72 rounded-full blur-3xl opacity-50"
        style={{ background: 'radial-gradient(closest-side, #8B5CF6, transparent)' }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-20 start-0 h-64 w-64 rounded-full blur-3xl opacity-40"
        style={{ background: 'radial-gradient(closest-side, #F59E0B, transparent)' }}
      />

      <form
        onSubmit={handleUnlock}
        className="relative w-full max-w-[400px] rounded-2xl border border-white/15 bg-white/[0.08] p-6 shadow-xl backdrop-blur-md sm:p-8"
      >
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
          <Lock sx={{ fontSize: 34, color: '#fff' }} />
        </div>
        <h1 className="text-center text-xl font-extrabold tracking-tight text-white sm:text-2xl">قفل التطبيق</h1>
        <p className="mt-1.5 text-center text-sm text-white/75">
          القسم: <span className="font-bold text-white">{label}</span>
        </p>
        <p className="mt-2 text-center text-2xs text-white/60 leading-relaxed">
          أدخل رمز القفل المعتمَد في الإعدادات → قسم الحماية.
        </p>

        <div className="mt-6 space-y-2">
          <Input
            type="password"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="••••••"
            value={pin}
            invalid={error}
            onChange={(e) => {
              setPin(e.target.value);
              setError(false);
            }}
          />
          {error && <p className="text-center text-2xs font-semibold text-red-300">الرمز غير صحيح</p>}
        </div>

        <div className="mt-5 flex flex-col gap-2">
          <Button type="submit" block size="lg" className="btn-primary-glow">
            فتح القفل
          </Button>
          <Button type="button" variant="outline" block onClick={() => navigate('/')} className="border-white/25 text-white hover:bg-white/10">
            الرئيسية
          </Button>
          <button
            type="button"
            onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
            className="text-center text-2xs font-semibold text-white/55 hover:text-white/85 transition-colors py-2"
          >
            رجوع
          </button>
        </div>
      </form>
    </div>
  );
};
