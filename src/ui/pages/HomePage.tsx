import { useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import {
  TrendingUp,
  TrendingDown,
  People,
  Receipt,
  Payments as PaymentsIcon,
  AccountBalance,
  Description,
  ReceiptLong,
  Savings,
  ManageAccounts,
  Settings,
  ArrowForward,
  ArrowBack,
  AddCircleOutline,
  Brightness4,
  Brightness7,
  Bolt,
} from '@mui/icons-material';
import { useBrand } from '../../config/BrandProvider';
import { useAuthStore } from '../../stores/useAuthStore';
import { useDataStore } from '../../stores/useDataStore';
import { useAppLockStore } from '../../stores/useAppLockStore';
import { useThemeStore } from '../../stores/useThemeStore';
import { useGlobalFundStore } from '../../stores/useGlobalFundStore';
import { formatCurrency } from '../../core/utils-formatters';
import { countUp } from '../../core/motion/presets';
import { useSmartNav } from '../../core/agent/useSmartNav';
import { Button, IconButton } from '../../design-system/primitives';
import { cn } from '../../design-system/primitives/cn';

/**
 * HomePage — "Dimensional Layering" dashboard.
 *
 *  Hero greeting card with brand gradient + grain.
 *  Float-card KPIs with subtle gradients + GSAP count-up.
 *  Touch-friendly module grid (2-col mobile, 3-col desktop).
 *  Smart-nav "jump back in" chips.
 *
 *  Motion via @gsap/react — auto-cleaned.
 */
export function HomePage() {
  const navigate = useNavigate();
  const brand = useBrand();
  const rtl = brand.direction === 'rtl';
  const { user } = useAuthStore();
  const { payments, clients, expenses, invoices } = useDataStore();
  const { canAccess } = useAppLockStore();
  const { mode, toggleTheme } = useThemeStore();
  const { frequent } = useSmartNav();
  const { getCurrentBalance } = useGlobalFundStore();

  const container = useRef<HTMLDivElement>(null);
  const kpiRefs = useRef<(HTMLSpanElement | null)[]>([]);

  // Memoized stats
  const stats = useMemo(() => {
    const collected = payments.reduce((s, p) => s + p.amount, 0);
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    return {
      collected,
      totalExpenses,
      net: collected - totalExpenses,
      clients: clients.length,
      invoices: invoices.length,
      unpaidInvoices: invoices.filter((i) => i.status !== 'paid' && i.status !== 'cancelled').length,
      fund: getCurrentBalance(),
    };
  }, [payments, clients, expenses, invoices, getCurrentBalance]);

  // GSAP intro + count-up
  useGSAP(
    () => {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!reduced) {
        gsap.from('[data-reveal]', {
          autoAlpha: 0,
          y: 10,
          duration: 0.3,
          ease: 'power2.out',
          stagger: 0.05,
          delay: 0.05,
        });
      }
      // Count-up (runs whether reduced or not — just faster if reduced)
      const vals = [stats.collected, stats.totalExpenses, stats.net, stats.clients];
      vals.forEach((v, i) => {
        const el = kpiRefs.current[i];
        if (!el) return;
        const isCurrency = i < 3;
        countUp(el, v, {
          duration: reduced ? 0.01 : 0.9,
          format: (n) => (isCurrency ? formatCurrency(n) : String(Math.round(n))),
        });
      });
    },
    { scope: container, dependencies: [stats.collected, stats.totalExpenses, stats.net, stats.clients] }
  );

  const greeting = getGreeting(rtl);
  const displayName = user?.displayName?.split(' ')[0] || (rtl ? 'بك' : 'there');
  const ChevronRow = rtl ? ArrowBack : ArrowForward;

  type Tone = 'brand' | 'success' | 'warning' | 'danger' | 'info';
  type ModuleDef = {
    label: string;
    sub: string;
    path: string;
    Icon: any;
    module: string | null;
    tone?: Tone;
  };
  const invoicesTone: Tone = stats.unpaidInvoices > 0 ? 'warning' : 'brand';
  const allModules: ModuleDef[] = [
    { label: rtl ? 'العملاء' : 'Clients', sub: `${stats.clients} ${rtl ? 'عميل' : 'total'}`, path: '/clients', Icon: People, module: 'clients' },
    { label: rtl ? 'الفواتير' : 'Invoices', sub: stats.unpaidInvoices > 0 ? (rtl ? `${stats.unpaidInvoices} غير مدفوعة` : `${stats.unpaidInvoices} unpaid`) : (rtl ? 'كل الفواتير' : 'All'), path: '/invoices', Icon: Receipt, module: 'invoices', tone: invoicesTone },
    { label: rtl ? 'المدفوعات' : 'Payments', sub: rtl ? 'التحصيلات' : 'Collections', path: '/payments', Icon: PaymentsIcon, module: 'payments', tone: 'success' },
    { label: rtl ? 'العهدات' : 'Fund', sub: formatCurrency(stats.fund), path: '/fund', Icon: AccountBalance, module: 'balances', tone: 'brand' },
    { label: rtl ? 'المصروفات' : 'Expenses', sub: rtl ? 'تتبع التكاليف' : 'Cost tracking', path: '/expenses', Icon: ReceiptLong, module: 'expenses', tone: 'danger' },
    { label: rtl ? 'الديون' : 'Debts', sub: rtl ? 'إدارة الديون' : 'Receivables', path: '/debts', Icon: Savings, module: 'debts', tone: 'warning' },
    { label: rtl ? 'الرسائل' : 'Letters', sub: rtl ? 'خطابات رسمية' : 'Official docs', path: '/letters', Icon: Description, module: 'letters', tone: 'info' },
    { label: rtl ? 'المستخدمين' : 'Users', sub: rtl ? 'إدارة الحسابات' : 'Accounts', path: '/users', Icon: ManageAccounts, module: 'users' },
  ];
  const modules = allModules.filter((m) => !m.module || canAccess(m.module as any));

  return (
    <div ref={container} className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-4 pb-8 lg:pt-8 lg:pb-14 space-y-5 lg:space-y-7">
      {/* ═══ Hero greeting card — brand gradient + grain ═══ */}
      <section
        data-reveal
        className="relative overflow-hidden rounded-2xl grain text-white"
        style={{
          background: 'linear-gradient(135deg, #1B0F3B 0%, #4C1D95 45%, #6D28D9 100%)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        {/* decorative blobs */}
        <div
          aria-hidden
          className="absolute -top-16 -right-12 w-[220px] h-[220px] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(closest-side, #F59E0B 0%, transparent 70%)', opacity: 0.35 }}
        />
        <div
          aria-hidden
          className="absolute -bottom-12 -left-8 w-[200px] h-[200px] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(closest-side, #8B5CF6, transparent)', opacity: 0.4 }}
        />

        <div className="relative flex items-start justify-between gap-4 p-5 sm:p-7">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1 h-6 px-2 rounded-full bg-white/15 backdrop-blur text-white/90 text-2xs font-semibold border border-white/15">
                <Bolt sx={{ fontSize: 12, color: '#FBBF24' }} />
                {greeting}
              </span>
            </div>
            <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight leading-tight">
              {rtl ? `أهلاً ${displayName}` : `Welcome, ${displayName}`}
            </h1>
            <p className="text-white/75 text-sm mt-1.5">
              {rtl ? `نظرة عامة على ${brand.name} اليوم.` : `Here's your ${brand.name} overview today.`}
            </p>
          </div>

          {/* Quick actions */}
          <div className="flex items-center gap-1 shrink-0">
            {brand.features?.enableDarkMode && (
              <button
                onClick={toggleTheme}
                aria-label={rtl ? 'تبديل السمة' : 'Toggle theme'}
                className="h-10 w-10 flex items-center justify-center rounded-md bg-white/12 hover:bg-white/20 text-white/90 backdrop-blur border border-white/15 transition-colors duration-fast pressable cursor-pointer"
              >
                {mode === 'dark' ? <Brightness7 fontSize="small" /> : <Brightness4 fontSize="small" />}
              </button>
            )}
            <button
              onClick={() => navigate('/settings/branding')}
              aria-label={rtl ? 'الإعدادات' : 'Settings'}
              className="h-10 w-10 flex items-center justify-center rounded-md bg-white/12 hover:bg-white/20 text-white/90 backdrop-blur border border-white/15 transition-colors duration-fast pressable cursor-pointer"
            >
              <Settings fontSize="small" />
            </button>
          </div>
        </div>
      </section>

      {/* ═══ KPIs (Dimensional Layering) ═══ */}
      {canAccess('stats') && (
        <section
          data-reveal
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4"
          aria-label={rtl ? 'الإحصائيات' : 'Key metrics'}
        >
          <KpiTile
            label={rtl ? 'المحصّل' : 'Collected'}
            valueRef={(el) => (kpiRefs.current[0] = el)}
            initial={formatCurrency(0)}
            tone="success"
            Icon={TrendingUp}
          />
          <KpiTile
            label={rtl ? 'المصروفات' : 'Expenses'}
            valueRef={(el) => (kpiRefs.current[1] = el)}
            initial={formatCurrency(0)}
            tone="danger"
            Icon={TrendingDown}
          />
          <KpiTile
            label={rtl ? 'الصافي' : 'Net'}
            valueRef={(el) => (kpiRefs.current[2] = el)}
            initial={formatCurrency(0)}
            tone={stats.net >= 0 ? 'brand' : 'danger'}
            Icon={TrendingUp}
          />
          <KpiTile
            label={rtl ? 'العملاء' : 'Clients'}
            valueRef={(el) => (kpiRefs.current[3] = el)}
            initial="0"
            tone="neutral"
            Icon={People}
          />
        </section>
      )}

      {/* ═══ Primary CTA ═══ */}
      {canAccess('invoices') && (
        <section data-reveal>
          <Button
            size="lg"
            block
            onClick={() => navigate('/invoices/new')}
            leftIcon={<AddCircleOutline sx={{ fontSize: 20 }} />}
            className="btn-primary-glow sm:!max-w-xs"
          >
            {rtl ? 'إنشاء فاتورة جديدة' : 'Create new invoice'}
          </Button>
        </section>
      )}

      {/* ═══ Smart-nav chips ═══ */}
      {frequent.length > 0 && (
        <section data-reveal className="space-y-3">
          <h2 className="text-sm font-semibold text-fg">{rtl ? 'زُرت مؤخراً' : 'Jump back in'}</h2>
          <div className="flex flex-wrap gap-2">
            {frequent.map((f) => (
              <button
                key={f.path}
                onClick={() => navigate(f.path)}
                className={cn(
                  'h-9 px-3 rounded-full border border-border bg-surface-panel',
                  'text-xs font-medium text-fg-subtle hover:text-fg hover:border-strong',
                  'transition-all duration-fast pressable cursor-pointer',
                  'focus:outline-none focus-visible:shadow-focus'
                )}
              >
                {prettifyPath(f.path, rtl)}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ═══ Module grid ═══ */}
      <section data-reveal className="space-y-3">
        <h2 className="text-sm font-semibold text-fg">{rtl ? 'الأقسام' : 'Workspace'}</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {modules.map((m) => (
            <ModuleTile
              key={m.path}
              label={m.label}
              sub={m.sub}
              Icon={m.Icon}
              tone={m.tone}
              onClick={() => navigate(m.path)}
              ChevronRow={ChevronRow}
            />
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer data-reveal className="pt-4 text-center">
        <p className="text-2xs text-fg-muted">
          {brand.fullName} © {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// KPI Tile — layered depth with subtle brand-tinted gradient
// ────────────────────────────────────────────────────────────────────────────

interface KpiTileProps {
  label: string;
  valueRef: (el: HTMLSpanElement | null) => void;
  initial: string;
  tone: 'brand' | 'success' | 'danger' | 'neutral';
  Icon: any;
}

function KpiTile({ label, valueRef, initial, tone, Icon }: KpiTileProps) {
  const toneColor =
    tone === 'success' ? 'var(--brand-success)' :
    tone === 'danger'  ? 'var(--brand-danger)' :
    tone === 'brand'   ? 'var(--brand-primary)' :
                         'var(--text-primary)';
  const toneBg =
    tone === 'success' ? 'color-mix(in srgb, var(--brand-success) 10%, transparent)' :
    tone === 'danger'  ? 'color-mix(in srgb, var(--brand-danger) 10%, transparent)' :
    tone === 'brand'   ? 'var(--brand-primary-soft)' :
                         'var(--surface-sunken)';

  return (
    <div
      className="relative bg-surface-panel border border-border rounded-xl p-3 lg:p-4 shadow-xs hover:shadow-sm transition-all duration-base overflow-hidden"
      style={{
        backgroundImage: `radial-gradient(140% 70% at 100% 0%, ${toneBg} 0%, transparent 60%)`,
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xs uppercase tracking-wider text-fg-muted font-bold truncate">
          {label}
        </span>
        <span
          className="h-7 w-7 rounded-md flex items-center justify-center shrink-0"
          style={{ background: toneBg, color: toneColor }}
          aria-hidden
        >
          <Icon sx={{ fontSize: 14 }} />
        </span>
      </div>
      <span
        ref={valueRef}
        className="block text-lg lg:text-2xl font-extrabold tabular font-num tracking-tight truncate"
        style={{ color: toneColor }}
      >
        {initial}
      </span>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Module Tile — tactile card with brand-tinted icon badge
// ────────────────────────────────────────────────────────────────────────────

interface ModuleTileProps {
  label: string;
  sub: string;
  Icon: any;
  tone?: 'brand' | 'success' | 'warning' | 'danger' | 'info';
  onClick: () => void;
  ChevronRow: any;
}

function ModuleTile({ label, sub, Icon, tone, onClick, ChevronRow }: ModuleTileProps) {
  const toneColor =
    tone === 'success' ? 'var(--brand-success)' :
    tone === 'warning' ? 'var(--brand-warning)' :
    tone === 'danger'  ? 'var(--brand-danger)' :
    tone === 'info'    ? 'var(--brand-info)' :
                         'var(--brand-primary)';
  const toneBg = `color-mix(in srgb, ${toneColor} 14%, transparent)`;

  return (
    <button
      onClick={onClick}
      className={cn(
        'group text-start bg-surface-panel border border-border rounded-xl p-3 lg:p-4',
        'shadow-xs hover:shadow-md hover:border-strong transition-all duration-base',
        'cursor-pointer pressable focus:outline-none focus-visible:shadow-focus',
        'min-h-[100px] lg:min-h-[110px]'
      )}
    >
      <div className="flex items-start justify-between gap-2 h-full">
        <div className="flex-1 min-w-0">
          <span
            className="inline-flex h-10 w-10 rounded-lg items-center justify-center mb-2.5"
            style={{ background: toneBg, color: toneColor }}
            aria-hidden
          >
            <Icon sx={{ fontSize: 20 }} />
          </span>
          <div className="text-[0.9375rem] font-bold text-fg leading-snug truncate">{label}</div>
          <div className="text-2xs text-fg-muted mt-0.5 truncate">{sub}</div>
        </div>
        <ChevronRow
          sx={{ fontSize: 16 }}
          className="text-fg-muted group-hover:text-[color:var(--brand-primary)] transition-colors mt-1 shrink-0"
        />
      </div>
    </button>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

function getGreeting(rtl: boolean): string {
  const h = new Date().getHours();
  if (rtl) {
    if (h < 5) return 'ساعة متأخرة';
    if (h < 12) return 'صباح الخير';
    if (h < 17) return 'مساء الخير';
    if (h < 22) return 'مساء الخير';
    return 'ليلة هادئة';
  }
  if (h < 5) return 'Late night';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 22) return 'Good evening';
  return 'Night owl';
}

function prettifyPath(path: string, rtl: boolean): string {
  if (path === '/') return rtl ? 'الرئيسية' : 'Dashboard';
  const map: Record<string, [string, string]> = {
    '/clients': ['Clients', 'العملاء'],
    '/invoices': ['Invoices', 'الفواتير'],
    '/invoices/new': ['New invoice', 'فاتورة جديدة'],
    '/payments': ['Payments', 'المدفوعات'],
    '/fund': ['Fund', 'العهدات'],
    '/expenses': ['Expenses', 'المصروفات'],
    '/debts': ['Debts', 'الديون'],
    '/letters': ['Letters', 'الرسائل'],
    '/users': ['Users', 'المستخدمين'],
    '/settings/branding': ['Branding', 'العلامة التجارية'],
  };
  const hit = map[path];
  if (hit) return rtl ? hit[1] : hit[0];
  const segs = path.split('/').filter(Boolean);
  return segs.map((s) => s[0]?.toUpperCase() + s.slice(1)).join(' › ');
}
