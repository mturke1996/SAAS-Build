// @ts-nocheck
import { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  InputAdornment,
  Container,
  Stack,
  useTheme,
  Chip,
  Avatar,
  Paper,
  alpha,
  IconButton,
  Grid as MuiGrid,
} from '@mui/material';
import {
  Search,
  Payment,
  CalendarToday,
  Person,
  CheckCircle,
  ArrowBack,
  TrendingUp,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useDataStore } from '../../store/useDataStore';
import { formatCurrency, formatDate } from '../../utils/formatters';

const Grid = MuiGrid as any;

export const PaymentsPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { payments, clients, invoices } = useDataStore();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPayments = useMemo(() => {
    return payments.filter(payment => {
      const client = clients.find(c => c.id === payment.clientId);
      const invoice = invoices.find(inv => inv.id === payment.invoiceId);
      const clientName = client?.name || invoice?.tempClientName || '';
      return (
        payment.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        clientName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }).sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
  }, [payments, clients, invoices, searchQuery]);

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: 'نقدي',
      check: 'شيك',
      bank_transfer: 'تحويل بنكي',
      mobile_payment: 'إلكتروني',
    };
    return labels[method] || method;
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
          <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
            <IconButton onClick={() => navigate('/')} sx={{ color: 'rgba(255,255,255,0.9)', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}>
              <ArrowBack />
            </IconButton>
            <Typography variant="h5" fontWeight={800} sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>المدفوعات</Typography>
          </Stack>

          {/* Stats */}
          <Grid container spacing={1.5} mb={2}>
            <Grid size={{ xs: 6 }}>
              <Paper sx={{ p: 2, borderRadius: 2.5, bgcolor: 'rgba(255,255,255,0.1)', boxShadow: 'none', border: '1px solid rgba(255,255,255,0.08)' }}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', display: 'block' }}>إجمالي المحصل</Typography>
                <Typography variant="body1" fontWeight={800} color="white">
                  {formatCurrency(payments.reduce((sum, p) => sum + p.amount, 0))}
                </Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Paper sx={{ p: 2, borderRadius: 2.5, bgcolor: 'rgba(255,255,255,0.1)', boxShadow: 'none', border: '1px solid rgba(255,255,255,0.08)' }}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', display: 'block' }}>عدد العمليات</Typography>
                <Typography variant="body1" fontWeight={800} color="white">{payments.length}</Typography>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Container maxWidth="sm" sx={{ mt: -2 }}>
        {/* Search */}
        <TextField
          fullWidth
          placeholder="بحث في المدفوعات..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: <InputAdornment position="start"><Search /></InputAdornment>,
          }}
          sx={{ mb: 3, '& .MuiOutlinedInput-root': { borderRadius: '14px', bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', '& fieldset': { border: 'none' } } }}
        />

        {/* Payments List */}
        <Stack spacing={1.5}>
          {filteredPayments.length === 0 ? (
            <Box textAlign="center" py={8} bgcolor="background.paper" borderRadius="20px" border="1px solid" borderColor="divider">
              <Payment sx={{ fontSize: 56, color: 'text.secondary', opacity: 0.15, mb: 2 }} />
              <Typography variant="h6" color="text.secondary">لا توجد مدفوعات</Typography>
            </Box>
          ) : (
            filteredPayments.map((payment) => {
              const client = clients.find(c => c.id === payment.clientId);
              const invoice = invoices.find(inv => inv.id === payment.invoiceId);
              const clientName = client?.name || invoice?.tempClientName || 'عميل غير معروف';
              return (
                <Card key={payment.id} sx={{ borderRadius: 2, boxShadow: 'none', border: '1px solid', borderColor: 'divider', borderRight: '3px solid', borderRightColor: 'success.main' }}>
                  <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography fontWeight={700} variant="body2">
                          {clientName}
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center" color="text.secondary" sx={{ mt: 0.5 }}>
                          <CalendarToday sx={{ fontSize: 13 }} />
                          <Typography variant="caption">{formatDate(payment.paymentDate)}</Typography>
                          <Typography variant="caption">•</Typography>
                          <Chip 
                            label={getPaymentMethodLabel(payment.paymentMethod)} 
                            size="small" 
                            sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600, bgcolor: alpha(theme.palette.primary.main, 0.08), color: 'primary.main' }} 
                          />
                        </Stack>
                      </Box>
                      <Typography fontWeight={800} color="success.main" variant="body1" sx={{ whiteSpace: 'nowrap', mr: 1 }}>
                        +{formatCurrency(payment.amount)}
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
              );
            })
          )}
        </Stack>
      </Container>
    </Box>
  );
};
