// @ts-nocheck
import { useState, useMemo } from 'react';
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
  Paper,
  alpha,
  IconButton,
  Grid as MuiGrid,
} from '@mui/material';
import {
  Add,
  Search,
  AccountBalanceWallet,
  CalendarToday,
  Person,
  Business,
  ArrowBack,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useDataStore } from '../../store/useDataStore';
import { useAuthStore } from '../../store/useAuthStore';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/ar';

const Grid = MuiGrid as any;

export const DebtsPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { standaloneDebts, clients, addStandaloneDebt, updateStandaloneDebt } = useDataStore();
  const { user } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [debtForm, setDebtForm] = useState({
    partyType: 'external',
    partyName: '',
    clientId: '',
    description: '',
    amount: '',
    date: dayjs(),
    dueDate: dayjs().add(1, 'month'),
    notes: '',
  });

  const filteredDebts = useMemo(() => {
    return standaloneDebts.filter(debt => 
      debt.partyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      debt.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [standaloneDebts, searchQuery]);

  const handleAddDebt = async () => {
    if (!debtForm.amount || (!debtForm.partyName && !debtForm.clientId)) return;
    setLoading(true);
    
    let partyName = debtForm.partyName;
    if (debtForm.partyType === 'client') {
      const client = clients.find(c => c.id === debtForm.clientId);
      if (client) partyName = client.name;
    }

    try {
      await addStandaloneDebt({
        id: crypto.randomUUID(),
        partyType: debtForm.partyType as any,
        partyName: partyName,
        clientId: debtForm.partyType === 'client' ? debtForm.clientId : undefined,
        description: debtForm.description,
        amount: parseFloat(debtForm.amount),
        paidAmount: 0,
        remainingAmount: parseFloat(debtForm.amount),
        status: 'unpaid',
        date: debtForm.date.toISOString(),
        dueDate: debtForm.dueDate.toISOString(),
        notes: debtForm.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: user?.displayName || 'غير معروف',
      });
      setDialogOpen(false);
      setDebtForm({
        partyType: 'external',
        partyName: '',
        clientId: '',
        description: '',
        amount: '',
        date: dayjs(),
        dueDate: dayjs().add(1, 'month'),
        notes: '',
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ pb: 8, minHeight: '100dvh' }}>
      {/* Header */}
      <Box
        sx={{
          background: theme.palette.mode === 'light'
            ? 'linear-gradient(160deg, #364036 0%, #4a5d4a 100%)'
            : 'linear-gradient(160deg, #2a3a2a 0%, #364036 100%)',
          pt: 'calc(env(safe-area-inset-top) + 16px)',
          pb: 5,
          px: 2,
          position: 'relative',
          overflow: 'hidden',
          color: 'white',
        }}
      >
        <Box sx={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'radial-gradient(ellipse at 70% 20%, rgba(200,192,176,0.08) 0%, transparent 50%)',
          pointerEvents: 'none',
        }} />

        <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <IconButton onClick={() => navigate('/')} sx={{ color: 'rgba(255,255,255,0.9)', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}>
                <ArrowBack />
              </IconButton>
              <Typography variant="h5" fontWeight={800} sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>الديون</Typography>
            </Stack>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setDialogOpen(true)}
              sx={{
                bgcolor: 'rgba(200,192,176,0.9)',
                color: '#2a3a2a',
                fontWeight: 700,
                borderRadius: 2.5,
                px: 2.5,
                boxShadow: '0 4px 14px -3px rgba(200,192,176,0.4)',
                '&:hover': { bgcolor: '#c8c0b0', transform: 'scale(1.04)' },
                transition: 'all 0.25s ease',
              }}
            >
              جديد
            </Button>
          </Stack>

          {/* Stats */}
          <Paper sx={{ p: 2, borderRadius: 2.5, bgcolor: 'rgba(255,255,255,0.1)', boxShadow: 'none', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', display: 'block' }}>إجمالي الديون المتبقية</Typography>
            <Typography variant="body1" fontWeight={800} color="white">
              {formatCurrency(standaloneDebts.reduce((sum, d) => sum + d.remainingAmount, 0))}
            </Typography>
          </Paper>
        </Container>
      </Box>

      <Container maxWidth="sm" sx={{ mt: -2 }}>
        {/* Search */}
        <TextField
          fullWidth
          placeholder="بحث عن دين أو اسم..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: <InputAdornment position="start"><Search /></InputAdornment>,
          }}
          sx={{ mb: 3, '& .MuiOutlinedInput-root': { borderRadius: '14px', bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', '& fieldset': { border: 'none' } } }}
        />

        {/* Debts Grid */}
        <Grid container spacing={2}>
          {filteredDebts.length === 0 ? (
            <Grid size={{ xs: 12 }}>
              <Box textAlign="center" py={8} bgcolor="background.paper" borderRadius="20px" border="1px solid" borderColor="divider">
                <AccountBalanceWallet sx={{ fontSize: 56, color: 'text.secondary', opacity: 0.15, mb: 2 }} />
                <Typography variant="h6" color="text.secondary">لا توجد ديون مسجلة</Typography>
              </Box>
            </Grid>
          ) : (
            filteredDebts.map((debt) => (
              <Grid size={{ xs: 12, md: 6, lg: 4 }} key={debt.id}>
                <Card sx={{ borderRadius: '18px', border: '1px solid', borderColor: 'divider', boxShadow: 'none', height: '100%' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Stack spacing={2}>
                      {/* Status */}
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Box 
                          sx={{ 
                            bgcolor: alpha(debt.status === 'paid' ? theme.palette.success.main : theme.palette.warning.main, 0.1),
                            color: debt.status === 'paid' ? 'success.main' : 'warning.main',
                            px: 1.5, py: 0.5,
                            borderRadius: '8px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                          }}
                        >
                          {debt.status === 'paid' ? 'مدفوع' : 'غير مدفوع'}
                        </Box>
                      </Box>

                      {/* Party Info */}
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar sx={{ 
                          bgcolor: alpha(theme.palette.primary.main, 0.08), 
                          color: 'primary.main', 
                          borderRadius: '14px',
                          width: 48, height: 48,
                        }}>
                          {debt.partyType === 'external' ? <Business /> : <Person />}
                        </Avatar>
                        <Box>
                          <Typography variant="h6" fontWeight={700} fontSize="1rem">{debt.partyName}</Typography>
                          <Typography variant="body2" color="text.secondary">{debt.description}</Typography>
                        </Box>
                      </Stack>
                      
                      {/* Amounts */}
                      <Paper sx={{ p: 2, borderRadius: '12px', bgcolor: alpha(theme.palette.primary.main, 0.03), border: '1px dashed', borderColor: 'divider' }}>
                        <Stack spacing={1}>
                          <Stack direction="row" justifyContent="space-between">
                            <Typography variant="body2" color="text.secondary">قيمة الدين</Typography>
                            <Typography fontWeight={700} variant="body2">{formatCurrency(debt.amount)}</Typography>
                          </Stack>
                          <Stack direction="row" justifyContent="space-between">
                            <Typography variant="body2" color="text.secondary">المدفوع</Typography>
                            <Typography fontWeight={700} color="success.main" variant="body2">{formatCurrency(debt.paidAmount)}</Typography>
                          </Stack>
                          <Stack direction="row" justifyContent="space-between">
                            <Typography variant="body2" color="text.secondary">المتبقي</Typography>
                            <Typography fontWeight={800} color="error.main" variant="body2">{formatCurrency(debt.remainingAmount)}</Typography>
                          </Stack>
                        </Stack>
                      </Paper>

                      {/* Footer */}
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Stack direction="row" spacing={0.5} alignItems="center" color="text.secondary">
                          <CalendarToday sx={{ fontSize: 14 }} />
                          <Typography variant="caption">{formatDate(debt.date)}</Typography>
                        </Stack>
                        <Button size="small" variant="outlined" startIcon={<Add />} sx={{ borderRadius: '8px', fontWeight: 600 }}>
                          سداد
                        </Button>
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      </Container>

      {/* Add Debt Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ style: { borderRadius: '20px', padding: '16px' } }}
      >
        <Typography variant="h6" fontWeight={800} mb={3}>تسجيل دين جديد</Typography>
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ar">
          <Stack spacing={2.5}>
            <FormControl fullWidth>
              <InputLabel>نوع الطرف</InputLabel>
              <Select
                value={debtForm.partyType}
                label="نوع الطرف"
                onChange={(e) => setDebtForm({...debtForm, partyType: e.target.value})}
              >
                <MenuItem value="external">طرف خارجي</MenuItem>
                <MenuItem value="client">عميل حالي</MenuItem>
              </Select>
            </FormControl>

            {debtForm.partyType === 'client' ? (
              <FormControl fullWidth>
                <InputLabel>العميل</InputLabel>
                <Select
                  value={debtForm.clientId}
                  label="العميل"
                  onChange={(e) => setDebtForm({...debtForm, clientId: e.target.value})}
                >
                  {clients.map(client => (
                    <MenuItem key={client.id} value={client.id}>{client.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : (
              <TextField 
                label="اسم الطرف" 
                fullWidth 
                value={debtForm.partyName}
                onChange={(e) => setDebtForm({...debtForm, partyName: e.target.value})}
              />
            )}

            <TextField 
              label="وصف الدين" 
              fullWidth 
              value={debtForm.description}
              onChange={(e) => setDebtForm({...debtForm, description: e.target.value})}
            />

            <TextField 
              label="المبلغ" 
              type="number" 
              fullWidth
              value={debtForm.amount}
              onChange={(e) => setDebtForm({...debtForm, amount: e.target.value})}
              InputProps={{ endAdornment: <InputAdornment position="end">د.ل</InputAdornment> }}
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <DatePicker 
                label="تاريخ الدين"
                value={debtForm.date}
                onChange={(newValue) => newValue && setDebtForm({...debtForm, date: newValue})}
                slotProps={{ textField: { fullWidth: true } }}
              />
              <DatePicker 
                label="تاريخ الاستحقاق"
                value={debtForm.dueDate}
                onChange={(newValue) => newValue && setDebtForm({...debtForm, dueDate: newValue})}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Stack>

            <TextField 
              label="ملاحظات" 
              multiline 
              rows={2} 
              value={debtForm.notes}
              onChange={(e) => setDebtForm({...debtForm, notes: e.target.value})}
            />
          </Stack>
        </LocalizationProvider>
        
        <Box mt={3} display="flex" gap={2}>
          <Button fullWidth onClick={() => setDialogOpen(false)} size="large" sx={{ borderRadius: '10px' }}>إلغاء</Button>
          <Button 
            fullWidth 
            variant="contained" 
            onClick={handleAddDebt}
            disabled={loading}
            size="large"
            sx={{ borderRadius: '10px', fontWeight: 700 }}
          >
            {loading ? 'جاري الحفظ...' : 'حفظ الدين'}
          </Button>
        </Box>
      </Dialog>
    </Box>
  );
};
