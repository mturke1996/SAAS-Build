// @ts-nocheck
import { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  TextField,
  InputAdornment,
  Container,
  Stack,
  useTheme,
  Dialog,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  IconButton,
  Chip,
  Divider,
} from '@mui/material';
import {
  Add,
  Search,
  AttachMoney,
  CalendarToday,
  ArrowBack,
  TrendingDown,
  Person,
  Description,
  AccountBalanceWallet,
  Close,
  NoteAlt,
  BusinessCenter,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useDataStore } from '../../store/useDataStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useGlobalFundStore } from '../../store/useGlobalFundStore';
import { formatCurrency, formatDate, getExpenseCategoryLabel, expenseCategories } from '../../utils/formatters';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';
import dayjs from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import 'dayjs/locale/ar';

export const ExpensesPage = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const navigate = useNavigate();
  const { expenses, addExpense, clients } = useDataStore();
  const { user } = useAuthStore();
  const { transactions, getUserStats, initialize: initFund } = useGlobalFundStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Init global fund store
  useEffect(() => { const u = initFund(); return u; }, []);

  const [expenseForm, setExpenseForm] = useState({
    description: '',
    amount: '',
    category: 'materials',
    date: dayjs(),
    invoiceNumber: '',
    notes: '',
    clientId: '',
  });

  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp =>
      (categoryFilter === 'all' || exp.category === categoryFilter) &&
      (exp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.category.toLowerCase().includes(searchQuery.toLowerCase()))
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, searchQuery, categoryFilter]);

  const chartData = useMemo(() => {
    const categoryTotals: Record<string, number> = {};
    expenses.forEach(exp => {
      categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
    });
    return Object.entries(categoryTotals).map(([key, value]) => ({
      name: getExpenseCategoryLabel(key),
      value,
    })).sort((a, b) => b.value - a.value);
  }, [expenses]);

  const COLORS = ['#4a5d4a', '#d64545', '#e6a817', '#3b82f6', '#8b7e6a', '#0d9668', '#6b7f6b', '#a0524a'];

  // ─── رصيد عهدة المستخدم (نفس خوارزمية FundPage بالضبط) ─────────────────
  const myFundStats = useMemo(() => {
    if (!user) return null;
    const uid = user.id;
    const userName = user.displayName || '';

    const deposits = [...transactions.filter(t =>
      t.type === 'deposit' && (
        (uid && t.userId === uid) ||
        (userName && t.userName === userName)
      )
    )].sort((a, b) => dayjs(a.createdAt).diff(dayjs(b.createdAt)));

    if (deposits.length === 0) {
      const storeStats = uid ? getUserStats(uid) : null;
      if (storeStats && storeStats.deposited > 0) {
        return { deposited: storeStats.deposited, spent: storeStats.withdrawn, remaining: storeStats.remaining };
      }
      return null;
    }

    const custodies = deposits.map(tx => ({
      createdAt: tx.createdAt, amount: tx.amount, remaining: tx.amount, spent: 0,
    }));

    const allExp = [...expenses.filter(e =>
      (uid && e.userId === uid) || (userName && e.createdBy === userName)
    )].sort((a, b) => dayjs(a.createdAt).diff(dayjs(b.createdAt)));

    allExp.forEach(exp => {
      let rem = exp.amount;
      const expTime = dayjs(exp.createdAt);
      for (let i = 0; i < custodies.length; i++) {
        const c = custodies[i];
        if (rem <= 0) break;
        if (expTime.isBefore(dayjs(c.createdAt))) continue;
        if (c.remaining <= 0) {
          const hasNext = custodies.slice(i + 1).some(nc => !expTime.isBefore(dayjs(nc.createdAt)));
          if (hasNext) continue;
        }
        const take = Math.min(rem, Math.max(c.remaining, 0));
        if (take > 0) { c.spent += take; c.remaining -= take; rem -= take; }
        if (rem > 0) {
          const hasNext = custodies.slice(i + 1).some(nc => !expTime.isBefore(dayjs(nc.createdAt)));
          if (!hasNext) { c.spent += rem; c.remaining -= rem; rem = 0; }
        }
      }
    });

    for (let i = 0; i < custodies.length - 1; i++) {
      if (custodies[i].remaining < 0) {
        const deficit = Math.abs(custodies[i].remaining);
        custodies[i + 1].remaining -= deficit;
        custodies[i + 1].spent += deficit;
        custodies[i].remaining = 0;
      }
    }

    const totalDeposited = custodies.reduce((s, c) => s + c.amount, 0);
    const totalSpent = custodies.reduce((s, c) => s + c.spent, 0);
    const totalRemaining = custodies.reduce((s, c) => s + c.remaining, 0);
    return { deposited: totalDeposited, spent: totalSpent, remaining: totalRemaining };
  }, [transactions, expenses, user, getUserStats]);

  const handleAddExpense = async () => {
    if (!expenseForm.amount || !expenseForm.description || !expenseForm.clientId) return;
    setLoading(true);
    try {
      await addExpense({
        id: crypto.randomUUID(),
        clientId: expenseForm.clientId,
        description: expenseForm.description,
        amount: parseFloat(expenseForm.amount),
        category: expenseForm.category as any,
        date: expenseForm.date.toISOString(),
        invoiceNumber: expenseForm.invoiceNumber || undefined,
        isClosed: false,
        notes: expenseForm.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: user?.id || '',    // user.id = Firebase Auth UID ✅
        createdBy: user?.displayName || 'غير معروف',
      });
      setDialogOpen(false);
      setExpenseForm({ description: '', amount: '', category: 'materials', date: dayjs(), invoiceNumber: '', notes: '', clientId: '' });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const headerGradient = isDark
    ? 'linear-gradient(160deg, #1a221a 0%, #2a3a2a 100%)'
    : 'linear-gradient(160deg, #2a3a2a 0%, #364036 60%, #4a5d4a 100%)';

  return (
    <Box sx={{ minHeight: '100dvh', background: isDark ? '#161b16' : '#f5f3ef', pb: 10 }}>

      {/* ── Header ── */}
      <Box sx={{ background: headerGradient, pt: 'calc(env(safe-area-inset-top) + 24px)', pb: 5, px: 2, position: 'relative', overflow: 'hidden' }}>
        {/* Decorative glow */}
        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(ellipse at 80% 0%, rgba(200,192,176,0.1) 0%, transparent 55%)', pointerEvents: 'none' }} />

        <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
          {/* Nav row */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <IconButton
                onClick={() => navigate('/')}
                sx={{ color: 'rgba(255,255,255,0.85)', bgcolor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.15)', color: 'white' } }}
              >
                <ArrowBack />
              </IconButton>
              <Box>
                <Typography variant="h5" fontWeight={900} sx={{ color: 'white', lineHeight: 1.1 }}>المصروفات العامة</Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>{expenses.length} سجل مصروف</Typography>
              </Box>
            </Stack>
            <Button
              variant="contained"
              startIcon={<Add sx={{ ml: 1 }} />}
              onClick={() => {
                setExpenseForm(prev => ({ ...prev, clientId: clients.length > 0 ? clients[0].id : '' }));
                setDialogOpen(true);
              }}
              sx={{
                bgcolor: 'rgba(200,192,176,0.9)',
                color: '#ffffffff',
                fontWeight: 800,
                px: 2.5,
                py: 1.1,
                borderRadius: 2,
                boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                '&:hover': { bgcolor: '#d4cabb', transform: 'translateY(-2px)', boxShadow: '0 6px 20px rgba(0,0,0,0.25)' },
                transition: 'all 0.22s ease',
              }}
            >
              مصروف جديد
            </Button>
          </Stack>

          {/* Stats cards */}
          <Stack spacing={1.5}>
            {/* ─── Fund Balance Banner (Premium) ─── */}
            {myFundStats ? (
              <Box sx={{
                borderRadius: 3, overflow: 'hidden',
                background: myFundStats.remaining < 0 
                  ? 'linear-gradient(135deg, rgba(225,29,72,0.18) 0%, rgba(225,29,72,0.06) 100%)'
                  : myFundStats.remaining > myFundStats.deposited * 0.4
                  ? 'linear-gradient(135deg, rgba(13,150,104,0.18) 0%, rgba(13,150,104,0.06) 100%)'
                  : 'linear-gradient(135deg, rgba(245,158,11,0.18) 0%, rgba(245,158,11,0.06) 100%)',
                border: `1.5px solid ${myFundStats.remaining < 0 ? 'rgba(225,29,72,0.4)' : myFundStats.remaining > myFundStats.deposited * 0.4 ? 'rgba(13,150,104,0.35)' : 'rgba(245,158,11,0.35)'}`,
                backdropFilter: 'blur(12px)',
              }}>
                {/* Top: icon + title + main balance */}
                <Box sx={{ px: 2.5, pt: 2, pb: 1.5, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{
                    width: 52, height: 52, borderRadius: 2.5, flexShrink: 0,
                    background: myFundStats.remaining >= 0
                      ? 'linear-gradient(135deg, rgba(13,150,104,0.25), rgba(13,150,104,0.45))'
                      : 'linear-gradient(135deg, rgba(225,29,72,0.25), rgba(225,29,72,0.45))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: `1.5px solid ${myFundStats.remaining >= 0 ? 'rgba(13,150,104,0.4)' : 'rgba(225,29,72,0.4)'}`,
                    boxShadow: `0 4px 14px ${myFundStats.remaining >= 0 ? 'rgba(13,150,104,0.3)' : 'rgba(225,29,72,0.3)'}`,
                  }}>
                    <AccountBalanceWallet sx={{ fontSize: 26, color: myFundStats.remaining >= 0 ? '#34d399' : '#fca5a5' }} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 700, letterSpacing: 0.8, display: 'block', mb: 0.2, fontSize: '0.62rem' }}>
                      {myFundStats.remaining >= 0 ? 'رصيد عهدتك المتاح' : 'عجز في العهدة'}
                    </Typography>
                    <Typography sx={{
                      fontSize: '2rem', fontWeight: 900, lineHeight: 1, fontFamily: 'Outfit, sans-serif',
                      color: myFundStats.remaining < 0 ? '#f87171' : myFundStats.remaining > myFundStats.deposited * 0.4 ? '#34d399' : '#fbbf24',
                      textShadow: '0 2px 10px rgba(0,0,0,0.15)',
                    }}>
                      {myFundStats.remaining < 0 ? `-${formatCurrency(Math.abs(myFundStats.remaining))}` : formatCurrency(myFundStats.remaining)}
                    </Typography>
                  </Box>
                  {/* Alert icon */}
                  {myFundStats.remaining < 0 && (
                    <Typography sx={{ fontSize: '1.5rem', lineHeight: 1, flexShrink: 0 }}>⚠️</Typography>
                  )}
                </Box>

                {/* Progress bar */}
                <Box sx={{ px: 2.5, pb: 1 }}>
                  {(() => {
                    const pct = myFundStats.deposited > 0 ? Math.max(0, Math.min(100, (myFundStats.remaining / myFundStats.deposited) * 100)) : 0;
                    const barColor = pct > 40
                      ? 'linear-gradient(90deg, #0d9668, #34d399)'
                      : pct > 15 ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                      : 'linear-gradient(90deg, #d64545, #f87171)';
                    return (
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography sx={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.58rem', fontWeight: 600 }}>
                            {Math.round(pct)}% متبقي
                          </Typography>
                          <Typography sx={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.58rem', fontWeight: 600 }}>
                            من {formatCurrency(myFundStats.deposited)}
                          </Typography>
                        </Box>
                        <Box sx={{ height: 6, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                          <Box sx={{ height: '100%', width: myFundStats.remaining < 0 ? '100%' : `${pct}%`, borderRadius: 3, background: barColor, transition: 'width 0.5s ease' }} />
                        </Box>
                      </Box>
                    );
                  })()}
                </Box>

                {/* 3-column stats */}
                <Box sx={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
                  bgcolor: 'rgba(0,0,0,0.12)', borderTop: '1px solid rgba(255,255,255,0.08)',
                }}>
                  {[
                    { label: 'إجمالي العهدة', val: myFundStats.deposited, color: '#6ee7b7' },
                    { label: 'المصروف', val: myFundStats.spent, color: '#fca5a5' },
                    { label: 'المتبقي', val: myFundStats.remaining, color: myFundStats.remaining >= 0 ? '#34d399' : '#f87171' },
                  ].map((s, i) => (
                    <Box key={i} sx={{ py: 1.2, textAlign: 'center', borderRight: i < 2 ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>
                      <Typography fontWeight={900} sx={{ color: s.color, fontFamily: 'Outfit, sans-serif', fontSize: '0.85rem', lineHeight: 1 }}>
                        {formatCurrency(s.val)}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.58rem', fontWeight: 600 }}>
                        {s.label}
                      </Typography>
                    </Box>
                  ))}
                </Box>

                {/* Alert strip */}
                {myFundStats.remaining < 0 && (
                  <Box sx={{ bgcolor: 'rgba(225,29,72,0.25)', px: 2.5, py: 1, display: 'flex', alignItems: 'center', gap: 1, borderTop: '1px solid rgba(225,29,72,0.4)' }}>
                    <Typography fontWeight={800} sx={{ color: '#fca5a5', fontSize: '0.8rem' }}>التجاوز المالي مسجل كعجز، سيُخصم من رصيدك القادم!</Typography>
                  </Box>
                )}
              </Box>
            ) : null}

            {/* Total expenses */}
            <Box sx={{
              p: 2.5,
              borderRadius: 2,
              background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.03) 100%)',
              border: '1px solid rgba(255,255,255,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <Box>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.65)', display: 'block', mb: 0.5, fontWeight: 600 }}>إجمالي المصروفات</Typography>
                <Typography variant="h4" fontWeight={900} sx={{ color: 'white', lineHeight: 1 }}>{formatCurrency(totalExpenses)}</Typography>
              </Box>
              <Stack direction="row" spacing={2}>
                <Box sx={{ textAlign: 'center', bgcolor: 'rgba(255,255,255,0.07)', px: 2, py: 1, borderRadius: 1.5 }}>
                  <Typography variant="h6" fontWeight={800} color="white">{expenses.length}</Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.65rem' }}>سجل</Typography>
                </Box>
                <Box sx={{ textAlign: 'center', bgcolor: 'rgba(255,255,255,0.07)', px: 2, py: 1, borderRadius: 1.5 }}>
                  <Typography variant="h6" fontWeight={800} color="white">{chartData.length}</Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.65rem' }}>فئة</Typography>
                </Box>
              </Stack>
            </Box>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="sm" sx={{ mt: 3 }}>

        {/* ── Pie Chart ── */}
        {chartData.length > 0 && (
          <Card sx={{ mb: 3, overflow: 'hidden', borderRadius: 2 }}>
            <CardContent sx={{ p: 0 }}>
              {/* Chart header */}
              <Box sx={{ px: 2.5, pt: 2.5, pb: 1 }}>
                <Typography variant="subtitle1" fontWeight={800} color="text.primary">توزيع المصروفات</Typography>
                <Typography variant="caption" color="text.secondary">حسب التصنيف</Typography>
              </Box>
              <Divider />

              {/* Donut chart */}
              <Box sx={{ height: 220, px: 1, pt: 1 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                      cornerRadius={3}
                    >
                      {chartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      formatter={(value: number) => [formatCurrency(value), 'المبلغ']}
                      contentStyle={{
                        borderRadius: '10px',
                        border: 'none',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                        fontWeight: 700,
                        padding: '10px 14px',
                        fontFamily: 'Tajawal, sans-serif',
                        direction: 'rtl',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Box>

              {/* Legend */}
              <Box sx={{ px: 2.5, pb: 2.5, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {chartData.map((entry, index) => (
                  <Stack key={entry.name} direction="row" alignItems="center" spacing={0.75}
                    sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', px: 1.25, py: 0.5, borderRadius: 1, border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}` }}
                  >
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: COLORS[index % COLORS.length], flexShrink: 0 }} />
                    <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ fontSize: '0.72rem' }}>{entry.name}</Typography>
                  </Stack>
                ))}
              </Box>
            </CardContent>
          </Card>
        )}

        {/* ── Search & Filter ── */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 3 }}>
          <TextField
            fullWidth
            placeholder="بحث في المصروفات..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search fontSize="small" sx={{ color: 'text.secondary', opacity: 0.7 }} /></InputAdornment>,
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                bgcolor: 'background.paper',
                '& fieldset': { borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' },
              },
            }}
          />
          <FormControl sx={{ minWidth: { xs: '100%', sm: 220 } }}>
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              displayEmpty
              sx={{
                borderRadius: 2,
                bgcolor: 'background.paper',
                fontWeight: 600,
                '& .MuiOutlinedInput-notchedOutline': { borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' },
              }}
            >
              <MenuItem value="all">كل التصنيفات</MenuItem>
              {Object.entries(expenseCategories).map(([key, label]) => (
                <MenuItem key={key} value={key}>{label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        {/* ── Results count ── */}
        {filteredExpenses.length > 0 && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2, fontWeight: 600 }}>
            عرض {filteredExpenses.length} من {expenses.length} سجل
          </Typography>
        )}

        {/* ── Expenses List ── */}
        <Stack spacing={0} sx={{ mb: 6 }}>
          {filteredExpenses.length === 0 ? (
            <Card sx={{ textAlign: 'center', py: 8, borderRadius: 2 }}>
              <TrendingDown sx={{ fontSize: 56, color: 'text.secondary', opacity: 0.2, mb: 2 }} />
              <Typography variant="h6" color="text.secondary" fontWeight={600}>لا توجد مصروفات</Typography>
              <Typography variant="caption" color="text.secondary">اضغط على زر "مصروف جديد" لإضافة مصروف</Typography>
            </Card>
          ) : (
            filteredExpenses.map((exp, index) => {
              const clientName = clients.find(c => c.id === exp.clientId)?.name || 'مجهول';
              const isLast = index === filteredExpenses.length - 1;
              return (
                <Box
                  key={exp.id}
                  sx={{
                    bgcolor: 'background.paper',
                    borderRight: '3px solid #d64545',
                    borderTop: '1px solid',
                    borderBottom: isLast ? '1px solid' : 'none',
                    borderLeft: '1px solid',
                    borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                    borderRightColor: '#d64545',
                    px: 2.5,
                    py: 2,
                    transition: 'background 0.18s ease',
                    '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(214,69,69,0.015)' },
                    '&:first-of-type': { borderRadius: '4px 4px 0 0' },
                    '&:last-of-type': { borderRadius: '0 0 4px 4px' },
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
                    {/* Left: icon + info */}
                    <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ flex: 1, minWidth: 0 }}>
                      <Avatar sx={{ bgcolor: 'rgba(214,69,69,0.08)', color: '#d64545', width: 40, height: 40, borderRadius: 1.5, border: '1px solid rgba(214,69,69,0.12)', flexShrink: 0, mt: 0.25 }}>
                        <TrendingDown sx={{ fontSize: 18 }} />
                      </Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography fontWeight={800} variant="body2" noWrap sx={{ mb: 0.5 }}>{exp.description}</Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 0.5 }}>
                          <Chip
                            label={getExpenseCategoryLabel(exp.category)}
                            size="small"
                            sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', color: 'text.secondary', borderRadius: 1 }}
                          />
                          <Stack direction="row" alignItems="center" spacing={0.4}>
                            <Person sx={{ fontSize: 12, color: 'text.disabled' }} />
                            <Typography variant="caption" color="text.secondary" fontWeight={600} noWrap>{clientName}</Typography>
                          </Stack>
                          <Stack direction="row" alignItems="center" spacing={0.4}>
                            <CalendarToday sx={{ fontSize: 11, color: 'text.disabled' }} />
                            <Typography variant="caption" color="text.secondary" fontWeight={500}>{formatDate(exp.date)}</Typography>
                          </Stack>
                        </Stack>
                        {exp.createdBy && (
                          <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.65rem', mt: 0.5, display: 'block' }}>
                            بواسطة: {exp.createdBy}
                          </Typography>
                        )}
                      </Box>
                    </Stack>

                    {/* Right: amount */}
                    <Box sx={{ textAlign: 'left', flexShrink: 0 }}>
                      <Typography fontWeight={900} sx={{ color: '#d64545', fontSize: '1rem' }}>
                        {formatCurrency(exp.amount)}
                      </Typography>
                      {exp.invoiceNumber && (
                        <Stack direction="row" alignItems="center" spacing={0.4} sx={{ mt: 0.5, justifyContent: 'flex-end' }}>
                          <Description sx={{ fontSize: 11, color: 'text.disabled' }} />
                          <Typography variant="caption" color="text.disabled" fontWeight={600}>{exp.invoiceNumber}</Typography>
                        </Stack>
                      )}
                    </Box>
                  </Stack>
                </Box>
              );
            })
          )}
        </Stack>
      </Container>

      {/* ── Add Expense Dialog ── */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ style: { borderRadius: '16px', padding: 0 } }}
      >
        {/* Dialog header */}
        <Box sx={{ background: 'linear-gradient(135deg, #2a3a2a 0%, #4a5d4a 100%)', px: 3, py: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h6" fontWeight={800} sx={{ color: 'white', lineHeight: 1.2 }}>تسجيل مصروف جديد</Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>أدخل تفاصيل المصروف</Typography>
          </Box>
          <IconButton onClick={() => setDialogOpen(false)} sx={{ color: 'rgba(255,255,255,0.8)', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}>
            <Close fontSize="small" />
          </IconButton>
        </Box>

        <Box sx={{ p: 3 }}>
          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ar">
            <Stack spacing={2.5}>
              <TextField
                label="وصف المصروف"
                fullWidth
                value={expenseForm.description}
                onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                InputProps={{ startAdornment: <InputAdornment position="start" sx={{ ml: 1 }}><NoteAlt sx={{ color: 'text.secondary', fontSize: 20 }} /></InputAdornment> }}
              />
              <TextField
                label="المبلغ"
                type="number"
                fullWidth
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                InputProps={{
                  startAdornment: <InputAdornment position="start" sx={{ ml: 1 }}><AttachMoney sx={{ color: 'text.secondary', fontSize: 20 }} /></InputAdornment>,
                  endAdornment: <InputAdornment position="end">د.ل</InputAdornment>,
                }}
              />
              <FormControl fullWidth>
                <InputLabel>الفئة</InputLabel>
                <Select
                  value={expenseForm.category}
                  label="الفئة"
                  onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                >
                  {Object.entries(expenseCategories).map(([key, label]) => (
                    <MenuItem key={key} value={key}>{label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>العميل / المشروع</InputLabel>
                <Select
                  value={expenseForm.clientId}
                  label="العميل / المشروع"
                  onChange={(e) => setExpenseForm({ ...expenseForm, clientId: e.target.value })}
                  startAdornment={<InputAdornment position="start" sx={{ ml: 1 }}><BusinessCenter sx={{ color: 'text.secondary', fontSize: 18 }} /></InputAdornment>}
                >
                  {clients.map(c => (
                    <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <DatePicker
                label="تاريخ المصروف"
                value={expenseForm.date}
                onChange={(newValue) => newValue && setExpenseForm({ ...expenseForm, date: newValue })}
                slotProps={{ textField: { fullWidth: true } }}
              />
              <TextField
                label="ملاحظات (اختياري)"
                multiline
                rows={2}
                value={expenseForm.notes}
                onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
              />
            </Stack>
          </LocalizationProvider>
        </Box>

        {/* Dialog actions */}
        <Box sx={{ px: 3, pb: 3, pt: 0, display: 'flex', gap: 1.5 }}>
          <Button
            fullWidth
            onClick={() => setDialogOpen(false)}
            size="large"
            sx={{ borderRadius: 2, fontWeight: 600, color: 'text.secondary', border: '1px solid', borderColor: 'divider' }}
          >
            إلغاء
          </Button>
          <Button
            fullWidth
            variant="contained"
            onClick={handleAddExpense}
            disabled={loading || !expenseForm.description || !expenseForm.amount || !expenseForm.clientId}
            size="large"
            sx={{
              borderRadius: 2, fontWeight: 800,
              background: 'linear-gradient(135deg, #d64545 0%, #b83b3b 100%)',
              boxShadow: '0 4px 16px rgba(214,69,69,0.3)',
              '&:hover': { boxShadow: '0 6px 20px rgba(214,69,69,0.4)' },
              '&:disabled': { opacity: 0.5 },
            }}
          >
            {loading ? 'جاري الحفظ...' : 'حفظ المصروف'}
          </Button>
        </Box>
      </Dialog>
    </Box>
  );
};
