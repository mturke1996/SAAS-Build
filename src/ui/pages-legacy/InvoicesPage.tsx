import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Add, Search, Description, Receipt } from '@mui/icons-material';
import { useDataStore } from '../../store/useDataStore';
import { formatCurrency, formatDate, getStatusLabel } from '../../utils/formatters';
import { Button, Input, PageHero } from '../../design-system/primitives';
import { cn } from '../../design-system/primitives/cn';

type InvoiceStatus = 'paid' | 'partially_paid' | 'draft' | 'overdue' | 'cancelled' | 'pending';

export const InvoicesPage = () => {
  const navigate = useNavigate();
  const { invoices, clients } = useDataStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return invoices.filter((inv) => {
      const client = clients.find((c) => c.id === inv.clientId);
      const clientName = client?.name || (inv as any).tempClientName || '';
      const matchesSearch =
        inv.invoiceNumber.toLowerCase().includes(q) || clientName.toLowerCase().includes(q);
      const matchesStatus = filterStatus === 'all' || inv.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [invoices, clients, searchQuery, filterStatus]);

  const stats = useMemo(() => {
    const total = invoices.reduce((sum, inv) => sum + inv.total, 0);
    const paid = invoices.filter((i) => i.status === 'paid').reduce((sum, inv) => sum + inv.total, 0);
    return { total, paid, pending: total - paid };
  }, [invoices]);

  const statusChipStyle = (status: string): { bg: string; color: string } => {
    switch (status) {
      case 'paid':
        return { bg: 'color-mix(in srgb, var(--brand-success) 12%, transparent)', color: 'var(--brand-success)' };
      case 'partially_paid':
        return { bg: 'color-mix(in srgb, var(--brand-warning) 14%, transparent)', color: 'var(--brand-warning)' };
      case 'overdue':
        return { bg: 'color-mix(in srgb, var(--brand-danger) 12%, transparent)', color: 'var(--brand-danger)' };
      case 'draft':
        return { bg: 'var(--surface-sunken)', color: 'var(--text-secondary)' };
      default:
        return { bg: 'var(--brand-primary-soft)', color: 'var(--brand-primary)' };
    }
  };

  const statusBorderColor = (status: string): string => {
    switch (status) {
      case 'paid':
        return 'var(--brand-success)';
      case 'partially_paid':
        return 'var(--brand-warning)';
      case 'overdue':
        return 'var(--brand-danger)';
      default:
        return 'var(--brand-primary)';
    }
  };

  const filterTabs: Array<{ id: string; label: string }> = [
    { id: 'all', label: 'الكل' },
    { id: 'paid', label: 'مدفوعة' },
    { id: 'partially_paid', label: 'جزئية' },
    { id: 'draft', label: 'مسودة' },
    { id: 'overdue', label: 'متأخرة' },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 pb-8 pt-2 sm:px-6 lg:space-y-5 lg:px-8 lg:pb-10 lg:pt-4">
      <PageHero
        accent="warning"
        eyebrow={
          <span className="flex items-center gap-1 text-inherit">
            <Receipt sx={{ fontSize: 14 }} />
            الفواتير
          </span>
        }
        title={`${invoices.length} فاتورة`}
        subtitle={
          <>
            إجمالي مفوتر:{' '}
            <span className="font-num tabular font-bold text-white money-ltr" dir="ltr">
              {formatCurrency(stats.total)}
            </span>
          </>
        }
        trailing={
          <button
            type="button"
            onClick={() => navigate('/invoices/new')}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-white px-3 text-xs font-bold text-[color:var(--brand-primary)] shadow-sm transition hover:bg-white/92"
          >
            <Add sx={{ fontSize: 16 }} />
            إنشاء فاتورة
          </button>
        }
        footerStatsTriple={[
          {
            label: 'المفوتر',
            value: (
              <span className="text-sm sm:text-base font-extrabold font-num tabular truncate text-white" dir="ltr">
                {formatCurrency(stats.total)}
              </span>
            ),
          },
          {
            label: 'المحصّل',
            value: (
              <span className="text-sm sm:text-base font-extrabold font-num tabular truncate text-[#FBBF24]" dir="ltr">
                {formatCurrency(stats.paid)}
              </span>
            ),
          },
          {
            label: 'المستحق',
            value: (
              <span className="text-sm sm:text-base font-extrabold font-num tabular truncate" style={{ color: '#FBBF24' }} dir="ltr">
                {formatCurrency(stats.pending)}
              </span>
            ),
          },
        ]}
      />

      {/* ═══ Search + filter chips ═══ */}
      <section className="space-y-3">
        <Input
          leftIcon={<Search sx={{ fontSize: 18 }} />}
          placeholder="بحث برقم الفاتورة أو اسم العميل..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
          {filterTabs.map((tab) => {
            const active = filterStatus === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
                className={cn(
                  'shrink-0 h-9 px-4 rounded-full text-2xs font-bold transition-all duration-fast pressable',
                  active
                    ? 'bg-[color:var(--brand-primary)] text-white shadow-xs'
                    : 'bg-surface-panel text-fg-subtle border border-border hover:border-strong'
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* ═══ List ═══ */}
      <section className="space-y-2">
        {filtered.length === 0 ? (
          <div className="bg-surface-panel border border-border rounded-xl p-10 text-center">
            <div
              className="mx-auto h-14 w-14 rounded-2xl flex items-center justify-center mb-3"
              style={{ background: 'var(--brand-primary-soft)', color: 'var(--brand-primary)' }}
            >
              <Description sx={{ fontSize: 28 }} />
            </div>
            <div className="text-fg font-semibold">لا توجد فواتير</div>
            <div className="text-2xs text-fg-muted mt-1">
              {searchQuery || filterStatus !== 'all'
                ? 'لا توجد فواتير مطابقة لهذا الفلتر.'
                : 'ابدأ بإنشاء أول فاتورة.'}
            </div>
            {(!searchQuery && filterStatus === 'all') && (
              <Button
                className="mt-4 mx-auto"
                leftIcon={<Add sx={{ fontSize: 18 }} />}
                onClick={() => navigate('/invoices/new')}
              >
                إنشاء فاتورة
              </Button>
            )}
          </div>
        ) : (
          filtered.map((inv) => {
            const client = clients.find((c) => c.id === inv.clientId);
            const chip = statusChipStyle(inv.status);
            return (
              <button
                key={inv.id}
                onClick={() => navigate(`/invoices/${inv.id}`)}
                className={cn(
                  'w-full text-start bg-surface-panel border border-border rounded-xl p-4',
                  'hover:border-strong hover:shadow-xs transition-all duration-base cursor-pointer pressable content-auto',
                  'focus:outline-none focus-visible:shadow-focus'
                )}
                style={{
                  borderInlineEndWidth: '3px',
                  borderInlineEndColor: statusBorderColor(inv.status),
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-fg truncate">#{inv.invoiceNumber}</div>
                    <div className="text-2xs text-fg-muted mt-1 truncate">
                      {client?.name || (inv as any).tempClientName || 'عميل غير معروف'} •{' '}
                      {formatDate(inv.issueDate)}
                    </div>
                  </div>
                  <div className="text-start shrink-0 space-y-1">
                    <div
                      className="font-extrabold text-base font-num tabular"
                      style={{ color: 'var(--brand-primary)' }}
                      dir="ltr"
                    >
                      {formatCurrency(inv.total)}
                    </div>
                    <span
                      className="inline-flex items-center h-5 px-2 rounded-full text-[0.6rem] font-bold"
                      style={{ background: chip.bg, color: chip.color }}
                    >
                      {getStatusLabel(inv.status)}
                    </span>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </section>
    </div>
  );
};
