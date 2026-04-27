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
  MonetizationOn,
  Add,
  WarningAmber,
} from '@mui/icons-material';
import { Fab } from '@mui/material';
import { useBrand } from '../../config/BrandProvider';
import { useAuthStore } from '../../stores/useAuthStore';
import { useDataStore } from '../../stores/useDataStore';
import { useAppLockStore } from '../../stores/useAppLockStore';
import { useThemeStore } from '../../stores/useThemeStore';
import { useGlobalFundStore } from '../../stores/useGlobalFundStore';
import { useMyFundStats } from '../../core/hooks/useMyFundStats';
import { computeClientsProfitSummary } from '../../core/finance/clientProfitTotals';
import { formatCurrency } from '../../core/utils-formatters';
import { countUp, staggerChildren } from '../../core/motion/presets';
import { useSmartNav } from '../../core/agent/useSmartNav';
import { Button, PageHero } from '../../design-system/primitives';
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
  /** 0–2 currency · 3 clients · 4 unpaid */
  const kpiRefs = useRef<(HTMLSpanElement | null)[]>([]);

  // Memoized stats
  const stats = useMemo(() => {
    const collected = payments.reduce((s, p) => s + p.amount, 0);
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const profitSummary = computeClientsProfitSummary(clients, payments);
    return {
      collected,
      totalExpenses,
      profitSummary,
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
      const vals = [
        stats.collected,
        stats.totalExpenses,
        stats.profitSummary.totalGrossProfit,
        stats.clients,
        stats.unpaidInvoices,
      ];
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
    {
      scope: container,
      dependencies: [
        stats.collected,
        stats.totalExpenses,
        stats.profitSummary.totalGrossProfit,
        stats.clients,
        stats.unpaidInvoices,
      ],
    }
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
    <div ref={container} className="mx-auto max-w-6xl space-y-3 px-4 pb-8 pt-2 sm:px-6 lg:space-y-4 lg:px-8 lg:pb-10 lg:pt-4">
      {/* ═══ Hero — مضغوط (مثل مراجع fintech) ═══ */}
      <PageHero
        reveal
        compact
        accent="brand"
        eyebrow={
          <>
            <Bolt sx={{ fontSize: 14, color: 'rgba(255,255,255,0.92)' }} />
            <span className="font-arabic font-bold">{greeting}</span>
          </>
        }
        brand={
          <LogoMark size={22} showName inverted />
        }
        title={rtl ? `أهلاً ${displayName}` : `Welcome, ${displayName}`}
        subtitle={
          rtl ? `نظرة عامة على ${brand.name} اليوم.` : `Here's your ${brand.name} overview today.`
        }
        trailing={
          <div className="flex items-center gap-1.5">
            {brand.features?.enableDarkMode && (
              <button
                onClick={toggleTheme}
                aria-label={rtl ? 'تبديل السمة' : 'Toggle theme'}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/12 bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/18"
              >
                {mode === 'dark' ? <Brightness7 sx={{ fontSize: 18 }} /> : <Brightness4 sx={{ fontSize: 18 }} />}
              </button>
            )}
            <button
              onClick={() => navigate('/settings/branding')}
              aria-label={rtl ? 'الإعدادات' : 'Settings'}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/12 bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/18"
            >
              <Settings sx={{ fontSize: 18 }} />
            </button>
          </div>
        }
      />

      {/* ═══ Snapshot: navy + peach (Stitch-style) + insight card ═══ */}
      {canAccess('stats') && (
        <>
          <section
            data-reveal
            className="grid grid-cols-2 gap-2.5 sm:gap-3"
            aria-label={rtl ? 'ملخص سريع' : 'Summary'}
          >
            <div
              className="relative overflow-hidden rounded-2xl bg-[var(--brand-primary)] p-3 text-white shadow-sm ring-1 ring-white/10 sm:p-3.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-2xs font-semibold uppercase tracking-wide text-white/80">
                  {rtl ? 'العملاء' : 'Active'}
                </span>
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-white/10" aria-hidden>
                  <People sx={{ fontSize: 16 }} />
                </span>
              </div>
              <span
                ref={(el) => {
                  kpiRefs.current[3] = el;
                }}
                className="mt-1.5 block text-xl font-bold tabular-nums font-num leading-none tracking-tight sm:text-2xl"
              >
                0
              </span>
              <span className="mt-0.5 block text-2xs text-white/80 font-arabic">
                {rtl ? 'عميل مسجّل' : 'On file'}
              </span>
            </div>

            <div className="rounded-2xl border border-[color-mix(in_srgb,var(--theme-peach-fg)_8%,var(--surface-border))] bg-[var(--theme-peach-bg)] p-3 text-[var(--theme-peach-fg)] shadow-sm sm:p-3.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-2xs font-semibold uppercase tracking-wide opacity-90">
                  {rtl ? 'تنبيه' : 'Action'}
                </span>
                <span
                  className="grid h-7 w-7 place-items-center rounded-lg bg-[color-mix(in_srgb,var(--theme-peach-fg)_8%,transparent)]"
                  aria-hidden
                >
                  <WarningAmber sx={{ fontSize: 16 }} />
                </span>
              </div>
              <span
                ref={(el) => {
                  kpiRefs.current[4] = el;
                }}
                className="mt-1.5 block text-xl font-bold tabular-nums font-num leading-none tracking-tight sm:text-2xl"
              >
                0
              </span>
              <span className="mt-0.5 block text-2xs font-arabic opacity-90">
                {rtl ? 'غير مدفوعة' : 'Unpaid'}
              </span>
            </div>
          </section>

          <section
            data-reveal
            className="overflow-hidden rounded-2xl border border-border bg-surface-panel shadow-sm"
          >
            <div className="p-4 sm:p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-2xs font-semibold uppercase tracking-wide text-fg-muted">
                    {rtl ? 'إجمالي التحصيل' : 'Total collected'}
                  </p>
                  <p
                    ref={(el) => {
                      kpiRefs.current[0] = el;
                    }}
                    className="mt-2 break-words text-[1.65rem] font-bold leading-none tracking-tight text-[var(--theme-navy-ink)] tabular-nums font-num sm:text-[1.85rem]"
                  >
                    {formatCurrency(0)}
                  </p>
                  <p className="mt-2 text-2xs leading-relaxed text-fg-subtle font-arabic">
                    {rtl
                      ? `${payments.length} عملية دفع مسجّلة`
                      : `${payments.length} recorded payment${payments.length === 1 ? '' : 's'}`}
                  </p>
                </div>
                <div
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-border bg-surface-sunken text-[color:var(--brand-primary)]"
                  aria-hidden
                >
                  <PaymentsIcon sx={{ fontSize: 22 }} />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 border-t border-border bg-surface-sunken/45 px-4 py-2.5 sm:px-4">
              <TrendingUp sx={{ fontSize: 16, color: 'var(--brand-success)' }} className="shrink-0" aria-hidden />
              <p className="min-w-0 text-2xs leading-relaxed text-fg-muted font-arabic">
                {(() => {
                  const share =
                    stats.invoices > 0
                      ? Math.round((stats.unpaidInvoices / stats.invoices) * 100)
                      : 0;
                  return rtl
                    ? `${share}% من الفواتير بانتظار المتابعة`
                    : `${share}% of invoices need follow-up`;
                })()}
              </p>
            </div>
          </section>

          <section
            data-reveal
            className="grid grid-cols-2 gap-2.5 sm:gap-3"
            aria-label={rtl ? 'تفاصيل مالية' : 'Financial detail'}
          >
            <KpiTile
              label={rtl ? 'المصروفات' : 'Expenses'}
              valueRef={(el) => {
                kpiRefs.current[1] = el;
              }}
              initial={formatCurrency(0)}
              tone="danger"
              Icon={TrendingDown}
            />
            <KpiTile
              label={rtl ? 'إجمالي النسبة' : 'Total share'}
              hint={
                rtl
                  ? stats.profitSummary.clientsWithProfitRule > 0
                    ? `حصة أرباح من ${stats.profitSummary.clientsWithProfitRule} عميل`
                    : 'حصة الأرباح المحتسبة من التحصيل'
                  : stats.profitSummary.clientsWithProfitRule > 0
                    ? `Share from ${stats.profitSummary.clientsWithProfitRule} clients`
                    : 'Profit share from collections'
              }
              highlight={stats.profitSummary.totalGrossProfit > 0}
              valueRef={(el) => {
                kpiRefs.current[2] = el;
              }}
              initial={formatCurrency(0)}
              tone={stats.profitSummary.totalGrossProfit > 0 ? 'success' : 'neutral'}
              Icon={MonetizationOn}
            />
          </section>
        </>
      )}

      {/* ═══ Desktop CTA (mobile uses FAB) ═══ */}
      {canAccess('invoices') && (
        <section data-reveal className="hidden lg:block">
          <Button
            size="lg"
            onClick={() => navigate('/invoices/new')}
            leftIcon={<AddCircleOutline sx={{ fontSize: 20 }} />}
            className="btn-primary-glow !rounded-2xl"
          >
            {rtl ? 'إنشاء فاتورة جديدة' : 'Create new invoice'}
          </Button>
        </section>
      )}

      {/* Mobile FAB — above bottom nav */}
      {canAccess('invoices') && (
        <Fab
          color="primary"
          aria-label={rtl ? 'فاتورة جديدة' : 'New invoice'}
          onClick={() => navigate('/invoices/new')}
          className="lg:!hidden !fixed !z-[950] shadow-lg"
          sx={{
            insetInlineEnd: 16,
            bottom: 'calc(76px + env(safe-area-inset-bottom, 0px))',
            width: 56,
            height: 56,
            borderRadius: '18px',
            boxShadow: 'var(--shadow-brand)',
          }}
        >
          <Add sx={{ fontSize: 28 }} />
        </Fab>
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
            className="group relative w-full cursor-pointer overflow-hidden rounded-2xl border border-border bg-surface-panel p-3 text-start shadow-sm transition-all duration-300 hover:border-strong hover:shadow-md sm:p-3.5"
          >
            <div className="absolute -top-[40%] -right-[20%] w-[60%] h-[80%] rounded-full bg-gradient-to-br from-[var(--brand-primary)]/8 to-transparent blur-[80px] pointer-events-none" />
            <div className="relative flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-primary)] text-white shadow-sm">
                  <AccountBalance sx={{ fontSize: 18 }} />
                </span>
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold text-fg font-arabic">{rtl ? 'رصيد العهدة' : 'Fund Balance'}</div>
                  <div className="text-2xs text-fg-muted font-arabic">{rtl ? 'الإيداعات والمصروفات' : 'Deposits & expenses'}</div>
                </div>
              </div>
              <div className="shrink-0 text-end">
                <div className="text-base font-bold font-num tabular-nums text-[var(--brand-primary)] sm:text-lg">
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
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-extrabold text-[var(--theme-navy-ink)] tracking-tight">
            {rtl ? 'الفئات' : 'Categories'}
          </h2>
          {canAccess('invoices') && (
            <button
              type="button"
              onClick={() => navigate('/invoices')}
              className="text-2xs font-bold uppercase tracking-wider text-fg-subtle hover:text-[color:var(--brand-primary)] transition-colors"
            >
              {rtl ? 'عرض الكل' : 'View all'}
            </button>
          )}
        </div>
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
  /** Short caption under the title (UI/UX Pro Max: clarify KPI meaning without clutter). */
  hint?: string;
  /** Emphasis ring when the metric is “active” (e.g. profit &gt; 0). */
  highlight?: boolean;
  valueRef: (el: HTMLSpanElement | null) => void;
  initial: string;
  tone: 'brand' | 'success' | 'danger' | 'neutral';
  Icon: any;
}

function KpiTile({ label, hint, highlight, valueRef, initial, tone, Icon }: KpiTileProps) {
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
      className={cn(
        'relative overflow-hidden rounded-2xl border border-border bg-surface-panel p-2.5 shadow-sm sm:p-3',
        'transition-shadow duration-base hover:shadow-md',
        highlight
          ? 'border-[color:color-mix(in_srgb,var(--brand-success)_30%,var(--surface-border))] ring-1 ring-[color:color-mix(in_srgb,var(--brand-success)_12%,transparent)]'
          : ''
      )}
      style={{
        backgroundImage: `radial-gradient(140% 70% at 100% 0%, ${toneBg} 0%, transparent 60%)`,
      }}
    >
      <div className="mb-1.5 flex items-start justify-between gap-1.5">
        <div className="min-w-0 flex-1">
          <span className="block truncate text-2xs font-semibold uppercase tracking-wide text-fg-muted">
            {label}
          </span>
          {hint && (
            <p className="mt-0.5 line-clamp-2 text-[0.65rem] font-arabic leading-snug text-fg-muted">{hint}</p>
          )}
        </div>
        <span
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
          style={{ background: toneBg, color: toneColor }}
          aria-hidden
        >
          <Icon sx={{ fontSize: 14 }} />
        </span>
      </div>
      <span
        ref={valueRef}
        className="block truncate text-base font-bold tabular-nums font-num tracking-tight sm:text-lg"
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
        'group min-h-[92px] cursor-pointer text-start',
        'rounded-2xl border border-border bg-surface-panel p-2.5 shadow-sm',
        'transition-[transform,box-shadow,border-color,background-color] duration-[220ms] ease-[cubic-bezier(0.23,1,0.32,1)]',
        'hover:border-strong hover:shadow-md hover:-translate-y-0.5',
        'active:scale-[0.98] active:transition-[transform] active:duration-[120ms]',
        'focus:outline-none focus-visible:shadow-focus',
        'sm:min-h-[96px] sm:p-3'
      )}
    >
      <div className="flex h-full items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <span
            className="mb-1.5 inline-flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: toneBg, color: toneColor }}
            aria-hidden
          >
            <Icon sx={{ fontSize: 18 }} />
          </span>
          <div className="truncate text-sm font-bold leading-snug text-fg">{label}</div>
          <div className="mt-0.5 truncate text-2xs text-fg-muted">{sub}</div>
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
