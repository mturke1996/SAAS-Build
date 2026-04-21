// @ts-nocheck
import { useState, useMemo } from 'react';
import {
  Add,
  Search,
  AccountBalanceWallet,
  CalendarToday,
  Person,
  Business,
  Savings,
} from '@mui/icons-material';
import { useDataStore } from '../../store/useDataStore';
import { useAuthStore } from '../../store/useAuthStore';
import { formatCurrency, formatDate } from '../../utils/formatters';
import dayjs from 'dayjs';
import { Button, Input, Modal, PageHero } from '../../design-system/primitives';
import { cn } from '../../design-system/primitives/cn';

export const DebtsPage = () => {
  const { standaloneDebts, clients, addStandaloneDebt } = useDataStore();
  const { user } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    partyType: 'external' as 'external' | 'client',
    partyName: '',
    clientId: '',
    description: '',
    amount: '',
    date: dayjs(),
    dueDate: dayjs().add(1, 'month'),
    notes: '',
  });

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return standaloneDebts.filter(
      (d) =>
        d.partyName.toLowerCase().includes(q) || d.description.toLowerCase().includes(q)
    );
  }, [standaloneDebts, searchQuery]);

  const totalRemaining = standaloneDebts.reduce((sum, d) => sum + d.remainingAmount, 0);
  const totalDebts = standaloneDebts.reduce((sum, d) => sum + d.amount, 0);
  const totalPaid = standaloneDebts.reduce((sum, d) => sum + d.paidAmount, 0);

  const handleAdd = async () => {
    if (!form.amount || (!form.partyName && !form.clientId)) return;
    setLoading(true);
    let partyName = form.partyName;
    if (form.partyType === 'client') {
      const client = clients.find((c) => c.id === form.clientId);
      if (client) partyName = client.name;
    }
    try {
      await addStandaloneDebt({
        id: crypto.randomUUID(),
        partyType: form.partyType,
        partyName,
        clientId: form.partyType === 'client' ? form.clientId : undefined,
        description: form.description,
        amount: parseFloat(form.amount),
        paidAmount: 0,
        remainingAmount: parseFloat(form.amount),
        status: 'unpaid',
        date: form.date.toISOString(),
        dueDate: form.dueDate.toISOString(),
        notes: form.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: user?.displayName || 'غير معروف',
      });
      setDialogOpen(false);
      setForm({
        partyType: 'external',
        partyName: '',
        clientId: '',
        description: '',
        amount: '',
        date: dayjs(),
        dueDate: dayjs().add(1, 'month'),
        notes: '',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-4 pb-8 lg:pt-8 lg:pb-14 space-y-5 lg:space-y-7">
      <PageHero
        accent="danger"
        eyebrow={
          <span className="flex items-center gap-1.5 text-inherit">
            <Savings sx={{ fontSize: 16 }} />
            الديون
          </span>
        }
        title="إجمالي المتبقّي"
        headline={<span dir="ltr">{formatCurrency(totalRemaining)}</span>}
        trailing={
          <button
            type="button"
            onClick={() => setDialogOpen(true)}
            className="inline-flex items-center gap-2 h-11 px-5 rounded-[16px] font-bold text-sm text-[color:var(--brand-primary)] bg-white hover:bg-white/90 transition-colors shadow-lg"
          >
            <Add sx={{ fontSize: 18 }} />
            جديد
          </button>
        }
        footerStatsTriple={[
          {
            label: 'عدد الديون',
            value: (
              <span className="text-sm sm:text-base font-extrabold font-num tabular truncate" style={{ color: '#fff' }}>
                {standaloneDebts.length}
              </span>
            ),
          },
          {
            label: 'الإجمالي',
            value: (
              <span className="text-sm sm:text-base font-extrabold font-num tabular truncate" style={{ color: '#FBBF24' }} dir="ltr">
                {formatCurrency(totalDebts)}
              </span>
            ),
          },
          {
            label: 'المسدّد',
            value: (
              <span className="text-sm sm:text-base font-extrabold font-num tabular truncate" style={{ color: '#34D399' }} dir="ltr">
                {formatCurrency(totalPaid)}
              </span>
            ),
          },
        ]}
      />

      {/* ═══ Search ═══ */}
      <section>
        <Input
          leftIcon={<Search sx={{ fontSize: 18 }} />}
          placeholder="بحث عن دين أو اسم..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </section>

      {/* ═══ Grid ═══ */}
      <section>
        {filtered.length === 0 ? (
          <div className="bg-surface-panel border border-border rounded-xl p-10 text-center">
            <div
              className="mx-auto h-14 w-14 rounded-2xl flex items-center justify-center mb-3"
              style={{ background: 'var(--brand-primary-soft)', color: 'var(--brand-primary)' }}
            >
              <AccountBalanceWallet sx={{ fontSize: 28 }} />
            </div>
            <div className="text-fg font-semibold">لا توجد ديون مسجلة</div>
            <div className="text-2xs text-fg-muted mt-1">ابدأ بتسجيل أول دين.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((debt) => {
              const isPaid = debt.status === 'paid';
              const pct = debt.amount > 0 ? (debt.paidAmount / debt.amount) * 100 : 0;
              return (
                <div
                  key={debt.id}
                  className={cn(
                    'bg-surface-panel border border-border rounded-xl p-4',
                    'hover:border-strong hover:shadow-sm transition-all duration-base content-auto'
                  )}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span
                        className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0"
                        style={{
                          background: 'var(--brand-primary-soft)',
                          color: 'var(--brand-primary)',
                        }}
                      >
                        {debt.partyType === 'external' ? (
                          <Business sx={{ fontSize: 20 }} />
                        ) : (
                          <Person sx={{ fontSize: 20 }} />
                        )}
                      </span>
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-fg truncate">{debt.partyName}</div>
                        <div className="text-2xs text-fg-muted truncate">
                          {debt.description || '—'}
                        </div>
                      </div>
                    </div>
                    <span
                      className="inline-flex items-center h-6 px-2.5 rounded-full text-[0.65rem] font-bold shrink-0"
                      style={{
                        background: isPaid
                          ? 'color-mix(in srgb, var(--brand-success) 12%, transparent)'
                          : 'color-mix(in srgb, var(--brand-warning) 14%, transparent)',
                        color: isPaid ? 'var(--brand-success)' : 'var(--brand-warning)',
                      }}
                    >
                      {isPaid ? 'مدفوع' : 'غير مدفوع'}
                    </span>
                  </div>

                  {/* Amounts */}
                  <div className="rounded-lg bg-surface-sunken border border-border p-3 space-y-1.5 mb-3">
                    <div className="flex items-center justify-between text-2xs">
                      <span className="text-fg-muted">قيمة الدين</span>
                      <span className="font-bold text-fg font-num tabular">
                        {formatCurrency(debt.amount)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-2xs">
                      <span className="text-fg-muted">المدفوع</span>
                      <span
                        className="font-bold font-num tabular"
                        style={{ color: 'var(--brand-success)' }}
                      >
                        {formatCurrency(debt.paidAmount)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-2xs">
                      <span className="text-fg-muted">المتبقي</span>
                      <span
                        className="font-extrabold font-num tabular"
                        style={{ color: 'var(--brand-danger)' }}
                      >
                        {formatCurrency(debt.remainingAmount)}
                      </span>
                    </div>
                    {/* Progress */}
                    <div className="h-1 rounded-full bg-black/5 overflow-hidden mt-1">
                      <div
                        className="h-full rounded-full transition-[width] duration-base"
                        style={{
                          width: `${Math.min(100, pct)}%`,
                          background: isPaid ? 'var(--brand-success)' : 'var(--brand-primary)',
                        }}
                      />
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-2xs text-fg-muted">
                      <CalendarToday sx={{ fontSize: 11 }} />
                      {formatDate(debt.date)}
                    </span>
                    <Button size="sm" variant="outline" leftIcon={<Add sx={{ fontSize: 14 }} />}>
                      سداد
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ═══ Add dialog ═══ */}
      <Modal
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="تسجيل دين جديد"
        description="أدخل بيانات الدين"
        maxWidth="md"
      >
        <div className="space-y-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-fg-subtle">نوع الطرف</span>
            <select
              value={form.partyType}
              onChange={(e) => setForm({ ...form, partyType: e.target.value as any })}
              className="h-10 px-3 rounded-md bg-surface-raised border border-border text-sm text-fg outline-none focus:border-[color:var(--brand-primary)] focus:shadow-focus"
            >
              <option value="external">طرف خارجي</option>
              <option value="client">عميل حالي</option>
            </select>
          </label>

          {form.partyType === 'client' ? (
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-fg-subtle">العميل</span>
              <select
                value={form.clientId}
                onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                className="h-10 px-3 rounded-md bg-surface-raised border border-border text-sm text-fg outline-none focus:border-[color:var(--brand-primary)] focus:shadow-focus"
              >
                <option value="">اختر العميل</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <Input
              label="اسم الطرف"
              value={form.partyName}
              onChange={(e) => setForm({ ...form, partyName: e.target.value })}
              placeholder="اسم الشخص أو الشركة"
            />
          )}

          <Input
            label="وصف الدين"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="مثال: توريد مواد"
          />

          <Input
            label="المبلغ"
            type="number"
            inputMode="decimal"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            placeholder="0.00"
            rightIcon={<span className="text-2xs font-semibold">د.ل</span>}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-fg-subtle">تاريخ الدين</span>
              <input
                type="date"
                value={form.date.format('YYYY-MM-DD')}
                onChange={(e) => setForm({ ...form, date: dayjs(e.target.value) })}
                className="h-10 px-3 rounded-md bg-surface-raised border border-border text-sm text-fg outline-none focus:border-[color:var(--brand-primary)] focus:shadow-focus"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-fg-subtle">تاريخ الاستحقاق</span>
              <input
                type="date"
                value={form.dueDate.format('YYYY-MM-DD')}
                onChange={(e) => setForm({ ...form, dueDate: dayjs(e.target.value) })}
                className="h-10 px-3 rounded-md bg-surface-raised border border-border text-sm text-fg outline-none focus:border-[color:var(--brand-primary)] focus:shadow-focus"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-fg-subtle">ملاحظات (اختياري)</span>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="px-3 py-2 rounded-md bg-surface-raised border border-border text-sm text-fg outline-none focus:border-[color:var(--brand-primary)] focus:shadow-focus resize-none"
            />
          </label>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" block onClick={() => setDialogOpen(false)} type="button">
              إلغاء
            </Button>
            <Button
              block
              loading={loading}
              disabled={!form.amount || (form.partyType === 'client' ? !form.clientId : !form.partyName)}
              onClick={handleAdd}
            >
              {loading ? 'جاري الحفظ...' : 'حفظ الدين'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
