// @ts-nocheck
import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  TextField,
  Typography,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  MenuItem,
  Stack,
  InputAdornment,
  Divider,
  Chip,
  Grid as MuiGrid,
  useTheme,
} from '@mui/material';
import {
  Add,
  Delete,
  Save,
  ArrowBack,
  PersonAdd,
  AttachMoney,
  Person,
  Phone,
  LocationOn,
  Receipt,
  CalendarToday,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/ar';

const Grid = MuiGrid as any;

import { useDataStore } from '../../store/useDataStore';
import { useAuthStore } from '../../store/useAuthStore';
import type { InvoiceItem, Invoice, Client } from '../../types';
import { PrintableInvoice } from '../../features/print/PrintableInvoice';
import { formatCurrency } from '../../utils/formatters';

export const NewInvoicePage = () => {
  const theme = useTheme();
  const outlineFieldSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 2,
      bgcolor: theme.palette.mode === 'dark' ? 'action.hover' : 'grey.50',
      transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
      '& fieldset': { borderColor: 'divider' },
      '&:hover fieldset': { borderColor: 'action.disabled' },
      '&.Mui-focused fieldset': { borderWidth: 2, borderColor: 'primary.main' },
      '&.Mui-focused': { bgcolor: 'background.paper' },
    },
  };

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const { clients, addInvoice, updateInvoice, invoices } = useDataStore();
  const { user } = useAuthStore();
  
  const [loading, setLoading] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Form State
  const [clientId, setClientId] = useState(searchParams.get('clientId') || '');
  const [tempClientName, setTempClientName] = useState('');
  const [tempClientPhone, setTempClientPhone] = useState('');
  const [tempClientAddress, setTempClientAddress] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [issueDate, setIssueDate] = useState<Dayjs | null>(dayjs());
  const [dueDate, setDueDate] = useState<Dayjs | null>(dayjs().add(7, 'day'));
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: '1', description: '', quantity: 1, unitPrice: 0, total: 0 }
  ]);
  const [taxRate, setTaxRate] = useState(0);
  const [notes, setNotes] = useState('');

  // Auto-generate invoice number and populate form when editing
  useEffect(() => {
    if (editId) {
      if (hasInitialized) return; // Prevent overwriting user's typing when invoices reload
      const existing = invoices.find(inv => inv.id === editId);
      if (existing) {
        setClientId(existing.clientId);
        setTempClientName(existing.tempClientName || '');
        setTempClientPhone(existing.tempClientPhone || '');
        setTempClientAddress(existing.tempClientAddress || '');
        setInvoiceNumber(existing.invoiceNumber);
        setIssueDate(dayjs(existing.issueDate));
        setDueDate(dayjs(existing.dueDate));
        setItems(existing.items);
        setTaxRate(existing.taxRate);
        setNotes(existing.notes || '');
        setHasInitialized(true);
      }
    } else {
      let maxNum = 1000;
      invoices.forEach(inv => {
        const match = inv.invoiceNumber.match(/\d+$/);
        if (match) {
          const num = parseInt(match[0], 10);
          if (!isNaN(num) && num > maxNum) {
            maxNum = num;
          }
        }
      });
      setInvoiceNumber(`INV-${maxNum + 1}`);
    }
  }, [invoices, editId]);

  const handleAddItem = () => {
    setItems([
      ...items,
      { id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0, total: 0 }
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length === 1) return;
    setItems(items.filter(item => item.id !== id));
  };

  const handleItemChange = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        // Recalculate total if qty or price changes
        if (field === 'quantity' || field === 'unitPrice') {
           updatedItem.total = Number(updatedItem.quantity) * Number(updatedItem.unitPrice);
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  const previewInvoice = useMemo(
    (): Invoice => ({
      id: 'preview',
      invoiceNumber,
      clientId: clientId || 'preview',
      ...(clientId === 'temp'
        ? {
            tempClientName: tempClientName.trim() || undefined,
            tempClientPhone: tempClientPhone.trim() || undefined,
            tempClientAddress: tempClientAddress.trim() || undefined,
          }
        : {}),
      items,
      subtotal,
      taxRate,
      taxAmount,
      total,
      status: 'draft',
      issueDate: issueDate?.toISOString() || new Date().toISOString(),
      dueDate: dueDate?.toISOString() || new Date().toISOString(),
      notes: notes || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
    [
      invoiceNumber,
      clientId,
      tempClientName,
      tempClientPhone,
      tempClientAddress,
      items,
      subtotal,
      taxRate,
      taxAmount,
      total,
      issueDate,
      dueDate,
      notes,
    ]
  );

  const previewClient = useMemo((): Client => {
    if (clientId === 'temp') {
      return {
        id: 'temp',
        name: tempClientName.trim() || '—',
        phone: tempClientPhone || '',
        address: tempClientAddress || '',
        type: 'individual',
        createdAt: '',
        updatedAt: '',
      };
    }
    const c = clients.find((x) => x.id === clientId);
    if (c) return c;
    return {
      id: 'preview',
      name: '— اختر العميل —',
      phone: '',
      address: '',
      type: 'individual',
      createdAt: '',
      updatedAt: '',
    };
  }, [clientId, clients, tempClientName, tempClientPhone, tempClientAddress]);

  const handleSubmit = async () => {
    if (!clientId) {
      // You should import toast/msg or use window.alert if toast is not available in this scope, 
      // but assuming consistent usage pattern, we might need to import 'toast' from react-hot-toast if not present.
      // Based on previous files, 'msg' helper was used or 'toast'.
      // Let's use console.error or alert if we can't easily add import.
      // Better: add toast import.
      // For now, I'll assume toast is available or use alert as fallback.
      alert('يرجى اختيار العميل أولاً');
      return;
    }
    if (clientId === 'temp' && !tempClientName.trim()) {
      alert('يرجى إدخال اسم العميل المؤقت');
      return;
    }
    if (items.some(i => !i.description)) {
      alert('يرجى ملء وصف جميع البنود');
      return;
    }
    
    setLoading(true);
    try {
      const invoiceData = {
        invoiceNumber,
        clientId,
        ...(clientId === 'temp' ? { 
          tempClientName: tempClientName.trim(),
          tempClientPhone: tempClientPhone.trim(),
          tempClientAddress: tempClientAddress.trim(),
        } : {
          tempClientName: '',
          tempClientPhone: '',
          tempClientAddress: '',
        }),
        items,
        subtotal,
        taxRate,
        taxAmount,
        total,
        issueDate: issueDate?.toISOString() || new Date().toISOString(),
        dueDate: dueDate?.toISOString() || new Date().toISOString(),
        notes,
        updatedAt: new Date().toISOString(),
      };

      if (editId) {
        await updateInvoice(editId, invoiceData);
      } else {
        await addInvoice({
          id: crypto.randomUUID(),
          ...invoiceData,
          status: 'draft', // Default is draft on insert
          createdAt: new Date().toISOString(),
          createdBy: user?.displayName || 'غير معروف',
        });
      }
      navigate('/invoices');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ar">
    <Box sx={{ pb: 12, bgcolor: 'background.default', minHeight: '100%' }}>
      {/* Header — minimal trust UI (fintech / Swiss) */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper', pt: 2, pb: 2, px: 2 }}>
        <Container maxWidth="sm">
          <Stack direction="row" alignItems="center" spacing={1} mb={2}>
            <IconButton onClick={() => navigate('/invoices')} edge="start" aria-label="رجوع" sx={{ color: 'text.secondary' }}>
              <ArrowBack />
            </IconButton>
            <Typography variant="subtitle1" fontWeight={800} sx={{ flex: 1, fontSize: '1.1rem' }}>
              {editId ? 'تعديل الفاتورة' : 'فاتورة جديدة'}
            </Typography>
          </Stack>

          <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'action.hover' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="baseline">
              <Typography variant="caption" color="text.secondary" fontWeight={700}>الإجمالي</Typography>
              <Typography
                component="span"
                dir="ltr"
                className="money-ltr font-num tabular"
                fontWeight={800}
                color="primary"
                sx={{ fontSize: '1.25rem' }}
              >
                {formatCurrency(Math.round(total))}
              </Typography>
            </Stack>
          </Paper>
        </Container>
      </Box>

      <Container maxWidth="sm" sx={{ mt: 2, pb: 4 }}>
        {/* Client & Invoice Info */}
        <Paper elevation={0} sx={{ p: { xs: 2.5, sm: 3 }, borderRadius: 2, mb: 3, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
          <Stack spacing={3}>
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, mb: 1, display: 'block', ml: 0.5 }}>
                بيانات العميل
              </Typography>
              <TextField
                select
                fullWidth
                label="اختر العميل"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                variant="outlined"
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Person sx={{ color: 'text.secondary' }} /></InputAdornment>,
                }}
                sx={outlineFieldSx}
              >
                {clients.map((client) => (
                  <MenuItem key={client.id} value={client.id}>{client.name}</MenuItem>
                ))}
                <MenuItem value="temp">
                  <Typography color="secondary" fontWeight={700}>+ إضافة عميل مؤقت</Typography>
                </MenuItem>
                <MenuItem value="" onClick={() => navigate('/clients')}>
                  <Typography color="primary" fontWeight={700}>+ عميل جديد ثابت</Typography>
                </MenuItem>
              </TextField>
            </Box>

            {clientId === 'temp' && (
              <Box sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'action.hover' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, mb: 2, display: 'block' }}>
                  تفاصيل العميل المؤقت (لا يتم حفظه بالقائمة)
                </Typography>
                <Stack spacing={2}>
                  <TextField
                    fullWidth
                    label="الاسم *"
                    value={tempClientName}
                    onChange={(e) => setTempClientName(e.target.value)}
                    variant="outlined"
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><Person sx={{ color: 'text.secondary' }} /></InputAdornment>,
                    }}
                    sx={outlineFieldSx}
                  />
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="رقم الهاتف (اختياري)"
                        value={tempClientPhone}
                        onChange={(e) => setTempClientPhone(e.target.value)}
                        variant="outlined"
                        InputProps={{
                          startAdornment: <InputAdornment position="start"><Phone sx={{ color: 'text.secondary' }} /></InputAdornment>,
                        }}
                        sx={outlineFieldSx}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="العنوان (اختياري)"
                        value={tempClientAddress}
                        onChange={(e) => setTempClientAddress(e.target.value)}
                        variant="outlined"
                        InputProps={{
                          startAdornment: <InputAdornment position="start"><LocationOn sx={{ color: 'text.secondary' }} /></InputAdornment>,
                        }}
                        sx={outlineFieldSx}
                      />
                    </Grid>
                  </Grid>
                </Stack>
              </Box>
            )}

            <Divider sx={{ borderStyle: 'dashed' }} />

            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, mb: 1, display: 'block', ml: 0.5 }}>
                تفاصيل الفاتورة
              </Typography>
              <TextField
                fullWidth
                label="رقم الفاتورة (تلقائي)"
                value={invoiceNumber}
                variant="outlined"
                InputProps={{
                  readOnly: true,
                  startAdornment: <InputAdornment position="start"><Receipt sx={{ color: 'text.secondary' }} /></InputAdornment>,
                }}
                sx={{ ...outlineFieldSx, pointerEvents: 'none', opacity: 0.85 }}
              />
            </Box>

            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                  <DatePicker 
                    label="تاريخ الإصدار" 
                    value={issueDate} 
                    onChange={(val) => setIssueDate(val)}
                    slotProps={{ 
                      textField: { 
                        fullWidth: true, 
                        variant: 'outlined',
                        sx: outlineFieldSx,
                        InputProps: {
                          startAdornment: <InputAdornment position="start"><CalendarToday sx={{ color: 'text.secondary', fontSize: 20 }} /></InputAdornment>,
                        }
                      } 
                    }}
                  />
              </Grid>
              <Grid size={{ xs: 6 }}>
                  <DatePicker 
                    label="تاريخ الاستحقاق" 
                    value={dueDate} 
                    onChange={(val) => setDueDate(val)}
                    slotProps={{ 
                      textField: { 
                        fullWidth: true, 
                        variant: 'outlined',
                        sx: outlineFieldSx,
                        InputProps: {
                          startAdornment: <InputAdornment position="start"><CalendarToday sx={{ color: 'text.secondary', fontSize: 20 }} /></InputAdornment>,
                        }
                      } 
                    }}
                  />
              </Grid>
            </Grid>
          </Stack>
        </Paper>

        {/* Items */}
        <Box sx={{ mb: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2} px={0.5}>
            <Typography variant="subtitle1" fontWeight={800} sx={{ color: 'text.primary' }}>البنود</Typography>
            <Button 
              variant="outlined"
              color="primary"
              size="small"
              startIcon={<Add />} 
              onClick={handleAddItem}
              sx={{ fontWeight: 700, borderRadius: 2, textTransform: 'none' }}
            >
              إضافة بند
            </Button>
          </Stack>

          <Stack spacing={2}>
            {items.map((item, idx) => (
              <Paper 
                key={item.id} 
                elevation={0}
                sx={{ 
                  p: 2, 
                  borderRadius: 2, 
                  border: '1px solid', 
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                  position: 'relative',
                  transition: 'box-shadow 0.2s ease',
                  '&:hover': { boxShadow: 1 },
                }}
              >
                {items.length > 1 && (
                  <IconButton 
                    size="small" 
                    color="error" 
                    onClick={() => handleRemoveItem(item.id)}
                    sx={{ position: 'absolute', top: 8, left: 8, bgcolor: 'rgba(214,69,69,0.1)' }}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                )}
                
                <Stack spacing={2} mt={items.length > 1 ? 2 : 0}>
                  <TextField 
                    fullWidth 
                    label="الوصف"
                    placeholder="وصف البند أو الخدمة"
                    value={item.description}
                    onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                    variant="outlined"
                    multiline
                    minRows={2}
                    sx={outlineFieldSx}
                  />
                  
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 4 }}>
                      <TextField 
                        fullWidth 
                        label="الكمية" 
                        type="number" 
                        value={item.quantity}
                        onChange={(e) => handleItemChange(item.id, 'quantity', Number(e.target.value))}
                        onWheel={(e) => (e.target as HTMLElement).blur()}
                        variant="outlined"
                        InputProps={{ inputProps: { min: 1 } }}
                        sx={outlineFieldSx}
                      />
                    </Grid>
                    <Grid size={{ xs: 4 }}>
                      <TextField 
                        fullWidth 
                        label="السعر" 
                        type="number" 
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(item.id, 'unitPrice', Number(e.target.value))}
                        onWheel={(e) => (e.target as HTMLElement).blur()}
                        variant="outlined"
                        sx={outlineFieldSx}
                      />
                    </Grid>
                    <Grid size={{ xs: 4 }}>
                      <Box sx={{ 
                        height: '100%', 
                        minHeight: 56,
                        display: 'flex', 
                        flexDirection: 'column',
                        justifyContent: 'center', 
                        alignItems: 'center',
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 2,
                        bgcolor: 'action.hover',
                        py: 1,
                        px: 0.5,
                      }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={700}>الإجمالي</Typography>
                        <Typography fontWeight={800} className="font-num tabular" dir="ltr" color="primary">
                          {formatCurrency(Math.round(item.total))}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Stack>
              </Paper>
            ))}
          </Stack>
        </Box>

        {/* Tax & Notes */}
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, mb: 2, border: '1px solid', borderColor: 'divider' }}>
          <Stack spacing={2}>
            <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography sx={{ fontWeight: 600 }}>نسبة الضريبة</Typography>
                <TextField 
                  size="small" 
                  type="number" 
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                  onWheel={(e) => (e.target as HTMLElement).blur()}
                  variant="outlined"
                  InputProps={{ 
                    endAdornment: <Typography variant="caption" sx={{ ml: 1 }}>%</Typography> 
                  }}
                  sx={[{ width: 88 }, outlineFieldSx]}
                />
              </Stack>
              <Typography component="span" dir="ltr" className="money-ltr font-num tabular" fontWeight={700} color="text.secondary">
                {formatCurrency(Math.round(taxAmount))}
              </Typography>
            </Stack>

            <Divider />

            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h6" fontWeight={800}>الإجمالي النهائي</Typography>
              <Typography component="span" dir="ltr" className="money-ltr font-num tabular" variant="h5" fontWeight={900} color="primary">
                {formatCurrency(Math.round(total))}
              </Typography>
            </Stack>
          </Stack>
        </Paper>

        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, mb: 3, border: '1px solid', borderColor: 'divider' }}>
          <TextField
            label="ملاحظات وشروط" 
            multiline 
            rows={3} 
            fullWidth 
            value={notes} 
            onChange={(e) => setNotes(e.target.value)}
            variant="outlined"
            sx={outlineFieldSx}
          />
        </Paper>

        {/* Live preview — matches saved invoice layout */}
        <Box sx={{ mb: 10 }}>
          <Typography variant="overline" sx={{ display: 'block', letterSpacing: '0.08em', fontWeight: 800, color: 'text.secondary', mb: 1.5 }}>
            معاينة الفاتورة
          </Typography>
          <Paper
            elevation={0}
            sx={{
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              overflow: 'hidden',
              bgcolor: 'background.paper',
              maxHeight: { xs: '70vh', sm: 'none' },
              overflowY: 'auto',
            }}
          >
            <PrintableInvoice invoice={previewInvoice} client={previewClient} />
          </Paper>
        </Box>
      </Container>

      {/* Sticky Save */}
      <Box sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, p: 2, pb: 'calc(env(safe-area-inset-bottom) + 16px)', bgcolor: 'background.paper', borderTop: '1px solid', borderColor: 'divider', zIndex: 1300, boxShadow: '0 -4px 12px rgba(0,0,0,0.06)' }}>
        <Container maxWidth="sm">
          <Button
            variant="contained" fullWidth size="large"
            color="primary"
            startIcon={<Save />}
            onClick={handleSubmit}
            disabled={loading}
            sx={{
              py: 1.5, borderRadius: 2, fontWeight: 800, fontSize: '1rem',
              textTransform: 'none',
              minHeight: 48,
            }}
          >
            {loading ? 'جاري الحفظ...' : (editId ? 'تحديث البيانات' : 'حفظ الفاتورة')}
          </Button>
        </Container>
      </Box>
    </Box>
    </LocalizationProvider>
  );
};

