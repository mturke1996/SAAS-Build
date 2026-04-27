import { AccountBalanceWallet, ArrowBack, ArrowForward, WarningAmber } from '@mui/icons-material';
import { formatCurrency } from '../../core/utils-formatters';
import type { MyFundStats } from '../../core/hooks/useMyFundStats';
import { cn } from '../../design-system/primitives/cn';

/**
 * Personal custody (عهدة) — fintech dashboard pattern:
 * Minimal / Swiss: surface + border, semantic accent only, no decorative gradients (per ui-ux-pro-max finance anti-patterns).
 * Mobile-first: single column, 44px+ touch target, no horizontal overflow.
 */
export interface HomeCustodyPledgeCardProps {
  stats: MyFundStats;
  rtl: boolean;
  onNavigateExpenses: () => void;
}

export function HomeCustodyPledgeCard({ stats, rtl, onNavigateExpenses }: HomeCustodyPledgeCardProps) {
  const isDeficit = stats.remaining < 0;
  const healthy = stats.remaining > stats.deposited * 0.4;
  const pct =
    stats.deposited > 0
      ? Math.max(0, Math.min(100, (stats.remaining / stats.deposited) * 100))
      : 0;

  const toneColor = isDeficit
    ? 'var(--brand-danger)'
    : healthy
      ? 'var(--brand-success)'
      : 'var(--brand-warning)';

  const toneBg = isDeficit
    ? 'color-mix(in srgb, var(--brand-danger) 12%, transparent)'
    : healthy
      ? 'color-mix(in srgb, var(--brand-success) 12%, transparent)'
      : 'color-mix(in srgb, var(--brand-warning) 14%, transparent)';

  const Chevron = rtl ? ArrowBack : ArrowForward;

  return (
    <button
      type="button"
      onClick={onNavigateExpenses}
      className={cn(
        'w-full min-h-[52px] text-start rounded-2xl border border-border bg-surface-panel',
        'shadow-xs hover:shadow-sm hover:border-strong',
        'transition-[box-shadow,border-color] duration-200 ease-out',
        'focus:outline-none focus-visible:shadow-focus',
        'active:scale-[0.99] motion-reduce:active:scale-100 motion-reduce:transition-none',
        'cursor-pointer pressable p-4 sm:p-5 group'
      )}
    >
      <div className="flex items-start gap-3 min-w-0">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg"
          style={{ background: toneBg, color: toneColor }}
          aria-hidden
        >
          <AccountBalanceWallet sx={{ fontSize: 22 }} />
        </span>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-2xs font-bold uppercase tracking-wider text-fg-muted">
              {rtl ? 'رصيد عهدتك' : 'Your custody'}
            </span>
            {isDeficit && (
              <span
                className="inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[0.65rem] font-semibold text-[color:var(--brand-danger)]"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--brand-danger) 10%, transparent)',
                }}
              >
                <WarningAmber sx={{ fontSize: 14 }} aria-hidden />
                {rtl ? 'عجز' : 'Deficit'}
              </span>
            )}
          </div>

          <p
            className="text-2xl sm:text-3xl font-extrabold font-num tabular-nums tracking-tight text-fg leading-tight"
            dir="ltr"
            style={{ color: isDeficit ? 'var(--brand-danger)' : 'var(--text-primary)' }}
          >
            {formatCurrency(stats.remaining)}
          </p>

          <p className="text-xs text-fg-muted leading-snug max-w-prose">
            {isDeficit
              ? rtl
                ? 'الرصيد سالب. راجع المصروفات المسجّلة.'
                : 'Negative balance. Review recorded expenses.'
              : rtl
                ? `متبقٍ ${Math.round(pct)}% من إجمالي العهدة.`
                : `${Math.round(pct)}% of deposit remaining.`}
          </p>
        </div>

        <span className="shrink-0 pt-1 text-fg-muted transition-colors duration-200 group-hover:text-[color:var(--brand-primary)]">
          <Chevron sx={{ fontSize: 20 }} />
        </span>
      </div>

      {/* Single-color utilization bar — no multi-stop gradients */}
      <div
        className="mt-4 h-1.5 w-full rounded-full bg-surface-sunken overflow-hidden"
        role="progressbar"
        aria-valuenow={Math.round(isDeficit ? 0 : pct)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full transition-[width] duration-300 ease-out motion-reduce:transition-none"
          style={{
            width: isDeficit ? '100%' : `${pct}%`,
            backgroundColor: toneColor,
          }}
        />
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-4 text-center sm:text-start">
        <div className="min-w-0">
          <dt className="text-[0.65rem] font-semibold text-fg-muted">{rtl ? 'إيداع' : 'Deposited'}</dt>
          <dd className="mt-0.5 text-sm font-bold font-num tabular text-fg truncate" dir="ltr">
            {formatCurrency(stats.deposited)}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-[0.65rem] font-semibold text-fg-muted">{rtl ? 'مصروف' : 'Spent'}</dt>
          <dd
            className="mt-0.5 text-sm font-bold font-num tabular truncate"
            dir="ltr"
            style={{ color: 'var(--brand-danger)' }}
          >
            {formatCurrency(stats.spent)}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-[0.65rem] font-semibold text-fg-muted">{rtl ? 'متبقي' : 'Left'}</dt>
          <dd
            className="mt-0.5 text-sm font-bold font-num tabular truncate"
            dir="ltr"
            style={{ color: stats.remaining >= 0 ? 'var(--brand-success)' : 'var(--brand-danger)' }}
          >
            {formatCurrency(stats.remaining)}
          </dd>
        </div>
      </dl>

      <p className="mt-3 text-2xs font-medium text-fg-muted">
        {rtl ? 'اضغط للانتقال إلى المصروفات' : 'Tap to open expenses'}
      </p>
    </button>
  );
}
