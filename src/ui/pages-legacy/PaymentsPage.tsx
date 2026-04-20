import { useState, useMemo } from 'react';
import { Search, Payments as PaymentsIcon, CalendarToday, TrendingUp } from '@mui/icons-material';
import { useDataStore } from '../../store/useDataStore';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Input } from '../../design-system/primitives';
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
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-4 pb-8 lg:pt-8 lg:pb-14 space-y-5 lg:space-y-7">
      {/* ═══ Hero card — brand gradient ═══ */}
      <section
        className="relative overflow-hidden rounded-2xl grain text-white"
        style={{
          background: 'linear-gradient(135deg, #1B0F3B 0%, #4C1D95 45%, #6D28D9 100%)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div
          aria-hidden
          className="absolute -top-16 -right-12 w-[220px] h-[220px] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(closest-side, #10B981 0%, transparent 70%)', opacity: 0.35 }}
        />
        <div className="relative flex items-start justify-between gap-4 p-5 sm:p-7">
          <div className="flex-1 min-w-0">
            <span className="inline-flex items-center gap-1 h-6 px-2 rounded-full bg-white/15 backdrop-blur text-white/90 text-2xs font-semibold border border-white/15">
              <TrendingUp sx={{ fontSize: 12, color: '#34D399' }} />
              المدفوعات
            </span>
            <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight leading-tight mt-2">
              إجمالي المحصّل
            </h1>
            <p className="text-2xl sm:text-4xl font-extrabold tracking-tight mt-1 font-num tabular">
              {formatCurrency(total)}
            </p>
          </div>
          <div className="shrink-0 h-14 w-14 rounded-2xl bg-white/12 backdrop-blur border border-white/15 flex items-center justify-center">
            <PaymentsIcon sx={{ fontSize: 28, color: '#ffffff' }} />
          </div>
        </div>

        {/* Inline stats */}
        <div className="relative grid grid-cols-2 bg-black/15 border-t border-white/10">
          <div className="p-4 text-center border-l border-white/10 rtl:border-l-0 rtl:border-r rtl:border-white/10">
            <div className="text-2xs text-white/60 font-semibold">عدد العمليات</div>
            <div className="text-lg font-extrabold text-white mt-0.5">{payments.length}</div>
          </div>
          <div className="p-4 text-center">
            <div className="text-2xs text-white/60 font-semibold">متوسط الدفعة</div>
            <div className="text-lg font-extrabold text-white mt-0.5 font-num tabular">
              {formatCurrency(payments.length ? total / payments.length : 0)}
            </div>
          </div>
        </div>
      </section>

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
