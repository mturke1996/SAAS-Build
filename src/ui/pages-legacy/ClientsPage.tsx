import { useState, useMemo } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Dialog,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Container,
  Avatar,
  Stack,
  useTheme,
} from '@mui/material';
import {
  Add,
  Search,
  Edit,
  Delete,
  Business,
  Person,
  ChevronLeft,
  ArrowBack,
  People,
  Phone,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useDataStore } from '../../store/useDataStore';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Client } from '../../types';
import { formatCurrency } from '../../utils/formatters';

const clientSchema = z.object({
  name: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل'),
  email: z.string().email('البريد الإلكتروني غير صحيح').or(z.literal('')).optional(),
  phone: z.string().min(8, 'رقم الهاتف غير صحيح'),
  address: z.string().min(3, 'العنوان يجب أن يكون 3 أحرف على الأقل'),
  type: z.enum(['company', 'individual']),
});

type ClientFormData = z.infer<typeof clientSchema>;

export const ClientsPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { clients, expenses, standaloneDebts, payments, addClient, updateClient, deleteClient } = useDataStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      address: '',
      type: 'individual',
    },
  });

  const filteredClients = useMemo(() => {
    return clients.filter((client) =>
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.phone.includes(searchQuery)
    );
  }, [clients, searchQuery]);

  const getClientStats = (clientId: string) => {
    const clientExpenses = expenses.filter((exp) => exp.clientId === clientId);
    const clientPayments = payments.filter((pay) => pay.clientId === clientId);
    const totalExpenses = clientExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const totalPaid = clientPayments.reduce((sum, pay) => sum + pay.amount, 0);
    return { totalExpenses, totalPaid, remaining: totalPaid - totalExpenses };
  };

  const handleOpenDialog = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      reset({
        name: client.name,
        email: client.email || '',
        phone: client.phone,
        address: client.address,
        type: client.type,
      });
    } else {
      setEditingClient(null);
      reset({ name: '', email: '', phone: '', address: '', type: 'individual' });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingClient(null);
    reset();
  };

  const onSubmit = (data: ClientFormData) => {
    if (editingClient) {
      updateClient(editingClient.id, data);
    } else {
      const newClient: Client = {
        ...data,
        name: data.name!,
        email: data.email || '',
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Client;
      addClient(newClient);
    }
    handleCloseDialog();
  };

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(180deg, #1a1f1a 0%, #151a15 100%)'
          : 'linear-gradient(180deg, #f5f3ef 0%, #ede9e3 100%)',
        pb: 3,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          background: theme.palette.mode === 'light'
            ? 'linear-gradient(160deg, #364036 0%, #4a5d4a 100%)'
            : 'linear-gradient(160deg, #2a3a2a 0%, #364036 100%)',
          pt: 'calc(env(safe-area-inset-top) + 24px)',
          pb: 4,
          px: 2,
          borderRadius: '0 0 28px 28px',
          boxShadow: theme.palette.mode === 'light'
            ? '0 8px 32px -8px rgba(74, 93, 74, 0.3)'
            : '0 8px 32px -8px rgba(0, 0, 0, 0.4)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'radial-gradient(ellipse at 70% 20%, rgba(200, 192, 176, 0.08) 0%, transparent 50%)',
            pointerEvents: 'none',
          },
        }}
      >
        <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
            <IconButton onClick={() => navigate('/')} sx={{ color: 'rgba(255,255,255,0.9)', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}>
              <ArrowBack />
            </IconButton>
            <Typography variant="h5" fontWeight={800} sx={{ color: 'white', flexGrow: 1, letterSpacing: 0.3 }}>
              العملاء ({clients.length})
            </Typography>
            <Button
              variant="contained"
              onClick={() => handleOpenDialog()}
              sx={{
                bgcolor: 'rgba(200, 192, 176, 0.9)',
                color: '#ffffffff',
                fontWeight: 700,
                '&:hover': { bgcolor: '#c8c0b0', transform: 'scale(1.04)' },
                borderRadius: 2.5,
                px: 2.5,
                boxShadow: '0 4px 14px -3px rgba(200, 192, 176, 0.4)',
                transition: 'all 0.25s ease',
              }}
              startIcon={<Add />}
            >
              جديد
            </Button>
          </Stack>

          {/* Search */}
          <TextField
            fullWidth
            placeholder="ابحث بالاسم أو رقم الهاتف..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: 'rgba(255,255,255,0.92)',
                borderRadius: '10px',
                '& fieldset': { border: 'none' },
                '&:hover': { bgcolor: 'white' },
                '&.Mui-focused': { bgcolor: 'white' },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: 'rgba(0,0,0,0.35)' }} />
                </InputAdornment>
              ),
            }}
          />
        </Container>
      </Box>

      {/* Clients List */}
      <Container maxWidth="sm" sx={{ mt: 1, pt: 1 }}>
        <Stack spacing={2}>
          {filteredClients.length === 0 ? (
            <Card sx={{ borderRadius: 3, textAlign: 'center', py: 6, bgcolor: 'background.paper' }}>
              <People sx={{ fontSize: 56, color: 'text.secondary', opacity: 0.2, mb: 2 }} />
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
                لا يوجد عملاء
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => handleOpenDialog()}
                sx={{
                  mt: 2, borderRadius: 2.5,
                  bgcolor: '#4a5d4a',
                  '&:hover': { bgcolor: '#364036' },
                  boxShadow: '0 4px 14px -3px rgba(74, 93, 74, 0.35)',
                }}
              >
                إضافة أول عميل
              </Button>
            </Card>
          ) : (
            filteredClients.map((client) => {
              const stats = getClientStats(client.id);
              return (
                <Card
                  key={client.id}
                  onClick={() => navigate(`/clients/${client.id}`)}
                  sx={{
                    borderRadius: 3,
                    boxShadow: theme.palette.mode === 'light'
                      ? '0 2px 12px -2px rgba(74, 93, 74, 0.07)'
                      : '0 4px 20px rgba(0,0,0,0.35)',
                    cursor: 'pointer',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    bgcolor: 'background.paper',
                    border: theme.palette.mode === 'dark' ? '1px solid rgba(107, 127, 107, 0.08)' : '1px solid rgba(74, 93, 74, 0.04)',
                    '&:hover': {
                      boxShadow: theme.palette.mode === 'light'
                        ? '0 10px 32px -6px rgba(74, 93, 74, 0.12)'
                        : '0 12px 40px rgba(0,0,0,0.45)',
                      transform: 'translateY(-3px)',
                    },
                    '&:active': { transform: 'scale(0.98)' },
                  }}
                >
                  <CardContent sx={{ p: 2.5 }}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      {/* Avatar */}
                      <Avatar
                        sx={{
                          width: 50, height: 50,
                          bgcolor: client.type === 'company'
                            ? (theme.palette.mode === 'dark' ? 'rgba(107, 127, 107, 0.15)' : 'rgba(74, 93, 74, 0.08)')
                            : (theme.palette.mode === 'dark' ? 'rgba(200, 192, 176, 0.15)' : 'rgba(200, 192, 176, 0.15)'),
                          flexShrink: 0,
                          border: client.type === 'company'
                            ? '1.5px solid rgba(107, 127, 107, 0.2)'
                            : '1.5px solid rgba(200, 192, 176, 0.3)',
                        }}
                      >
                        {client.type === 'company' ? (
                          <Business sx={{ color: theme.palette.mode === 'dark' ? '#6b7f6b' : '#4a5d4a', fontSize: 22 }} />
                        ) : (
                          <Person sx={{ color: '#c8c0b0', fontSize: 22 }} />
                        )}
                      </Avatar>

                      {/* Client Info */}
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Stack
                          direction={{ xs: 'column', sm: 'row' }}
                          spacing={{ xs: 0.5, sm: 1.5 }}
                          alignItems={{ xs: 'flex-start', sm: 'center' }}
                          sx={{ mb: 0.5 }}
                        >
                          <Typography
                            variant="h6"
                            fontWeight={700}
                            sx={{ fontSize: { xs: '0.95rem', sm: '1.15rem' }, wordBreak: 'break-word', letterSpacing: 0.2 }}
                          >
                            {client.name}
                          </Typography>
                          <Chip
                            label={client.type === 'company' ? 'شركة' : 'فرد'}
                            size="small"
                            sx={{
                              height: 22, fontSize: '0.7rem', fontWeight: 700, flexShrink: 0,
                              bgcolor: client.type === 'company'
                                ? (theme.palette.mode === 'dark' ? 'rgba(107, 127, 107, 0.15)' : 'rgba(74, 93, 74, 0.08)')
                                : (theme.palette.mode === 'dark' ? 'rgba(200, 192, 176, 0.15)' : 'rgba(200, 192, 176, 0.12)'),
                              color: client.type === 'company'
                                ? (theme.palette.mode === 'dark' ? '#6b7f6b' : '#4a5d4a')
                                : '#8b7e6a',
                              border: 'none',
                            }}
                          />
                        </Stack>

                        <Stack direction="row" spacing={1} alignItems="center"
                          sx={{
                            bgcolor: theme.palette.mode === 'dark'
                              ? 'rgba(255,255,255,0.04)'
                              : 'rgba(74, 93, 74, 0.03)',
                            px: 1.5, py: 0.6, borderRadius: 2, mt: 0.5,
                          }}
                        >
                          <Phone sx={{ fontSize: 15, color: 'text.secondary', opacity: 0.6 }} />
                          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, fontSize: { xs: '0.85rem', sm: '0.9rem' } }}>
                            {client.phone}
                          </Typography>
                        </Stack>
                      </Box>

                      {/* Edit button */}
                      <Stack direction="row" spacing={{ xs: 1, sm: 1.5 }} sx={{ marginLeft: '12px', flexShrink: 0 }}>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDialog(client);
                          }}
                          sx={{
                            bgcolor: theme.palette.mode === 'dark' ? 'rgba(107, 127, 107, 0.1)' : 'rgba(74, 93, 74, 0.05)',
                            color: theme.palette.mode === 'dark' ? '#6b7f6b' : '#4a5d4a',
                            width: 36, height: 36,
                            borderRadius: 2,
                            border: '1px solid rgba(74, 93, 74, 0.1)',
                            '&:hover': { bgcolor: 'rgba(74, 93, 74, 0.1)' },
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <Edit sx={{ fontSize: 17 }} />
                        </IconButton>

                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              );
            })
          )}
        </Stack>
      </Container>

      {/* Full-screen Add/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        fullScreen
        sx={{
          '& .MuiDialog-paper': {
            bgcolor: theme.palette.mode === 'dark' ? '#1a1f1a' : '#f5f3ef',
          },
        }}
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <Box
            sx={{
              background: theme.palette.mode === 'light'
                ? 'linear-gradient(160deg, #364036 0%, #4a5d4a 100%)'
                : 'linear-gradient(160deg, #2a3a2a 0%, #364036 100%)',
              color: 'white',
              p: 2,
              pt: 'calc(env(safe-area-inset-top) + 16px)',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                background: 'radial-gradient(ellipse at 70% 50%, rgba(200, 192, 176, 0.08) 0%, transparent 50%)',
                pointerEvents: 'none',
              },
            }}
          >
            <Stack direction="row" alignItems="center" spacing={2} sx={{ position: 'relative', zIndex: 1 }}>
              <IconButton onClick={handleCloseDialog} sx={{ color: 'rgba(255,255,255,0.9)', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}>
                <ArrowBack />
              </IconButton>
              <Typography variant="h6" fontWeight={700} sx={{ letterSpacing: 0.3 }}>
                {editingClient ? 'تعديل عميل' : 'إضافة عميل جديد'}
              </Typography>
            </Stack>
          </Box>

          <Box sx={{ p: 3.5 }}>
            <Stack spacing={3}>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="الاسم"
                    error={!!errors.name}
                    helperText={errors.name?.message}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5, bgcolor: 'background.paper' } }}
                  />
                )}
              />

              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>النوع</InputLabel>
                    <Select {...field} label="النوع" sx={{ borderRadius: 2.5, bgcolor: 'background.paper' }}>
                      <MenuItem value="individual">فرد</MenuItem>
                      <MenuItem value="company">شركة</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />

              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="رقم الهاتف"
                    error={!!errors.phone}
                    helperText={errors.phone?.message}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5, bgcolor: 'background.paper' } }}
                  />
                )}
              />

              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="البريد الإلكتروني (اختياري)"
                    type="email"
                    error={!!errors.email}
                    helperText={errors.email?.message}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5, bgcolor: 'background.paper' } }}
                  />
                )}
              />

              <Controller
                name="address"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="العنوان"
                    multiline
                    rows={3}
                    error={!!errors.address}
                    helperText={errors.address?.message}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5, bgcolor: 'background.paper' } }}
                  />
                )}
              />
            </Stack>

            <Stack direction="row" spacing={2} sx={{ mt: 5 }}>
              <Button
                onClick={handleCloseDialog}
                fullWidth
                size="large"
                sx={{
                  borderRadius: 2.5, py: 1.5, fontWeight: 600,
                  border: theme.palette.mode === 'dark'
                    ? '1px solid rgba(107, 127, 107, 0.2)'
                    : '1px solid rgba(74, 93, 74, 0.15)',
                }}
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                sx={{
                  borderRadius: 2.5, py: 1.5,
                  bgcolor: '#4a5d4a',
                  fontWeight: 700,
                  boxShadow: '0 4px 14px -3px rgba(74, 93, 74, 0.35)',
                  '&:hover': {
                    bgcolor: '#364036',
                    boxShadow: '0 8px 22px -4px rgba(74, 93, 74, 0.4)',
                  },
                }}
              >
                {editingClient ? 'حفظ التعديلات' : 'إضافة العميل'}
              </Button>
            </Stack>
            
            {editingClient && (
              <Button
                variant="outlined"
                color="error"
                fullWidth
                size="large"
                startIcon={<Delete />}
                onClick={() => {
                  if (window.confirm(`هل أنت متأكد من حذف العميل "${editingClient.name}"؟`)) {
                    deleteClient(editingClient.id);
                    handleCloseDialog();
                  }
                }}
                sx={{
                  mt: 2,
                  borderRadius: 2.5, py: 1.5, fontWeight: 700,
                  border: '1px solid rgba(211, 47, 47, 0.4)',
                  '&:hover': { bgcolor: 'rgba(211, 47, 47, 0.04)', border: '1px solid rgba(211, 47, 47, 0.8)' },
                }}
              >
                حذف العميل
              </Button>
            )}
          </Box>
        </form>
      </Dialog>
    </Box>
  );
};
