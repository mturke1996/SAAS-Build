import { useState, useMemo } from 'react';
import { Search, Payments as PaymentsIcon, CalendarToday, TrendingUp } from '@mui/icons-material';
import { useDataStore } from '../../store/useDataStore';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Input, PageHero } from '../../design-system/primitives';
import { cn } from '../../design-system/primitives/cn';

/**
 * PaymentsPage — refreshed to match the new "Royal Violet" design system.
 *
 *  - Uses AppShell.TopBar (no duplicate back button / title here).
 *  - Dimensional-layered hero + KPI strip.
 *  - Tailwind + brand CSS vars (no hardcoded green).
 *  - Zero extra safe-area-inset-top (the shell handles it).
 */
export const PaymentsPage = () => {
  const { payments, clients, invoices } = useDataStore();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPayments = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return payments
      .filter((payment) => {
        const client = clients.find((c) => c.id === payment.clientId);
        const invoice = invoices.find((inv) => inv.id === payment.invoiceId);
        const clientName = client?.name || invoice?.tempClientName || '';
        return (
          payment.notes?.toLowerCase().includes(q) ||
          clientName.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
  }, [payments, clients, invoices, searchQuery]);

  const total = payments.reduce((sum, p) => sum + p.amount, 0);

  const methodLabel: Record<string, string> = {
    cash: 'نقدي',
    check: 'شيك',
    bank_transfer: 'تحويل بنكي',
    mobile_payment: 'إلكتروني',
  };

  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 pb-8 pt-2 sm:px-6 lg:space-y-5 lg:px-8 lg:pb-10 lg:pt-4">
      <PageHero
        accent="success"
        eyebrow={
          <span className="flex items-center gap-1 text-inherit">
            <TrendingUp sx={{ fontSize: 14 }} />
            المدفوعات
          </span>
        }
        title="إجمالي المحصّل"
        headline={<span dir="ltr">{formatCurrency(total)}</span>}
        trailing={
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/12 bg-white/10 sm:h-10 sm:w-10">
            <PaymentsIcon sx={{ fontSize: 20, color: '#fff' }} />
          </div>
        }
        footerStats={[
          { label: 'عدد العمليات', value: payments.length },
          {
            label: 'متوسط الدفعة',
            value: <span dir="ltr">{formatCurrency(payments.length ? total / payments.length : 0)}</span>,
          },
        ]}
      />

      {/* ═══ Search ═══ */}
      <section>
        <Input
          leftIcon={<Search sx={{ fontSize: 18 }} />}
          placeholder="بحث في المدفوعات..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </section>

      {/* ═══ List ═══ */}
      <section className="space-y-2">
        {filteredPayments.length === 0 ? (
          <div className="bg-surface-panel border border-border rounded-xl p-10 text-center">
            <div
              className="mx-auto h-14 w-14 rounded-2xl flex items-center justify-center mb-3"
              style={{ background: 'var(--brand-primary-soft)', color: 'var(--brand-primary)' }}
            >
              <PaymentsIcon sx={{ fontSize: 28 }} />
            </div>
            <div className="text-fg font-semibold">لا توجد مدفوعات</div>
            <div className="text-2xs text-fg-muted mt-1">
              {searchQuery ? 'لا نتائج مطابقة — جرّب بحث آخر.' : 'المدفوعات ستظهر هنا فور إضافتها.'}
            </div>
          </div>
        ) : (
          filteredPayments.map((payment) => {
            const client = clients.find((c) => c.id === payment.clientId);
            const invoice = invoices.find((inv) => inv.id === payment.invoiceId);
            const clientName = client?.name || invoice?.tempClientName || 'عميل غير معروف';
            return (
              <div
                key={payment.id}
                className={cn(
                  'relative bg-surface-panel border border-border rounded-xl p-4',
                  'hover:border-strong hover:shadow-xs transition-all duration-base content-auto'
                )}
                style={{
                  borderInlineEndWidth: '3px',
                  borderInlineEndColor: 'var(--brand-success)',
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-fg truncate">{clientName}</div>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-2xs text-fg-muted">
                        <CalendarToday sx={{ fontSize: 12 }} />
                        {formatDate(payment.paymentDate)}
                      </span>
                      <span
                        className="inline-flex items-center h-5 px-2 rounded-full text-[0.65rem] font-bold"
                        style={{
                          background: 'var(--brand-primary-soft)',
                          color: 'var(--brand-primary)',
                        }}
                      >
                        {methodLabel[payment.paymentMethod] || payment.paymentMethod}
                      </span>
                    </div>
                    {payment.notes && (
                      <div className="text-2xs text-fg-muted mt-1.5 line-clamp-1">{payment.notes}</div>
                    )}
                  </div>
                  <div
                    className="text-base sm:text-lg font-extrabold font-num tabular shrink-0"
                    style={{ color: 'var(--brand-success)' }}
                    dir="ltr"
                  >
                    +{formatCurrency(payment.amount)}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
};
