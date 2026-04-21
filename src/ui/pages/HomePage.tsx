import { useMemo, useRef, type ReactNode } from 'react';
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
import { useMyFundStats } from '../../core/hooks/useMyFundStats';
import { formatCurrency } from '../../core/utils-formatters';
import { countUp, staggerChildren } from '../../core/motion/presets';
import { useSmartNav } from '../../core/agent/useSmartNav';
import { Button, IconButton, PageHero } from '../../design-system/primitives';
import { LogoMark } from '../brand/LogoMark';
import { cn } from '../../design-system/primitives/cn';
import { HomeCustodyPledgeCard } from './HomeCustodyPledgeCard';

/**
 * HomePage — "Dimensional Layering" dashboard.
 *
 *  Hero greeting card with brand gradient + grain.
 *  Float-card KPIs with subtle gradients + GSAP count-up.
 *  Touch-friendly module grid (2-col mobile, 3-col desktop).
 *  Personal custody (عهدة) card when the user has fund deposits — links to expenses.
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
  const myFundStats = useMyFundStats();

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

  useGSAP(
    () => {
      const root = container.current;
      if (!root) return;
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const items = root.querySelectorAll<HTMLElement>('[data-reveal]');
      if (reduced) {
        gsap.set(items, { autoAlpha: 1, y: 0 });
        return;
      }
      staggerChildren(root, '[data-reveal]', { duration: 0.3, stagger: 0.05, delay: 0.05 });
    },
    { scope: container, dependencies: [] }
  );

  useGSAP(
    () => {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
    sub: ReactNode;
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
    {
      label: rtl ? 'العهدات' : 'Fund',
      sub: <span className="money-ltr font-num tabular inline-block">{formatCurrency(stats.fund)}</span>,
      path: '/fund',
      Icon: AccountBalance,
      module: 'balances',
      tone: 'brand',
    },
    { label: rtl ? 'المصروفات' : 'Expenses', sub: rtl ? 'تتبع التكاليف' : 'Cost tracking', path: '/expenses', Icon: ReceiptLong, module: 'expenses', tone: 'danger' },
    { label: rtl ? 'الديون' : 'Debts', sub: rtl ? 'إدارة الديون' : 'Receivables', path: '/debts', Icon: Savings, module: 'debts', tone: 'warning' },
    { label: rtl ? 'الرسائل' : 'Letters', sub: rtl ? 'خطابات رسمية' : 'Official docs', path: '/letters', Icon: Description, module: 'letters', tone: 'info' },
    { label: rtl ? 'المستخدمين' : 'Users', sub: rtl ? 'إدارة الحسابات' : 'Accounts', path: '/users', Icon: ManageAccounts, module: 'users' },
  ];
  const modules = allModules.filter((m) => !m.module || canAccess(m.module as any));

  return (
    <div ref={container} className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-4 pb-8 lg:pt-8 lg:pb-14 space-y-5 lg:space-y-7">
      {/* ═══ Hero — shared PageHero primitive (content + depth, not empty chrome) ═══ */}
      <PageHero
        reveal
        accent="brand"
        eyebrow={
          <span className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-white/12 backdrop-blur border border-white/15 text-white/90 text-xs font-bold font-arabic shadow-sm">
            <Bolt sx={{ fontSize: 16, color: '#FBBF24' }} />
            {greeting}
          </span>
        }
        brand={
          <LogoMark size={30} showName inverted />
        }
        title={rtl ? `أهلاً ${displayName}` : `Welcome, ${displayName}`}
        subtitle={
          rtl ? `نظرة عامة على ${brand.name} اليوم.` : `Here's your ${brand.name} overview today.`
        }
        trailing={
          <div className="flex items-center gap-2">
            {brand.features?.enableDarkMode && (
              <button
                onClick={toggleTheme}
                aria-label={rtl ? 'تبديل السمة' : 'Toggle theme'}
                className="h-11 w-11 flex items-center justify-center rounded-[14px] bg-white/12 hover:bg-white/20 text-white backdrop-blur-sm border border-white/15 transition-colors duration-300 shadow-sm"
              >
                {mode === 'dark' ? <Brightness7 fontSize="small" /> : <Brightness4 fontSize="small" />}
              </button>
            )}
            <button
              onClick={() => navigate('/settings/branding')}
              aria-label={rtl ? 'الإعدادات' : 'Settings'}
              className="h-11 w-11 flex items-center justify-center rounded-[14px] bg-white/12 hover:bg-white/20 text-white backdrop-blur-sm border border-white/15 transition-colors duration-300 shadow-sm"
            >
              <Settings fontSize="small" />
            </button>
          </div>
        }
      />

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

      {/* ═══ Personal custody (عهدة) — minimal card, same FIFO stats as Expenses ═══ */}
      {(canAccess('expenses') || canAccess('balances')) && myFundStats && (
        <section data-reveal aria-label={rtl ? 'رصيد العهدة الشخصية' : 'Personal custody balance'}>
          <HomeCustodyPledgeCard
            stats={myFundStats}
            rtl={rtl}
            onNavigateExpenses={() => navigate('/expenses')}
          />
        </section>
      )}

      {/* ═══ Fund Balance Card (visible when user has fund access) ═══ */}
      {canAccess('balances') && stats.fund > 0 && (
        <section data-reveal>
          <button
            onClick={() => navigate('/fund')}
            className="w-full group relative overflow-hidden bg-surface-panel border border-border rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md hover:border-strong transition-all duration-300 text-start cursor-pointer"
          >
            <div className="absolute -top-[40%] -right-[20%] w-[60%] h-[80%] rounded-full bg-gradient-to-br from-[var(--brand-primary)]/8 to-transparent blur-[80px] pointer-events-none" />
            <div className="relative flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--brand-primary)] to-[#8b5cf6] text-white shadow-lg">
                  <AccountBalance sx={{ fontSize: 20 }} />
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-extrabold text-fg truncate font-arabic">{rtl ? 'رصيد العهدة' : 'Fund Balance'}</div>
                  <div className="text-2xs text-fg-muted font-arabic">{rtl ? 'صندوق الإيداعات والمصروفات' : 'Deposits & Expenses fund'}</div>
                </div>
              </div>
              <div className="text-end shrink-0">
                <div className="text-lg sm:text-xl font-extrabold font-num tabular-nums text-[var(--brand-primary)]">
                  {formatCurrency(stats.fund)}
                </div>
                <div className="inline-flex items-center gap-1 text-2xs text-fg-muted">
                  <span className="font-arabic">{rtl ? 'عرض التفاصيل' : 'Details'}</span>
                  <ChevronRow sx={{ fontSize: 14 }} className="group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition-transform" />
                </div>
              </div>
            </div>
          </button>
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
  sub: ReactNode;
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
