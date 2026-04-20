// @ts-nocheck
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Button, Typography, TextField, InputAdornment, Chip,
  IconButton, Stack, Container, useTheme, Paper, alpha, Grid as MuiGrid,
} from '@mui/material';
import { Add, Search, Description, ArrowBack } from '@mui/icons-material';
import { useDataStore } from '../../store/useDataStore';
import { formatCurrency, formatDate, getStatusLabel } from '../../utils/formatters';

const Grid = MuiGrid as any;

export const InvoicesPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { invoices, clients } = useDataStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const client = clients.find(c => c.id === inv.clientId);
      const clientName = client?.name || inv.tempClientName || '';
      const matchesSearch = 
        inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        clientName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'all' || inv.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [invoices, clients, searchQuery, filterStatus]);

  const stats = useMemo(() => {
    const total = invoices.reduce((sum, inv) => sum + inv.total, 0);
    const paid = invoices.filter(i => i.status === 'paid').reduce((sum, inv) => sum + inv.total, 0);
    const pending = total - paid;
    return { total, paid, pending };
  }, [invoices]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'success';
      case 'partially_paid': return 'warning';
      case 'overdue': return 'error';
      case 'draft': return 'default';
      default: return 'primary';
    }
  };

  return (
    <Box sx={{ pb: 8, minHeight: '100dvh', bgcolor: theme.palette.mode === 'dark' ? '#121812' : '#f5f3ef' }}>
      {/* Header */}
      <Box
        sx={{
          background: 'linear-gradient(160deg, #364036 0%, #4a5d4a 100%)',
          pt: 'calc(env(safe-area-inset-top) + 16px)', pb: 4, px: 2,
          color: 'white',
        }}
      >
        <Container maxWidth="sm">
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2.5}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <IconButton onClick={() => navigate('/')} sx={{ color: 'rgba(255,255,255,0.9)' }}>
                <ArrowBack />
              </IconButton>
              <Typography fontWeight={800} sx={{ fontSize: '1.2rem' }}>الفواتير</Typography>
            </Stack>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate('/invoices/new')}
              sx={{
                bgcolor: '#c8c0b0',
                color: '#ffffffff',
                fontWeight: 800,
                borderRadius: 2.5,
                px: 3,
                py: 1,
                fontSize: '0.9rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                '&:hover': { bgcolor: '#e6dec8', transform: 'translateY(-2px)' },
                transition: 'all 0.2s',
              }}
            >
              إنشاء فاتورة
            </Button>
          </Stack>

          {/* Stats - 3 columns */}
          <Grid container spacing={1} mb={2}>
            {[
              { label: 'المفوتر', value: formatCurrency(stats.total) },
              { label: 'المحصل', value: formatCurrency(stats.paid) },
              { label: 'المستحق', value: formatCurrency(stats.pending) },
            ].map((stat, i) => (
              <Grid size={{ xs: 4 }} key={i}>
                <Paper sx={{ p: 1.2, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.08)', boxShadow: 'none' }}>
                  <Typography sx={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.6rem', mb: 0.3 }}>{stat.label}</Typography>
                  <Typography fontWeight={800} color="white" sx={{ fontSize: '0.78rem' }}>{stat.value}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>

          {/* Search */}
          <TextField
            fullWidth size="small"
            placeholder="بحث..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: 'rgba(255,255,255,0.92)', borderRadius: 2.5,
                height: 40, fontSize: '0.85rem',
                '& fieldset': { border: 'none' },
              },
            }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search sx={{ color: '#4a5d4a', fontSize: 20 }} /></InputAdornment>,
            }}
          />
        </Container>
      </Box>

      {/* Filter Chips */}
      <Container maxWidth="sm" sx={{ mt: 1.5, mb: 2 }}>
        <Stack direction="row" spacing={0.8} sx={{ overflowX: 'auto', pb: 1, '::-webkit-scrollbar': { display: 'none' } }}>
          {['all', 'paid', 'partially_paid', 'draft', 'overdue'].map((status) => (
            <Chip
              key={status}
              label={status === 'all' ? 'الكل' : getStatusLabel(status)}
              onClick={() => setFilterStatus(status)}
              variant={filterStatus === status ? 'filled' : 'outlined'}
              color={filterStatus === status && status !== 'all' ? getStatusColor(status) as any : 'default'}
              sx={{ borderRadius: 2, height: 30, fontSize: '0.75rem', fontWeight: 600, flexShrink: 0 }}
            />
          ))}
        </Stack>
      </Container>

      {/* Invoices List */}
      <Container maxWidth="sm">
        <Stack spacing={1}>
          {filteredInvoices.length === 0 ? (
            <Box textAlign="center" py={6}>
              <Description sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.15, mb: 1 }} />
              <Typography color="text.secondary">لا توجد فواتير</Typography>
            </Box>
          ) : (
            filteredInvoices.map((inv) => {
              const client = clients.find(c => c.id === inv.clientId);
              const isPaid = inv.status === 'paid';
              return (
                <Box
                  key={inv.id}
                  onClick={() => navigate(`/invoices/${inv.id}`)}
                  sx={{
                    bgcolor: 'background.paper',
                    borderRight: `3px solid ${isPaid ? '#0d9668' : '#e6a817'}`,
                    p: 2, cursor: 'pointer',
                    '&:active': { bgcolor: alpha('#4a5d4a', 0.04) },
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography fontWeight={700} sx={{ fontSize: '0.9rem' }}>
                        #{inv.invoiceNumber}
                      </Typography>
                      <Typography color="text.secondary" sx={{ fontSize: '0.75rem', mt: 0.3 }}>
                        {client?.name || inv.tempClientName || 'عميل غير معروف'} • {formatDate(inv.issueDate)}
                      </Typography>
                    </Box>
                    <Stack alignItems="flex-end" spacing={0.3}>
                      <Typography fontWeight={800} sx={{ fontSize: '0.9rem', color: '#4a5d4a' }}>
                        {formatCurrency(inv.total)}
                      </Typography>
                      <Chip
                        label={getStatusLabel(inv.status)}
                        color={getStatusColor(inv.status) as any}
                        size="small"
                        sx={{ fontWeight: 600, borderRadius: 1.5, height: 20, fontSize: '0.6rem' }}
                      />
                    </Stack>
                  </Stack>
                </Box>
              );
            })
          )}
        </Stack>
      </Container>
    </Box>
  );
};
