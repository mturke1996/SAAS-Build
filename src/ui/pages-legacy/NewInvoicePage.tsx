// @ts-nocheck
import { useState, useEffect } from 'react';
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
import { InvoiceItem } from '../../types';

const inputStyle = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 3,
    bgcolor: '#faf9f7',
    transition: 'all 0.2s ease',
    '& fieldset': { borderColor: 'rgba(0,0,0,0.06)' },
    '&:hover fieldset': { borderColor: 'rgba(0,0,0,0.1)' },
    '&.Mui-focused fieldset': { borderColor: '#6D28D9', borderWidth: 2 },
    '&.Mui-focused': { bgcolor: '#fff', boxShadow: '0 4px 20px rgba(74,93,74,0.08)' }
  }
};

export const NewInvoicePage = () => {
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
    <Box sx={{ pb: 12 }}>
      {/* Header */}
      <Box sx={{ background: 'linear-gradient(135deg, #4C1D95 0%, #6D28D9 100%)', pt: 3, pb: 3, px: 2, color: 'white' }}>
        <Container maxWidth="sm">
          <Stack direction="row" alignItems="center" spacing={1} mb={2}>
            <Typography fontWeight={800} sx={{ fontSize: '1.2rem' }}>
              {editId ? 'تعديل الفاتورة' : 'فاتورة جديدة'}
            </Typography>
          </Stack>

          {/* Summary */}
          <Paper sx={{ p: 2, borderRadius: 2.5, bgcolor: 'rgba(255,255,255,0.1)', boxShadow: 'none' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>الإجمالي</Typography>
              <Typography fontWeight={900} color="white" sx={{ fontSize: '1.3rem' }}>{Math.round(total)} د.ل</Typography>
            </Stack>
          </Paper>
        </Container>
      </Box>

      <Container maxWidth="sm" sx={{ mt: -2, pb: 4 }}>
        {/* Client & Invoice Info */}
        <Paper elevation={0} sx={{ p: { xs: 2.5, sm: 3.5 }, borderRadius: 4, mb: 3, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', boxShadow: '0 4px 24px rgba(0,0,0,0.02)' }}>
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
                  startAdornment: <InputAdornment position="start"><Person sx={{ color: '#6D28D9', opacity: 0.8 }} /></InputAdornment>,
                }}
                sx={inputStyle}
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
              <Box sx={{ p: 2.5, bgcolor: '#fdfcfb', borderRadius: 3, border: '1px solid rgba(0,0,0,0.04)' }}>
                <Typography variant="caption" sx={{ color: 'secondary.main', fontWeight: 800, mb: 2, display: 'block' }}>
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
                      startAdornment: <InputAdornment position="start"><Person sx={{ color: '#888' }} /></InputAdornment>,
                    }}
                    sx={inputStyle}
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
                          startAdornment: <InputAdornment position="start"><Phone sx={{ color: '#888' }} /></InputAdornment>,
                        }}
                        sx={inputStyle}
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
                          startAdornment: <InputAdornment position="start"><LocationOn sx={{ color: '#888' }} /></InputAdornment>,
                        }}
                        sx={inputStyle}
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
                  startAdornment: <InputAdornment position="start"><Receipt sx={{ color: '#6D28D9', opacity: 0.8 }} /></InputAdornment>,
                }}
                sx={{ ...inputStyle, pointerEvents: 'none', opacity: 0.8 }}
              />
            </Box>

            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ar">
                  <DatePicker 
                    label="تاريخ الإصدار" 
                    value={issueDate} 
                    onChange={(val) => setIssueDate(val)}
                    slotProps={{ 
                      textField: { 
                        fullWidth: true, 
                        variant: 'outlined',
                        sx: inputStyle,
                        InputProps: {
                          startAdornment: <InputAdornment position="start"><CalendarToday sx={{ color: '#6D28D9', opacity: 0.8, fontSize: 20 }} /></InputAdornment>,
                        }
                      } 
                    }}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ar">
                  <DatePicker 
                    label="تاريخ الاستحقاق" 
                    value={dueDate} 
                    onChange={(val) => setDueDate(val)}
                    slotProps={{ 
                      textField: { 
                        fullWidth: true, 
                        variant: 'outlined',
                        sx: inputStyle,
                        InputProps: {
                          startAdornment: <InputAdornment position="start"><CalendarToday sx={{ color: '#6D28D9', opacity: 0.8, fontSize: 20 }} /></InputAdornment>,
                        }
                      } 
                    }}
                  />
                </LocalizationProvider>
              </Grid>
            </Grid>
          </Stack>
        </Paper>

        {/* Items */}
        <Box sx={{ mb: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2} px={1}>
            <Typography variant="h6" fontWeight={800} sx={{ color: 'text.primary' }}>البنود</Typography>
            <Button 
              startIcon={<Add />} 
              onClick={handleAddItem}
              sx={{ 
                bgcolor: 'rgba(74,93,74,0.1)', 
                color: '#6D28D9', 
                fontWeight: 800, 
                borderRadius: 3,
                px: 2,
                '&:hover': { bgcolor: 'rgba(74,93,74,0.2)' }
              }}
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
                  p: 2.5, 
                  borderRadius: 4, 
                  border: '1px solid', 
                  borderColor: 'divider',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'transform 0.2s',
                  '&:active': { transform: 'scale(0.99)' }
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
                    placeholder="وصف البند / الخدمة" 
                    value={item.description}
                    onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                    variant="filled"
                    multiline
                    InputProps={{ disableUnderline: true }}
                    sx={{ 
                      '& .MuiFilledInput-root': { 
                        borderRadius: 3, 
                        bgcolor: 'rgba(0,0,0,0.03)', 
                        fontSize: '1rem', 
                        fontWeight: 500 
                      } 
                    }}
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
                        variant="filled"
                        InputProps={{ disableUnderline: true, inputProps: { min: 1 } }}
                        sx={{ '& .MuiFilledInput-root': { borderRadius: 3, bgcolor: 'rgba(0,0,0,0.03)' } }}
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
                        variant="filled"
                        InputProps={{ disableUnderline: true }}
                        sx={{ '& .MuiFilledInput-root': { borderRadius: 3, bgcolor: 'rgba(0,0,0,0.03)' } }}
                      />
                    </Grid>
                    <Grid size={{ xs: 4 }}>
                      <Box sx={{ 
                        height: '100%', 
                        display: 'flex', 
                        flexDirection: 'column',
                        justifyContent: 'center', 
                        alignItems: 'center',
                        bgcolor: '#5B21B6', 
                        borderRadius: 3, 
                        color: 'white',
                        py: 1
                      }}>
                        <Typography variant="caption" sx={{ opacity: 0.7 }}>الإجمالي</Typography>
                        <Typography fontWeight={800}>{Math.round(item.total)}</Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Stack>
              </Paper>
            ))}
          </Stack>
        </Box>

        {/* Tax & Notes */}
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 4, mb: 2, border: '1px solid', borderColor: 'divider' }}>
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
                  variant="filled"
                  InputProps={{ 
                    disableUnderline: true,
                    endAdornment: <Typography variant="caption" sx={{ ml: 1 }}>%</Typography> 
                  }}
                  sx={{ width: 80, '& .MuiFilledInput-root': { borderRadius: 2, bgcolor: 'rgba(0,0,0,0.04)', px: 1 } }}
                />
              </Stack>
              <Typography fontWeight={700} color="text.secondary">{Math.round(taxAmount)} د.ل</Typography>
            </Stack>

            <Divider />

            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h6" fontWeight={800}>الإجمالي النهائي</Typography>
              <Typography variant="h5" fontWeight={900} color="primary">{Math.round(total)} د.ل</Typography>
            </Stack>
          </Stack>
        </Paper>

        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 4, mb: 10, border: '1px solid', borderColor: 'divider' }}>
          <TextField
            label="ملاحظات وشروط" 
            multiline 
            rows={3} 
            fullWidth 
            value={notes} 
            onChange={(e) => setNotes(e.target.value)}
            variant="filled"
            InputProps={{ disableUnderline: true }}
            sx={{ '& .MuiFilledInput-root': { borderRadius: 3, bgcolor: 'rgba(0,0,0,0.04)' } }}
          />
        </Paper>
      </Container>

      {/* Sticky Save Button */}
      <Box sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, p: 2, pb: 'calc(env(safe-area-inset-bottom) + 16px)', bgcolor: 'background.paper', borderTop: '1px solid', borderColor: 'divider', zIndex: 1300, boxShadow: '0 -4px 10px rgba(0,0,0,0.05)' }}>
        <Container maxWidth="sm">
          <Button
            variant="contained" fullWidth size="large"
            startIcon={<Save />}
            onClick={handleSubmit}
            disabled={loading}
            sx={{
              py: 1.5, borderRadius: 2.5, fontWeight: 800, fontSize: '1rem',
              bgcolor: '#6D28D9', '&:hover': { bgcolor: '#5B21B6' },
              boxShadow: '0 4px 14px rgba(74,93,74,0.4)',
            }}
          >
            {loading ? 'جاري الحفظ...' : (editId ? 'تحديث البيانات' : 'حفظ الفاتورة')}
          </Button>
        </Container>
      </Box>
    </Box>
  );
};

