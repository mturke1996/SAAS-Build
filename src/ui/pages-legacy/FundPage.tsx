// @ts-nocheck
import { useState, useMemo, useEffect, useRef } from 'react';
import {
  Box, Button, Typography, Stack, Container,
  IconButton, Dialog, TextField, Avatar, Divider, Collapse, useTheme,
} from '@mui/material';
import {
  Add, AccountBalanceWallet, TrendingDown, Delete, Edit,
  KeyboardArrowDown, KeyboardArrowUp, CalendarToday,
  Notes, Receipt, StorefrontOutlined, FiberManualRecord, Person,
  ArrowBack,
} from '@mui/icons-material';
import { useGlobalFundStore } from '../../store/useGlobalFundStore';
import { useDataStore } from '../../store/useDataStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useAppLockStore } from '../../store/useAppLockStore';
import { formatCurrency, formatCurrencyNumber } from '../../utils/formatters';
import { PageHero } from '../../design-system/primitives/PageHero';
import { Button as DsButton } from '../../design-system/primitives';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import dayjs from 'dayjs';
import 'dayjs/locale/ar';
import toast from 'react-hot-toast';
dayjs.locale('ar');
const fmt = (d: string) => dayjs(d).format('DD/MM/YYYY');
const refNum = (n: number) => `EHD-${String(n).padStart(3, '0')}`;

/** من إعدادات العلامة التجارية (الخط العربي + أرقام/عملة) */
const FONT_AR = 'var(--brand-font-arabic)';
const FONT_NUM = 'var(--brand-font-mono)';

/** رأس الحوار — تدرج مرتبط بـ --brand-primary */
const HEADER =
  'linear-gradient(152deg, color-mix(in srgb, var(--brand-primary) 88%, #1e1b4b) 0%, var(--brand-primary) 48%, #0a0a12 100%)';

export const FundPage = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { user } = useAuthStore();
  const { canAccess } = useAppLockStore();
  const isAdmin = canAccess('stats');

  const { transactions, addTransaction, updateTransaction, deleteTransaction } = useGlobalFundStore();
  const { expenses, clients } = useDataStore();

  const [systemUsers, setSystemUsers] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<any>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [form, setForm] = useState({ userId: '', amount: '', description: '', date: dayjs().format('YYYY-MM-DD'), notes: '' });

  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'users')), s =>
      setSystemUsers(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    return unsub;
  }, []);

  const clientMap = useMemo(() => {
    const m: Record<string, string> = {};
    clients.forEach(c => { m[c.id] = c.name; });
    return m;
  }, [clients]);

  const userMap = useMemo(() => {
    const m: Record<string, string> = {};
    systemUsers.forEach(u => { m[u.uid || u.id] = u.displayName || u.email || 'مستخدم'; });
    return m;
  }, [systemUsers]);

  // ── بناء العهدات ────────────────────────────────────────────────────────────
  const perUser = useMemo(() => {
    const map: Record<string, { name: string; uid: string; custodies: any[] }> = {};
    let globalRef = 1;
    const deposits = [...transactions.filter(t => t.type === 'deposit')]
      .sort((a, b) => dayjs(a.createdAt).diff(dayjs(b.createdAt)));

    deposits.forEach(tx => {
      const uid = tx.userId;
      const name = userMap[uid] || tx.userName || 'مستخدم';
      if (!map[uid]) map[uid] = { name, uid, custodies: [] };
      map[uid].custodies.push({
        id: tx.id, ref: refNum(globalRef++),
        amount: tx.amount, date: tx.date, createdAt: tx.createdAt,
        description: tx.description, notes: tx.notes,
        spent: 0, remaining: tx.amount, expenses: [],
        carryOver: 0, // القيمة المنقولة من العهدة السابقة (سالب)
        _raw: tx,
      });
    });

    // ── ترحيل السالب من العهدة السابقة إلى التالية ──
    // إذا كانت العهدة السابقة سالبة، يتم خصم المبلغ من العهدة التالية
    Object.values(map).forEach(userData => {
      for (let i = 1; i < userData.custodies.length; i++) {
        const prev = userData.custodies[i - 1];
        // سيتم تطبيق الترحيل بعد حساب المصروفات
      }
    });

    const allExp = [...expenses.filter(e => e.userId)]
      .sort((a, b) => dayjs(a.createdAt).diff(dayjs(b.createdAt)));

    allExp.forEach(exp => {
      const uid = exp.userId;
      if (!map[uid]) return;
      let rem = exp.amount;
      const expTime = dayjs(exp.createdAt);
      const userCustodies = map[uid].custodies;

      for (let i = 0; i < userCustodies.length; i++) {
        const c = userCustodies[i];
        if (rem <= 0) break;
        if (expTime.isBefore(dayjs(c.createdAt))) continue;

        // تخطي العهدات التي نفذت وهناك عهدة تالية تستوعب
        if (c.remaining <= 0) {
          // إذا كانت هذه آخر عهدة متاحة (لا عهدة بعدها)، اسمح بالسالب
          const hasNextCustody = userCustodies.slice(i + 1).some(
            nc => !expTime.isBefore(dayjs(nc.createdAt))
          );
          if (hasNextCustody) continue;
        }

        const take = Math.min(rem, Math.max(c.remaining, 0));

        if (take > 0) {
          c.spent += take;
          c.remaining -= take;
          c.expenses.push({ ...exp, usedAmount: take, clientName: exp.clientId ? (clientMap[exp.clientId] || 'عميل') : 'مصروف عام' });
          rem -= take;
        }

        // إذا بقي مبلغ ولم نجد عهدة تالية، ضعه كسالب على آخر عهدة
        if (rem > 0) {
          const hasNextCustody = userCustodies.slice(i + 1).some(
            nc => !expTime.isBefore(dayjs(nc.createdAt))
          );
          if (!hasNextCustody) {
            c.spent += rem;
            c.remaining -= rem;
            c.expenses.push({ ...exp, usedAmount: rem, clientName: exp.clientId ? (clientMap[exp.clientId] || 'عميل') : 'مصروف عام' });
            rem = 0;
          }
        }
      }
    });

    // ── ترحيل الرصيد السالب بين العهدات ──
    // بعد حساب كل المصروفات، إذا كانت عهدة سالبة وهناك عهدة تالية،
    // يتم نقل السالب إلى العهدة التالية
    Object.values(map).forEach(userData => {
      for (let i = 0; i < userData.custodies.length - 1; i++) {
        const current = userData.custodies[i];
        const next = userData.custodies[i + 1];
        if (current.remaining < 0) {
          const deficit = Math.abs(current.remaining);
          next.carryOver = deficit;
          next.remaining -= deficit;
          next.spent += deficit;
          // تصفير السالب في العهدة الحالية لأنه تم ترحيله
          current.remaining = 0;
        }
      }
    });

    return Object.entries(map);
  }, [transactions, expenses, userMap, clientMap]);

  const totalFund = transactions.filter(t => t.type === 'deposit').reduce((s, t) => s + t.amount, 0);
  const totalSpentAll = expenses.filter(e => e.userId).reduce((s, e) => s + e.amount, 0);
  const totalDeposits = transactions.filter(t => t.type === 'deposit').length;

  const totalRemainingAll = useMemo(
    () =>
      perUser.reduce(
        (sum, [, ud]) => sum + ud.custodies.reduce((s: number, c: any) => s + c.remaining, 0),
        0
      ),
    [perUser]
  );

  const handleSave = async () => {
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) { toast.error('أدخل مبلغاً صحيحاً'); return; }
    if (!form.userId) { toast.error('اختر المستخدم'); return; }
    const assignedUser = systemUsers.find(u => (u.uid || u.id) === form.userId);
    const userName = assignedUser?.displayName || 'المستخدم';
    const desc = form.description.trim() || `عهدة ${userName}`;
    try {
      if (editingTx) {
        await updateTransaction(editingTx.id, { amount, userId: form.userId, userName, description: desc, date: form.date, notes: form.notes, updatedAt: new Date().toISOString() });
      } else {
        await addTransaction({ id: crypto.randomUUID(), type: 'deposit', amount, userId: form.userId, userName, description: desc, date: form.date, notes: form.notes || '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: user?.displayName || '' });
      }
      setDialogOpen(false);
    } catch { toast.error('حدث خطأ'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('حذف هذه العهدة نهائياً؟')) return;
    await deleteTransaction(id);
    toast.success('تم الحذف');
  };

  const openAdd = () => {
    setEditingTx(null);
    setForm({ userId: '', amount: '', description: '', date: dayjs().format('YYYY-MM-DD'), notes: '' });
    setDialogOpen(true);
  };

  const openEdit = (c: any) => {
    setEditingTx(c._raw);
    setForm({ userId: c._raw.userId, amount: String(c.amount), description: c.description, date: c.date, notes: c.notes || '' });
    setDialogOpen(true);
  };

  const BG = 'var(--surface-canvas)';
  const CARD = 'var(--surface-panel)';
  const USER_HDR = isDark ? 'var(--surface-panel)' : 'var(--surface-panel)';

  // ── Status ─────────────────────────────────────────────────────────────────
  const getStatus = (remaining: number, amount: number) => {
    if (remaining < 0) return { color: '#dc2626', bg: 'rgba(220,38,38,0.15)', border: 'rgba(220,38,38,0.4)', label: 'متجاوزة' };
    if (remaining === 0) return { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', label: 'منتهية' };
    if (remaining < amount * 0.3) return { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', label: 'منخفضة' };
    return { color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', label: 'نشطة' };
  };

  return (
    <Box
      className="font-arabic antialiased"
      sx={{ minHeight: '100%', bgcolor: BG, pb: 10, pt: { xs: 1, sm: 2 }, fontFamily: FONT_AR }}
    >
      <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, sm: 3 }, mb: 2.5 }}>
        <PageHero
          accent="brand"
          eyebrow={
            <span className="flex items-center gap-1.5 text-inherit">
              <AccountBalanceWallet sx={{ fontSize: 16 }} />
              العهد
            </span>
          }
          title="صندوق العهد"
          subtitle="إيداعات ومصروفات لكل مستخدم — في لوحة واحدة."
          headlineLabel="إجمالي الإيداعات"
          headline={
            <span className="font-num tabular-nums">{formatCurrencyNumber(totalFund)}</span>
          }
          trailing={
            isAdmin ? (
              <DsButton
                type="button"
                size="md"
                className="!bg-white !text-[color:var(--brand-primary)] hover:!bg-white/90 shrink-0 !font-semibold !shadow-lg"
                leftIcon={<Add sx={{ fontSize: 18 }} />}
                onClick={openAdd}
              >
                عهدة جديدة
              </DsButton>
            ) : (
              <div className="h-14 w-14 rounded-2xl bg-white/12 backdrop-blur border border-white/15 flex items-center justify-center shrink-0">
                <AccountBalanceWallet sx={{ fontSize: 28, color: '#fff' }} />
              </div>
            )
          }
          footerStatsTriple={[
            {
              label: 'العهدات',
              value: (
                <span className="text-white font-num tabular-nums">{totalDeposits}</span>
              ),
            },
            {
              label: 'المصروف',
              value: (
                <span className="text-[#FCD34D] font-num tabular-nums">
                  {formatCurrencyNumber(totalSpentAll)}
                </span>
              ),
            },
            {
              label: 'المتبقي',
              value: (
                <span
                  className="font-num tabular-nums"
                  style={{ color: totalRemainingAll < 0 ? '#fca5a5' : '#a7f3d0' }}
                >
                  {totalRemainingAll < 0 && '−'}
                  {formatCurrencyNumber(Math.abs(totalRemainingAll))}
                </span>
              ),
            },
          ]}
        />
      </Box>

      {/* ══ BODY ═════════════════════════════════════════════════════════════ */}
      <Container maxWidth="lg" sx={{ mt: 0 }}>
        {perUser.length === 0 ? (
          <Box
            sx={{
              textAlign: 'center',
              py: 12,
              px: 3,
              maxWidth: 440,
              mx: 'auto',
              borderRadius: 3,
              border: '1px solid',
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(109,40,217,0.12)',
              bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.65)',
              boxShadow: isDark ? 'none' : 'var(--shadow-md)',
            }}
          >
            <AccountBalanceWallet
              sx={{
                fontSize: 56,
                color: 'var(--brand-primary)',
                opacity: isDark ? 0.35 : 0.45,
                mb: 2,
              }}
            />
            <Typography sx={{ color: 'text.primary', fontWeight: 800, fontSize: '1.05rem', fontFamily: FONT_AR, mb: 0.5 }}>
              لا توجد عهدات بعد
            </Typography>
            <Typography sx={{ color: 'text.secondary', fontWeight: 500, fontSize: '0.85rem', fontFamily: FONT_AR, lineHeight: 1.6, mb: 2 }}>
              ابدأ بإضافة عهدة لمستخدم لربط المصروفات بالرصيد تلقائياً.
            </Typography>
            {isAdmin && (
              <Button
                onClick={openAdd}
                variant="contained"
                startIcon={<Add />}
                sx={{
                  mt: 1,
                  fontFamily: FONT_AR,
                  borderRadius: 2,
                  fontWeight: 800,
                  px: 3,
                  py: 1,
                  boxShadow: 'var(--shadow-brand)',
                }}
              >
                إضافة أول عهدة
              </Button>
            )}
          </Box>
        ) : (
          <Stack spacing={2} ref={bodyRef}>
            {perUser.map(([uid, userData]) => (
              <Box key={uid} className="fund-user-card">
                {/* User Title - Premium Card Look */}
                <Box
                  sx={{
                    bgcolor: USER_HDR,
                    borderRadius: '20px 20px 0 0',
                    px: 2.5,
                    py: 2.25,
                    border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid var(--surface-border)',
                    borderBottom: 'none',
                  }}
                >
                  <Stack direction="row" alignItems="center" sx={{ gap: 2 }}>
                    <Box sx={{
                      width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                      background: isDark ? 'linear-gradient(135deg, rgba(122,154,122,0.2) 0%, rgba(122,154,122,0.05) 100%)' : 'linear-gradient(135deg, rgba(74,93,74,0.15) 0%, rgba(74,93,74,0.05) 100%)',
                      border: isDark ? '1px solid rgba(122,154,122,0.3)' : '1px solid rgba(74,93,74,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Person sx={{ fontSize: 24, color: isDark ? '#93C5FD' : '#2563EB' }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ color: isDark ? '#fff' : '#1a1f1a', fontWeight: 800, fontSize: '1rem', fontFamily: FONT_AR, lineHeight: 1.2 }}>
                        {userData.name}
                      </Typography>
                      <Typography sx={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', fontSize: '0.68rem', fontFamily: FONT_AR, mt: 0.2 }}>
                        {userData.custodies.length} عهدة مسجلة
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'left' }}>
                      {(() => {
                        const userRemaining = userData.custodies.reduce((s: number, c: any) => s + c.remaining, 0);
                        const isNeg = userRemaining < 0;
                        return (
                          <>
                            <Typography sx={{ color: isNeg ? '#e11d48' : (isDark ? '#34d399' : '#059669'), fontWeight: 900, fontSize: '1.05rem', fontFamily: FONT_NUM, lineHeight: 1 }} component="span" dir="ltr">
                              {formatCurrency(userRemaining)}
                            </Typography>
                            <Typography sx={{ color: isNeg ? 'rgba(225,29,72,0.7)' : (isDark ? 'rgba(52,211,153,0.7)' : 'rgba(5,150,105,0.7)'), fontSize: '0.65rem', fontFamily: FONT_AR, mt: 0.3, fontWeight: 600 }}>
                              {isNeg ? 'عجز الرصيد' : 'متبقي متاح'}
                            </Typography>
                          </>
                        );
                      })()}
                    </Box>
                  </Stack>
                </Box>
                
                {/* Custodies List */}
                <Box
                  sx={{
                    bgcolor: CARD,
                    borderRadius: '0 0 20px 20px',
                    overflow: 'hidden',
                    border: '1px solid',
                    borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'var(--surface-border)',
                    borderTop: isDark ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(0,0,0,0.04)',
                    boxShadow: isDark ? '0 12px 40px rgba(0,0,0,0.45)' : 'var(--shadow-lg)',
                  }}
                >
                  {[...userData.custodies].reverse().map((c, ci, arr) => {
                    const st = getStatus(c.remaining, c.amount);
                    const pct = c.amount > 0 ? Math.min(100, (Math.max(c.spent, 0) / c.amount) * 100) : 0;
                    const isOverflow = c.remaining < 0;
                    const effectiveAmount = c.amount + (c.carryOver || 0);
                    const isOpen = openId === c.id;

                    return (
                      <Box key={c.id} sx={{ borderBottom: ci < arr.length - 1 ? '1px solid' : 'none', borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)' }}>

                        {/* ── Custody Row (clickable to toggle) ── */}
                        <Box onClick={() => setOpenId(isOpen ? null : c.id)}
                          sx={{ px: 2, py: 2, cursor: 'pointer', '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)' }, '&:active': { bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }, transition: 'background 0.2s cubic-bezier(0.4,0,0.2,1)', WebkitTapHighlightColor: 'transparent' }}>

                          {/* Row 1: Ref Badge + Status Badge + Date (right-aligned) */}
                          <Stack direction="row" alignItems="center" spacing={1} mb={0.8}>
                            <Box sx={{
                              bgcolor: st.bg, border: `1px solid ${st.border}`,
                              borderRadius: 0.75, px: 1, py: 0.25, flexShrink: 0,
                            }}>
                              <Typography sx={{ color: st.color, fontSize: '0.62rem', fontWeight: 900, fontFamily: FONT_NUM, letterSpacing: 0.8 }}>
                                {c.ref}
                              </Typography>
                            </Box>
                            <Stack direction="row" alignItems="center" spacing={0.4} sx={{
                              bgcolor: st.bg, border: `1px solid ${st.border}`,
                              borderRadius: 0.75, px: 0.8, py: 0.25, flexShrink: 0,
                            }}>
                              <FiberManualRecord sx={{ fontSize: 7, color: st.color }} />
                              <Typography sx={{ fontSize: '0.58rem', color: st.color, fontWeight: 800, fontFamily: FONT_AR }}>
                                {st.label}
                              </Typography>
                            </Stack>
                            <Box sx={{ flex: 1 }} />
                            <Stack direction="row" alignItems="center" spacing={0.4}>
                              <CalendarToday sx={{ fontSize: 11, color: 'text.disabled' }} />
                              <Typography sx={{ fontSize: '0.63rem', color: 'text.disabled', fontFamily: FONT_AR }}>
                                {fmt(c.date)}
                              </Typography>
                            </Stack>
                          </Stack>

                          {/* Row 2: Description */}
                          <Typography sx={{
                            fontWeight: 800, fontSize: '0.9rem', fontFamily: FONT_AR, mb: 0.6,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            {c.description}
                          </Typography>

                          {/* Row 3: Notes (if any) */}
                          {c.notes && (
                            <Stack direction="row" alignItems="center" spacing={0.5} mb={0.8}>
                              <Notes sx={{ fontSize: 12, color: 'text.disabled', flexShrink: 0 }} />
                              <Typography sx={{ fontSize: '0.64rem', color: 'text.disabled', fontFamily: FONT_AR, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {c.notes}
                              </Typography>
                            </Stack>
                          )}

                          {/* Carry-over badge */}
                          {c.carryOver > 0 && (
                            <Box sx={{
                              display: 'flex', alignItems: 'center', gap: 0.7,
                              bgcolor: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.25)',
                              borderRadius: 1, px: 1.2, py: 0.4, mb: 1, width: 'fit-content',
                            }}>
                              <Typography sx={{ fontSize: '0.6rem', color: '#dc2626', fontWeight: 800, fontFamily: FONT_AR }} component="span" dir="ltr">
                                ⚠ مرحّل من العهدة السابقة: {formatCurrency(c.carryOver)}
                              </Typography>
                            </Box>
                          )}

                          {/* Progress Bar */}
                          <Box sx={{ height: 4, bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', borderRadius: 3, overflow: 'hidden', mb: 1.4 }}>
                            <Box sx={{
                              height: '100%', width: `${pct}%`, borderRadius: 3,
                              background: c.remaining < 0
                                ? 'linear-gradient(90deg, #dc2626, #ef4444)'
                                : c.remaining === 0
                                  ? 'linear-gradient(90deg, #ef4444, #f87171)'
                                  : pct > 70
                                    ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                                    : 'linear-gradient(90deg, #059669, #10b981, #34d399)',
                              transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)',
                              boxShadow: pct > 0 ? '0 1px 4px rgba(0,0,0,0.15)' : 'none',
                            }} />
                          </Box>

                            <Stack direction="row" alignItems="center" justifyContent="space-between">
                              {/* 3 amounts - equal grid columns so they never overlap */}
                              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1.5, flex: 1 }}>
                                <Box>
                                  <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: '#6ee7b7', fontFamily: FONT_NUM, lineHeight: 1 }} noWrap>
                                    {formatCurrency(c.amount)}
                                  </Typography>
                                  <Typography sx={{ fontSize: '0.54rem', color: 'text.disabled', fontFamily: FONT_AR }}>العهدة</Typography>
                                </Box>
                                <Box>
                                  <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: '#fca5a5', fontFamily: FONT_NUM, lineHeight: 1 }} noWrap>
                                    {formatCurrency(c.spent)}
                                  </Typography>
                                  <Typography sx={{ fontSize: '0.54rem', color: 'text.disabled', fontFamily: FONT_AR }}>المصروف</Typography>
                                </Box>
                                <Box>
                                  <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: c.remaining < 0 ? '#dc2626' : st.color, fontFamily: FONT_NUM, lineHeight: 1 }} noWrap component="span" dir="ltr">
                                    {formatCurrency(c.remaining)}
                                  </Typography>
                                  <Typography sx={{ fontSize: '0.54rem', color: c.remaining < 0 ? '#dc2626' : 'text.disabled', fontFamily: FONT_AR }}>
                                    {c.remaining < 0 ? 'عجز' : 'المتبقي'}
                                  </Typography>
                                </Box>
                              </Box>

                              <Stack direction="row" alignItems="center" spacing={0.5}>
                                {/* Expense count badge */}
                                {c.expenses.length > 0 && (
                                  <Box sx={{
                                    px: 0.9, py: 0.2, borderRadius: 1,
                                    bgcolor: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)',
                                  }}>
                                    <Typography sx={{ fontSize: '0.58rem', fontWeight: 800, color: '#10b981', fontFamily: FONT_NUM }}>
                                      {c.expenses.length} سجل
                                    </Typography>
                                  </Box>
                                )}
                                {/* Chevron */}
                                {isOpen
                                  ? <KeyboardArrowUp sx={{ fontSize: 18, color: 'text.disabled' }} />
                                  : <KeyboardArrowDown sx={{ fontSize: 18, color: 'text.disabled' }} />
                                }
                                {isAdmin && (
                                  <>
                                    <IconButton size="small"
                                      onClick={(e) => { e.stopPropagation(); openEdit(c); }}
                                      sx={{ p: 0.6, color: 'text.disabled', '&:hover': { color: '#10b981' } }}>
                                      <Edit sx={{ fontSize: 15 }} />
                                    </IconButton>
                                    <IconButton size="small"
                                      onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }}
                                      sx={{ p: 0.6, color: 'text.disabled', '&:hover': { color: '#ef4444' } }}>
                                      <Delete sx={{ fontSize: 15 }} />
                                    </IconButton>
                                  </>
                                )}
                              </Stack>
                            </Stack>
                        </Box>

                        {/* ── Expenses Collapse ── */}
                        <Collapse in={isOpen}>
                          <Box sx={{ bgcolor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)', borderTop: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>

                            {/* Header */}
                            <Box sx={{ px: 2, py: 1, bgcolor: isDark ? 'rgba(16,185,129,0.07)' : 'rgba(16,185,129,0.05)' }}>
                              <Typography sx={{ fontSize: '0.62rem', fontWeight: 800, color: '#10b981', letterSpacing: 0.8, fontFamily: FONT_AR }}>
                                سجل مصروفات {c.ref} — {c.expenses.length} عملية
                              </Typography>
                            </Box>

                            {c.expenses.length === 0 ? (
                              <Box sx={{ py: 3, textAlign: 'center' }}>
                                <TrendingDown sx={{ fontSize: 32, color: 'text.disabled', opacity: 0.25, mb: 0.5 }} />
                                <Typography sx={{ color: 'text.disabled', fontSize: '0.75rem', fontFamily: FONT_AR }}>
                                  لا توجد مصروفات من هذه العهدة
                                </Typography>
                              </Box>
                            ) : (
                              <Box>
                                {c.expenses.map((exp: any, ei: number) => (
                                  <Box key={exp.id || ei} sx={{
                                    px: 2.5, py: 1.8,
                                    borderBottom: ei < c.expenses.length - 1 ? '1px solid' : 'none',
                                    borderColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)',
                                  }}>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.8 }}>
                                      {/* Icon box */}
                                      <Box sx={{
                                        width: 40, height: 40, flexShrink: 0, mt: 0.2,
                                        bgcolor: 'rgba(239,68,68,0.09)', border: '1px solid rgba(239,68,68,0.2)',
                                        borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      }}>
                                        <StorefrontOutlined sx={{ fontSize: 20, color: '#ef4444' }} />
                                      </Box>

                                      {/* Content */}
                                      <Box sx={{ flex: 1, minWidth: 0 }}>
                                        {/* Title */}
                                        <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', fontFamily: FONT_AR, mb: 0.6, lineHeight: 1.3 }}>
                                          {exp.description}
                                        </Typography>

                                        {/* Client row */}
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7, mb: 0.5 }}>
                                          <Person sx={{ fontSize: 13, color: '#10b981', flexShrink: 0 }} />
                                          <Typography sx={{ fontSize: '0.68rem', color: '#10b981', fontWeight: 700, fontFamily: FONT_AR }}>
                                            {exp.clientName}
                                          </Typography>
                                        </Box>

                                        {/* Date row */}
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7, mb: 0.4 }}>
                                          <CalendarToday sx={{ fontSize: 12, color: 'text.disabled', flexShrink: 0 }} />
                                          <Typography sx={{ fontSize: '0.65rem', color: 'text.disabled', fontFamily: FONT_AR }}>
                                            {fmt(exp.date)}
                                          </Typography>
                                          {exp.category && (
                                            <>
                                              <Typography sx={{ fontSize: '0.6rem', color: 'text.disabled' }}>•</Typography>
                                              <Typography sx={{ fontSize: '0.62rem', color: 'text.disabled', fontFamily: FONT_AR, fontWeight: 600 }}>
                                                {exp.category}
                                              </Typography>
                                            </>
                                          )}
                                        </Box>

                                        {/* Notes row */}
                                        {exp.notes && (
                                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.7, mt: 0.4 }}>
                                            <Notes sx={{ fontSize: 13, color: 'text.disabled', flexShrink: 0, mt: 0.15 }} />
                                            <Typography sx={{ fontSize: '0.64rem', color: 'text.disabled', fontFamily: FONT_AR, lineHeight: 1.5 }}>
                                              {exp.notes}
                                            </Typography>
                                          </Box>
                                        )}

                                        {/* Partial badge */}
                                        {exp.usedAmount < exp.amount && (
                                          <Box sx={{ mt: 0.8, display: 'flex', alignItems: 'center', gap: 0.7, bgcolor: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 1, px: 1, py: 0.4, width: 'fit-content' }}>
                                            <Typography sx={{ fontSize: '0.62rem', color: '#f59e0b', fontWeight: 800, fontFamily: FONT_AR }}>
                                              ⚡ جزئي — الكامل: {formatCurrency(exp.amount)}
                                            </Typography>
                                          </Box>
                                        )}
                                      </Box>

                                      {/* Amount column */}
                                      <Box sx={{ textAlign: 'left', flexShrink: 0, pt: 0.2 }}>
                                        <Typography sx={{ color: '#ef4444', fontWeight: 900, fontSize: '0.95rem', fontFamily: FONT_NUM, lineHeight: 1 }} component="span" dir="ltr">
                                          {formatCurrency(-exp.usedAmount)}
                                        </Typography>
                                        <Typography sx={{ fontSize: '0.56rem', color: 'text.disabled', fontFamily: FONT_AR, mt: 0.4 }}>
                                          دينار
                                        </Typography>
                                      </Box>
                                    </Box>
                                  </Box>
                                ))}
                                {/* Total footer */}
                                <Box sx={{ px: 2.5, py: 1.4, bgcolor: isDark ? 'rgba(239,68,68,0.08)' : 'rgba(239,68,68,0.04)', borderTop: '2px solid', borderColor: isDark ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.1)' }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <TrendingDown sx={{ fontSize: 16, color: '#ef4444' }} />
                                      <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: 'text.secondary', fontFamily: FONT_AR }}>
                                        إجمالي المصروف من {c.ref}
                                      </Typography>
                                    </Box>
                                    <Typography sx={{ fontSize: '0.95rem', fontWeight: 900, color: '#ef4444', fontFamily: FONT_NUM }}>
                                      {formatCurrency(c.spent)}
                                    </Typography>
                                  </Box>
                                </Box>
                              </Box>
                            )}
                          </Box>
                        </Collapse>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            ))}
          </Stack>
        )}
      </Container>

      {/* ══ ADD/EDIT DIALOG ══════════════════════════════════════════════════ */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullScreen
        PaperProps={{ sx: { bgcolor: isDark ? '#0a0e14' : '#f0f2f5', fontFamily: FONT_AR } }}>

        {/* Dialog Header */}
        <Box sx={{ background: HEADER, pt: 3.5, pb: 4.5, px: 2.5, position: 'relative', overflow: 'hidden', '&::after': { content: '""', position: 'absolute', top: '-40%', right: '-20%', width: '60%', height: '160%', background: 'radial-gradient(ellipse, rgba(139,92,246,0.1) 0%, transparent 60%)', pointerEvents: 'none' } }}>
          <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
            <IconButton onClick={() => setDialogOpen(false)}
              sx={{ color: '#fff', bgcolor: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 2, p: 1, '&:active': { transform: 'scale(0.95)' }, transition: 'transform 0.15s' }}>
              <ArrowBack fontSize="small" />
            </IconButton>
            <Box>
              <Typography sx={{ color: '#fff', fontWeight: 900, fontSize: '1.05rem', fontFamily: FONT_AR }}>
                {editingTx ? 'تعديل العهدة' : 'عهدة جديدة'}
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem', fontFamily: FONT_AR }}>
                {editingTx ? 'تعديل بيانات العهدة' : 'منح رصيد جديد للمستخدم'}
              </Typography>
            </Box>
          </Stack>
          {/* Amount preview */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.6rem', letterSpacing: 1.5, fontWeight: 700, mb: 0.5, fontFamily: FONT_AR }}>
              مبلغ العهدة
            </Typography>
            <Typography sx={{ color: form.amount ? '#fff' : 'rgba(255,255,255,0.2)', fontSize: '2.8rem', fontWeight: 900, lineHeight: 1, fontFamily: FONT_NUM }}>
              {form.amount ? parseFloat(form.amount).toLocaleString('ar-LY') : '—'}
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.72rem', fontFamily: FONT_AR, mt: 0.3 }}>دينار ليبي</Typography>
          </Box>
        </Box>

        {/* Dialog Body */}
        <Box sx={{ flex: 1, overflowY: 'auto', px: 2.5, pt: 3, pb: 2 }}>

          {/* Select User */}
          <Typography sx={{ fontSize: '0.6rem', fontWeight: 800, color: 'text.disabled', letterSpacing: 2, mb: 1.5, fontFamily: FONT_AR }}>
            ١ — اختر المستخدم
          </Typography>
          <Stack spacing={1} mb={3}>
            {systemUsers.map(u => {
              const uid = u.uid || u.id;
              const sel = form.userId === uid;
              return (
                <Box key={uid} onClick={() => setForm(f => ({ ...f, userId: uid }))}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 1.8,
                    p: 1.6, cursor: 'pointer', borderRadius: 1.5,
                    bgcolor: sel ? (isDark ? 'rgba(16,185,129,0.12)' : 'rgba(16,185,129,0.07)') : (isDark ? 'rgba(255,255,255,0.03)' : '#fff'),
                    border: `2px solid ${sel ? '#10b981' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)')}`,
                    transition: 'all 0.15s',
                  }}>
                  <Avatar sx={{ width: 42, height: 42, bgcolor: sel ? '#10b981' : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'), fontWeight: 900, fontSize: '0.95rem', fontFamily: FONT_AR, color: sel ? '#fff' : 'text.secondary' }}>
                    {(u.displayName || 'U').charAt(0)}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontWeight: 800, color: sel ? '#10b981' : 'text.primary', fontFamily: FONT_AR, fontSize: '0.9rem' }}>
                      {u.displayName || u.email}
                    </Typography>
                    <Typography sx={{ fontSize: '0.62rem', color: 'text.disabled', fontFamily: FONT_AR }}>
                      {u.email || u.role || 'مستخدم'}
                    </Typography>
                  </Box>
                  <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: sel ? '#10b981' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {sel && <Typography sx={{ color: '#fff', fontSize: '0.75rem', lineHeight: 1 }}>✓</Typography>}
                  </Box>
                </Box>
              );
            })}
          </Stack>

          <Divider sx={{ mb: 3 }} />

          {/* Amount Input */}
          <Typography sx={{ fontSize: '0.6rem', fontWeight: 800, color: 'text.disabled', letterSpacing: 2, mb: 1.5, fontFamily: FONT_AR }}>
            ٢ — المبلغ
          </Typography>
          <Box sx={{
            border: `2px solid ${form.amount ? '#10b981' : (isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.1)')}`,
            borderRadius: 1.5, bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#fff', mb: 1.5, transition: 'border-color 0.2s',
          }}>
            <Stack direction="row" alignItems="center" sx={{ px: 2, py: 1.5, gap: 1.5 }}>
              <AccountBalanceWallet sx={{ color: '#10b981', fontSize: 22, flexShrink: 0 }} />
              <input
                type="number" value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                placeholder="0.00"
                style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: '1.6rem', fontWeight: 900, color: isDark ? '#fff' : '#0d1117', fontFamily: 'var(--brand-font-mono)', direction: 'rtl' }}
              />
              <Typography sx={{ color: 'text.disabled', fontWeight: 700, fontFamily: FONT_AR, flexShrink: 0 }}>د.ل</Typography>
            </Stack>
          </Box>
          {/* Quick amounts grid */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 3 }}>
            {[
              { amount: 10000, label: '10 آلاف' },
              { amount: 20000, label: '20 ألف' },
              { amount: 30000, label: '30 ألف' },
              { amount: 50000, label: '50 ألف' },
            ].map(({ amount: a, label }) => (
              <Box key={a} onClick={() => setForm(f => ({ ...f, amount: String(a) }))}
                sx={{
                  px: 2, py: 1.4, borderRadius: 1.5, cursor: 'pointer',
                  border: `1.5px solid ${form.amount === String(a) ? '#10b981' : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.09)')}`,
                  bgcolor: form.amount === String(a) ? '#10b981' : (isDark ? 'rgba(255,255,255,0.03)' : '#fff'),
                  textAlign: 'center', transition: 'all 0.18s',
                  boxShadow: form.amount === String(a) ? '0 4px 14px rgba(16,185,129,0.3)' : 'none',
                }}>
                <Typography sx={{ fontSize: '1rem', fontWeight: 900, color: form.amount === String(a) ? '#fff' : 'text.primary', fontFamily: FONT_NUM, lineHeight: 1 }}>
                  {(a / 1000).toLocaleString()}k
                </Typography>
                <Typography sx={{ fontSize: '0.6rem', color: form.amount === String(a) ? 'rgba(255,255,255,0.75)' : 'text.disabled', fontWeight: 600, fontFamily: FONT_AR, mt: 0.3 }}>
                  {label} دينار
                </Typography>
              </Box>
            ))}
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Details */}
          <Typography sx={{ fontSize: '0.6rem', fontWeight: 800, color: 'text.disabled', letterSpacing: 2, mb: 1.5, fontFamily: FONT_AR }}>
            ٣ — التفاصيل
          </Typography>
          <Stack spacing={2}>
            <TextField label="وصف العهدة" value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))} fullWidth
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#fff', fontFamily: FONT_AR } }}
              InputLabelProps={{ sx: { fontFamily: FONT_AR } }} inputProps={{ style: { fontFamily: FONT_AR } }} />
            <TextField label="التاريخ" type="date" value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))} fullWidth
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#fff' } }}
              InputLabelProps={{ shrink: true, sx: { fontFamily: FONT_AR } }} />
            <TextField label="ملاحظات (اختياري)" value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} fullWidth multiline rows={2}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#fff', fontFamily: FONT_AR } }}
              InputLabelProps={{ sx: { fontFamily: FONT_AR } }} inputProps={{ style: { fontFamily: FONT_AR } }} />
          </Stack>
        </Box>

        {/* Dialog Footer */}
        <Box sx={{ px: 2.5, py: 2, pb: 'calc(env(safe-area-inset-bottom, 8px) + 16px)', bgcolor: isDark ? '#0a0e14' : '#e8eaed', borderTop: '1px solid', borderColor: 'divider' }}>
          {form.userId && form.amount && (
            <Box sx={{ mb: 1.5, px: 1.8, py: 1, borderRadius: 1.5, bgcolor: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.15)' }}>
              <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: '#10b981', mb: 0.2, fontFamily: FONT_AR }}>ملخص</Typography>
              <Typography sx={{ fontWeight: 800, fontSize: '0.85rem', fontFamily: FONT_AR }}>
                {systemUsers.find(u => (u.uid || u.id) === form.userId)?.displayName} — {parseFloat(form.amount || '0').toLocaleString('ar-LY')} د.ل
              </Typography>
            </Box>
          )}
          <Stack direction="row" spacing={1.5}>
            <Button onClick={() => setDialogOpen(false)} fullWidth size="large"
              sx={{ borderRadius: 1.5, fontWeight: 700, fontFamily: FONT_AR, border: '1px solid', borderColor: 'divider', bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#fff' }}>
              إلغاء
            </Button>
            <Button onClick={handleSave} variant="contained" fullWidth size="large"
              disabled={!form.userId || !form.amount}
              sx={{ borderRadius: 2, fontWeight: 900, fontFamily: FONT_AR, bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' }, '&:active': { transform: 'scale(0.98)' }, boxShadow: '0 6px 24px rgba(16,185,129,0.4)', transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)', '&:disabled': { bgcolor: 'rgba(16,185,129,0.2)', color: 'rgba(255,255,255,0.4)', boxShadow: 'none' } }}>
              {editingTx ? 'حفظ التعديلات' : 'إضافة العهدة'}
            </Button>
          </Stack>
        </Box>
      </Dialog>
    </Box>
  );
};
