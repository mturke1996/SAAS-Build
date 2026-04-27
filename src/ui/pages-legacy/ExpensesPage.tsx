// @ts-nocheck
import { useState, useMemo } from 'react';
import {
  Search,
  Add,
  CalendarToday,
  TrendingDown,
  Person,
  Description,
  AccountBalanceWallet,
  WarningAmber,
} from '@mui/icons-material';
import { useDataStore } from '../../store/useDataStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useMyFundStats } from '../../core/hooks/useMyFundStats';
import {
  formatCurrency,
  formatDate,
  getExpenseCategoryLabel,
  expenseCategories,
} from '../../utils/formatters';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import dayjs from 'dayjs';
import { Button, Input, Modal, PageHero } from '../../design-system/primitives';
import { cn } from '../../design-system/primitives/cn';

// Brand-aligned palette for the pie chart (violet → amber family)
const CHART_COLORS = [
  '#2563EB', // brand primary
  '#8B5CF6',
  '#F59E0B',
  '#E11D48',
  '#0EA5E9',
  '#059669',
  '#A855F7',
  '#F97316',
];

export const ExpensesPage = () => {
  const { expenses, addExpense, clients } = useDataStore();
  const { user } = useAuthStore();
  const myFundStats = useMyFundStats();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    description: '',
    amount: '',
    category: 'materials',
    date: dayjs(),
    invoiceNumber: '',
    notes: '',
    clientId: '',
  });

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return expenses
      .filter(
        (e) =>
          (categoryFilter === 'all' || e.category === categoryFilter) &&
          (e.description.toLowerCase().includes(q) || e.category.toLowerCase().includes(q))
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, searchQuery, categoryFilter]);

  const chartData = useMemo(() => {
    const totals: Record<string, number> = {};
    expenses.forEach((e) => {
      totals[e.category] = (totals[e.category] || 0) + e.amount;
    });
    return Object.entries(totals)
      .map(([key, value]) => ({ name: getExpenseCategoryLabel(key), value }))
      .sort((a, b) => b.value - a.value);
  }, [expenses]);

  const handleAdd = async () => {
    if (!form.amount || !form.description || !form.clientId) return;
    setLoading(true);
    try {
      await addExpense({
        id: crypto.randomUUID(),
        clientId: form.clientId,
        description: form.description,
        amount: parseFloat(form.amount),
        category: form.category as any,
        date: form.date.toISOString(),
        ...(form.invoiceNumber?.trim() ? { invoiceNumber: form.invoiceNumber.trim() } : {}),
        isClosed: false,
        notes: form.notes || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: user?.id || '',
        createdBy: user?.displayName || 'غير معروف',
      });
      setDialogOpen(false);
      setForm({
        description: '',
        amount: '',
        category: 'materials',
        date: dayjs(),
        invoiceNumber: '',
        notes: '',
        clientId: '',
      });
    } finally {
      setLoading(false);
    }
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 pb-8 pt-2 sm:px-6 lg:space-y-5 lg:px-8 lg:pb-10 lg:pt-4">
      <PageHero
        accent="danger"
        eyebrow={
          <span className="flex items-center gap-1 text-inherit">
            <TrendingDown sx={{ fontSize: 14 }} />
            المصروفات
          </span>
        }
        title="إجمالي المصروفات"
        headline={<span dir="ltr">{formatCurrency(totalExpenses)}</span>}
        trailing={
          <button
            type="button"
            onClick={() => {
              setForm((p) => ({ ...p, clientId: clients[0]?.id || '' }));
              setDialogOpen(true);
            }}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-white px-3 text-xs font-bold text-[color:var(--brand-primary)] shadow-sm transition hover:bg-white/92"
          >
            <Add sx={{ fontSize: 16 }} />
            مصروف جديد
          </button>
        }
        footerStats={[
          { label: 'عدد السجلات', value: expenses.length },
          { label: 'عدد الفئات', value: chartData.length },
        ]}
      />

      {/* ═══ Fund banner (if user has custody) ═══ */}
      {myFundStats && <FundBanner stats={myFundStats} />}

      {/* ═══ Pie chart + filters ═══ */}
      <div className="grid lg:grid-cols-5 gap-5">
        {chartData.length > 0 && (
          <div className="lg:col-span-2 bg-surface-panel border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm font-bold text-fg">توزيع المصروفات</div>
                <div className="text-2xs text-fg-muted">حسب التصنيف</div>
              </div>
            </div>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                    cornerRadius={3}
                  >
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    formatter={(v: number) => [formatCurrency(v), 'المبلغ']}
                    contentStyle={{
                      borderRadius: 10,
                      border: '1px solid var(--surface-border)',
                      background: 'var(--surface-panel)',
                      boxShadow: 'var(--shadow-md)',
                      fontWeight: 700,
                      padding: '10px 14px',
                      fontFamily: 'var(--brand-font-arabic)',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {chartData.map((entry, i) => (
                <span
                  key={entry.name}
                  className="inline-flex items-center gap-1 text-2xs font-semibold bg-surface-sunken px-2 h-6 rounded-full border border-border"
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                  />
                  <span className="text-fg-subtle">{entry.name}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ═══ Filters + list ═══ */}
        <div className={chartData.length > 0 ? 'lg:col-span-3 space-y-3' : 'lg:col-span-5 space-y-3'}>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              leftIcon={<Search sx={{ fontSize: 18 }} />}
              placeholder="بحث في المصروفات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-10 px-3 rounded-md bg-surface-raised border border-border text-sm font-semibold text-fg outline-none focus:border-[color:var(--brand-primary)] focus:shadow-focus sm:min-w-[180px]"
            >
              <option value="all">كل التصنيفات</option>
              {Object.entries(expenseCategories).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {filtered.length > 0 && (
            <div className="text-2xs text-fg-muted font-semibold">
              عرض {filtered.length} من {expenses.length} سجل
            </div>
          )}

          <div className="space-y-2">
            {filtered.length === 0 ? (
              <div className="bg-surface-panel border border-border rounded-xl p-10 text-center">
                <div
                  className="mx-auto h-14 w-14 rounded-2xl flex items-center justify-center mb-3"
                  style={{ background: 'color-mix(in srgb, var(--brand-danger) 10%, transparent)', color: 'var(--brand-danger)' }}
                >
                  <TrendingDown sx={{ fontSize: 28 }} />
                </div>
                <div className="text-fg font-semibold">لا توجد مصروفات</div>
                <div className="text-2xs text-fg-muted mt-1">اضغط «مصروف جديد» لإضافة أول مصروف.</div>
              </div>
            ) : (
              filtered.map((exp) => {
                const clientName = clients.find((c) => c.id === exp.clientId)?.name || 'مجهول';
                return (
                  <div
                    key={exp.id}
                    className={cn(
                      'relative bg-surface-panel border border-border rounded-xl p-4',
                      'hover:border-strong hover:shadow-xs transition-all duration-base content-auto'
                    )}
                    style={{
                      borderInlineEndWidth: '3px',
                      borderInlineEndColor: 'var(--brand-danger)',
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <span
                          aria-hidden
                          className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                          style={{
                            background: 'color-mix(in srgb, var(--brand-danger) 10%, transparent)',
                            color: 'var(--brand-danger)',
                          }}
                        >
                          <TrendingDown sx={{ fontSize: 18 }} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-sm text-fg truncate">{exp.description}</div>
                          <div className="flex items-center gap-2 flex-wrap mt-1.5">
                            <span className="inline-flex items-center h-5 px-2 rounded-full bg-surface-sunken text-2xs font-bold text-fg-subtle border border-border">
                              {getExpenseCategoryLabel(exp.category)}
                            </span>
                            <span className="inline-flex items-center gap-1 text-2xs text-fg-muted">
                              <Person sx={{ fontSize: 11 }} /> {clientName}
                            </span>
                            <span className="inline-flex items-center gap-1 text-2xs text-fg-muted">
                              <CalendarToday sx={{ fontSize: 11 }} /> {formatDate(exp.date)}
                            </span>
                          </div>
                          {exp.createdBy && (
                            <div className="text-[0.65rem] text-fg-muted mt-1">بواسطة: {exp.createdBy}</div>
                          )}
                        </div>
                      </div>
                      <div className="text-start shrink-0">
                        <div
                          className="font-extrabold text-base font-num tabular"
                          style={{ color: 'var(--brand-danger)' }}
                        >
                          {formatCurrency(exp.amount)}
                        </div>
                        {exp.invoiceNumber && (
                          <div className="inline-flex items-center gap-1 text-2xs text-fg-muted mt-1">
                            <Description sx={{ fontSize: 11 }} />
                            {exp.invoiceNumber}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ═══ Add expense modal ═══ */}
      <Modal
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="تسجيل مصروف جديد"
        description="أدخل تفاصيل المصروف"
        maxWidth="md"
      >
        <div className="space-y-3">
          <Input
            label="وصف المصروف"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="مثال: شراء مواد بناء"
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
              <span className="text-xs font-medium text-fg-subtle">الفئة</span>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="h-10 px-3 rounded-md bg-surface-raised border border-border text-sm text-fg outline-none focus:border-[color:var(--brand-primary)] focus:shadow-focus"
              >
                {Object.entries(expenseCategories).map(([k, l]) => (
                  <option key={k} value={k}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-fg-subtle">العميل / المشروع</span>
              <select
                value={form.clientId}
                onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                className="h-10 px-3 rounded-md bg-surface-raised border border-border text-sm text-fg outline-none focus:border-[color:var(--brand-primary)] focus:shadow-focus"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-fg-subtle">تاريخ المصروف</span>
            <input
              type="date"
              value={form.date.format('YYYY-MM-DD')}
              onChange={(e) => setForm({ ...form, date: dayjs(e.target.value) })}
              className="h-10 px-3 rounded-md bg-surface-raised border border-border text-sm text-fg outline-none focus:border-[color:var(--brand-primary)] focus:shadow-focus"
            />
          </label>
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
            <Button
              variant="outline"
              block
              onClick={() => setDialogOpen(false)}
              type="button"
            >
              إلغاء
            </Button>
            <Button
              block
              loading={loading}
              disabled={!form.description || !form.amount || !form.clientId}
              onClick={handleAdd}
            >
              {loading ? 'جاري الحفظ...' : 'حفظ المصروف'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// ────────────────────────────────────────────────────────────────────────────
// Fund Banner — brand-aligned version of the custody info card
// ────────────────────────────────────────────────────────────────────────────

function FundBanner({ stats }: { stats: { deposited: number; spent: number; remaining: number } }) {
  const isDeficit = stats.remaining < 0;
  const healthy = stats.remaining > stats.deposited * 0.4;
  const pct = stats.deposited > 0
    ? Math.max(0, Math.min(100, (stats.remaining / stats.deposited) * 100))
    : 0;

  const tone = isDeficit
    ? { color: 'var(--brand-danger)', bg: 'color-mix(in srgb, var(--brand-danger) 10%, transparent)', border: 'color-mix(in srgb, var(--brand-danger) 30%, transparent)' }
    : healthy
    ? { color: 'var(--brand-success)', bg: 'color-mix(in srgb, var(--brand-success) 10%, transparent)', border: 'color-mix(in srgb, var(--brand-success) 30%, transparent)' }
    : { color: 'var(--brand-warning)', bg: 'color-mix(in srgb, var(--brand-warning) 12%, transparent)', border: 'color-mix(in srgb, var(--brand-warning) 30%, transparent)' };

  return (
    <section
      className="rounded-2xl overflow-hidden"
      style={{ background: tone.bg, border: `1.5px solid ${tone.border}` }}
    >
      <div className="flex items-center gap-3 p-4 sm:p-5">
        <div
          className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: tone.color, color: '#fff' }}
        >
          <AccountBalanceWallet sx={{ fontSize: 24 }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-2xs text-fg-muted font-bold tracking-wider">
            {isDeficit ? 'عجز في العهدة' : 'رصيد عهدتك المتاح'}
          </div>
          <div
            className="text-2xl sm:text-3xl font-extrabold font-num tabular leading-none mt-1"
            style={{ color: tone.color }}
            dir="ltr"
          >
            {formatCurrency(stats.remaining)}
          </div>
        </div>
        {isDeficit && <WarningAmber sx={{ fontSize: 26, color: 'var(--brand-danger)' }} />}
      </div>

      <div className="px-4 sm:px-5 pb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-2xs text-fg-muted font-semibold">{Math.round(pct)}% متبقي</span>
          <span className="text-2xs text-fg-muted font-semibold inline-flex flex-wrap items-center gap-1">
            <span>من</span>
            <span className="money-ltr font-num tabular">{formatCurrency(stats.deposited)}</span>
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-surface-sunken overflow-hidden">
          <div
            className="h-full rounded-full transition-[width] duration-base"
            style={{
              width: isDeficit ? '100%' : `${pct}%`,
              background: tone.color,
            }}
          />
        </div>
      </div>

      <div
        className="grid grid-cols-3 border-t"
        style={{ borderColor: 'var(--surface-border)', background: 'rgba(0,0,0,0.02)' }}
      >
        {[
          { label: 'الإجمالي', val: stats.deposited, tone: 'var(--text-primary)' },
          { label: 'المصروف', val: stats.spent, tone: 'var(--brand-danger)' },
          {
            label: 'المتبقي',
            val: stats.remaining,
            tone: stats.remaining >= 0 ? 'var(--brand-success)' : 'var(--brand-danger)',
          },
        ].map((s, i) => (
          <div
            key={i}
            className="py-2.5 text-center"
            style={{
              borderInlineStart: i > 0 ? '1px solid var(--surface-border)' : undefined,
            }}
          >
            <div className="font-extrabold text-sm font-num tabular" style={{ color: s.tone }}>
              {formatCurrency(s.val)}
            </div>
            <div className="text-[0.65rem] text-fg-muted font-semibold">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
