// @ts-nocheck
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Button, Typography, Stack, Container,
  IconButton, Dialog, TextField,
  useTheme, Chip, MenuItem, Select, FormControl,
  InputLabel, Divider, Collapse, Fab, Autocomplete,
} from '@mui/material';
import {
  ArrowForward, Add, Download, Share, Delete,
  Edit, ExpandMore, ExpandLess, Description,
  Close, AddCircleOutline, RemoveCircleOutline,
  Person, PersonAdd,
} from '@mui/icons-material';
import { useAuthStore } from '../../store/useAuthStore';
import { useDataStore } from '../../store/useDataStore';
import { downloadPdf, sharePdf } from '../../utils/pdfService';
import { LetterPDF } from '../../features/pdf/LetterPDF';
import type { Letter, LetterType } from '../../types';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import 'dayjs/locale/ar';
import React from 'react';

dayjs.locale('ar');



// ── Labels ──
const typeLabels: Record<LetterType, string> = { official: 'خطاب رسمي', offer: 'عرض سعر', entitlement: 'مستخلص' };
const typeColors: Record<LetterType, string> = { official: '#A78BFA', offer: '#60A5FA', entitlement: '#FBBF24' };

// ── Preset Greetings ──
const GREETINGS = [
  'بسم الله الرحمن الرحيم\nالسلام عليكم ورحمة الله وبركاته\nتحية طيبة وبعد',
  'بسم الله الرحمن الرحيم\nالسلام عليكم ورحمة الله وبركاته',
  'السلام عليكم ورحمة الله وبركاته\nتحية طيبة وبعد',
  'تحية طيبة وبعد',
  'السلام عليكم ورحمة الله وبركاته',
];

// ── Preset Closings ──
const CLOSINGS = [
  'وفي انتظار ردكم الكريم\nوتقبلوا فائق الاحترام والتقدير',
  'شاكرين لكم حسن تعاونكم\nوتقبلوا فائق الاحترام والتقدير',
  'نأمل أن ينال اهتمامكم ونتطلع للتعاون معكم\nوتقبلوا خالص الشكر والتقدير',
  'والله ولي التوفيق\nوتقبلوا فائق الاحترام والتقدير',
  'نرجو التكرم بالموافقة على ما ذكر أعلاه\nوتقبلوا وافر الاحترام والتقدير',
  'راجين من سيادتكم الاطلاع واتخاذ اللازم\nوالسلام عليكم ورحمة الله وبركاته',
];

const fmtDate = (d: string) => dayjs(d).format('DD/MM/YYYY');

const createDefault = (): Partial<Letter> => ({
  type: 'official',
  refNumber: `ETL-${dayjs().format('YYYYMMDD')}-${String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')}`,
  date: dayjs().format('YYYY-MM-DD'),
  recipientName: '', recipientTitle: '', recipientAddress: '', recipientPhone: '', clientId: '',
  subject: '',
  greeting: GREETINGS[0],
  bodyParagraphs: [''],
  notes: '',
  closing: CLOSINGS[0],
  signerName: '', signerTitle: 'المدير العام', showStamp: true,
});

export const LettersPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { user } = useAuthStore();
  const { clients, letters, addLetter, updateLetter, deleteLetter } = useDataStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [useExistingClient, setUseExistingClient] = useState(true);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Letter>>(createDefault());

  const cardBg = isDark ? 'rgba(30,37,30,0.85)' : '#ffffff';
  const cardBorder = isDark ? 'rgba(200,192,176,0.08)' : 'rgba(74,93,74,0.06)';

  const clientOptions = useMemo(() =>
    clients.map(c => ({ id: c.id, label: c.name, phone: c.phone, address: c.address })),
    [clients]
  );

  // ── Handlers ──
  const openAdd = () => {
    setForm({ ...createDefault(), signerName: user?.displayName || '' });
    setEditingId(null); setUseExistingClient(true); setSelectedClientId(null);
    setDialogOpen(true);
  };
  const openEdit = (letter: Letter) => {
    setForm({ ...letter, bodyParagraphs: letter.bodyParagraphs?.length ? letter.bodyParagraphs : [''] });
    setEditingId(letter.id);
    setUseExistingClient(!!letter.clientId); setSelectedClientId(letter.clientId || null);
    setDialogOpen(true);
  };
  const handleClientSelect = (clientId: string | null) => {
    setSelectedClientId(clientId);
    if (clientId) {
      const c = clients.find(x => x.id === clientId);
      if (c) setForm(p => ({ ...p, clientId: c.id, recipientName: c.name, recipientAddress: c.address || '', recipientPhone: c.phone || '' }));
    }
  };
  const handleSave = async () => {
    if (!form.recipientName?.trim() || !form.subject?.trim()) { toast.error('يرجى ملء اسم المستلم والموضوع'); return; }
    const now = dayjs().toISOString();
    const data: Letter = {
      id: editingId || crypto.randomUUID(), type: form.type as LetterType,
      refNumber: form.refNumber || '', date: form.date || dayjs().format('YYYY-MM-DD'),
      recipientName: form.recipientName || '', recipientTitle: form.recipientTitle || '',
      recipientAddress: form.recipientAddress || '', recipientPhone: form.recipientPhone || '',
      clientId: useExistingClient ? selectedClientId || '' : '',
      subject: form.subject || '', greeting: form.greeting || GREETINGS[0],
      bodyParagraphs: ((form.bodyParagraphs || ['']).filter(p => p.trim())).length
        ? (form.bodyParagraphs || ['']).filter(p => p.trim())
        : [''],
      notes: form.notes || '', closing: form.closing || CLOSINGS[0],
      signerName: form.signerName || '', signerTitle: form.signerTitle || '',
      showStamp: form.showStamp !== false, createdAt: editingId ? form.createdAt || now : now,
    };
    if (editingId) {
      await updateLetter(editingId, data);
    } else {
      await addLetter(data);
    }
    setDialogOpen(false);
    toast.success(editingId ? 'تم تحديث الرسالة' : 'تم إنشاء الرسالة');
  };
  const handleDelete = async (id: string) => {
    await deleteLetter(id);
    setExpandedId(null); toast.success('تم حذف الرسالة');
  };
  const updateForm = (f: string, v: any) => setForm(p => ({ ...p, [f]: v }));
  const updateParagraph = (i: number, v: string) => {
    const ps = [...(form.bodyParagraphs || [''])]; ps[i] = v;
    setForm(p => ({ ...p, bodyParagraphs: ps }));
  };
  const addParagraph = () => setForm(p => ({ ...p, bodyParagraphs: [...(p.bodyParagraphs || ['']), ''] }));
  const removeParagraph = (i: number) => {
    const ps = (form.bodyParagraphs || ['']).filter((_, x) => x !== i);
    setForm(p => ({ ...p, bodyParagraphs: ps.length ? ps : [''] }));
  };

  const withPdf = async (fn: () => Promise<void>) => { setPdfLoading(true); try { await fn(); } finally { setPdfLoading(false); } };
  const handleDownload = (l: Letter) => withPdf(() => downloadPdf(React.createElement(LetterPDF, { letter: l }), `${typeLabels[l.type]}-${l.refNumber}`));
  const handleShare = (l: Letter) => withPdf(() => sharePdf(React.createElement(LetterPDF, { letter: l }), `${typeLabels[l.type]}-${l.refNumber}`, `${typeLabels[l.type]} - ${l.subject}`));

  return (
    <Box sx={{ pb: 10 }}>

      {/* ── Header ── */}
      <Box sx={{
        background: 'linear-gradient(135deg,#1B0F3B 0%,#4C1D95 50%,#6D28D9 100%)',
        pt: 3, pb: 4, px: 2.5, borderRadius: '0 0 28px 28px',
        boxShadow: '0 12px 40px rgba(109,40,217,0.25)', position: 'relative', overflow: 'hidden',
      }}>
        <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" alignItems="center" gap={1.5}>
              <Box>
                <Typography variant="h6" sx={{ color: '#fff', fontWeight: 800, textAlign: 'right' }}>الرسائل الرسمية</Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600, textAlign: 'right', display: 'block' }}>
                  خطابات وعروض أسعار ومستخلصات
                </Typography>
              </Box>
              <Box sx={{ width: 44, height: 44, borderRadius: '12px', background: 'linear-gradient(135deg,rgba(245,158,11,0.25),rgba(245,158,11,0.08))', border: '1px solid rgba(245,158,11,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Description sx={{ fontSize: 22, color: '#FBBF24' }} />
              </Box>
            </Stack>
          </Stack>
          <Stack direction="row" spacing={1} sx={{ mt: 2.5 }}>
            {(['official', 'offer', 'entitlement'] as LetterType[]).map(t => (
              <Box key={t} sx={{ flex: 1, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.06)', borderRadius: 2, py: 1 }}>
                <Typography sx={{ fontSize: '1.2rem', fontWeight: 900, color: typeColors[t], fontFamily: 'Outfit' }}>{letters.filter(l => l.type === t).length}</Typography>
                <Typography sx={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>{typeLabels[t]}</Typography>
              </Box>
            ))}
          </Stack>
        </Container>
      </Box>

      {/* ── Content ── */}
      <Container maxWidth="sm" sx={{ mt: -1.5, position: 'relative', zIndex: 1 }}>
        {letters.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8, px: 3, bgcolor: cardBg, borderRadius: 0, border: `1px solid ${cardBorder}`, mt: 3 }}>
            <Description sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
            <Typography color="text.secondary" fontWeight={600}>لا توجد رسائل</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, mb: 2 }}>أنشئ أول خطاب رسمي</Typography>
            <Button variant="contained" startIcon={<Add />} onClick={openAdd} size="small" sx={{ borderRadius: 1 }}>إنشاء رسالة</Button>
          </Box>
        ) : (
          <Stack spacing={1.5} sx={{ mt: 2 }}>
            {letters.map(letter => {
              const isExp = expandedId === letter.id;
              const tc = typeColors[letter.type];
              return (
                <Box key={letter.id} sx={{
                  bgcolor: cardBg,
                  borderTop: `3px solid ${tc}`,
                  boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.06)',
                  overflow: 'hidden',
                  transition: 'box-shadow 0.2s',
                  '&:hover': { boxShadow: isDark ? '0 4px 16px rgba(0,0,0,0.4)' : '0 4px 16px rgba(0,0,0,0.1)' },
                }}>
                  {/* Card Header */}
                  <Box onClick={() => setExpandedId(isExp ? null : letter.id)}
                    sx={{ cursor: 'pointer', p: 2, display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    {/* Type indicator */}
                    <Box sx={{
                      width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      bgcolor: `${tc}10`, border: `1px solid ${tc}25`, flexShrink: 0, mt: 0.3,
                    }}>
                      <Description sx={{ fontSize: 18, color: tc }} />
                    </Box>
                    {/* Info */}
                    <Box sx={{ flex: 1, textAlign: 'right', minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', mb: 0.5, lineHeight: 1.3 }}>{letter.subject}</Typography>
                      <Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap>
                        <Typography variant="caption" sx={{ color: tc, fontWeight: 700, fontSize: '0.65rem', bgcolor: `${tc}10`, px: 0.8, py: 0.2 }}>
                          {typeLabels[letter.type]}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                          {letter.recipientName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'Outfit', fontSize: '0.7rem', opacity: 0.7 }}>
                          {fmtDate(letter.date)}
                        </Typography>
                      </Stack>
                    </Box>
                    {/* Arrow */}
                    <Box sx={{ color: 'text.secondary', mt: 0.5 }}>
                      {isExp ? <ExpandLess sx={{ fontSize: 20 }} /> : <ExpandMore sx={{ fontSize: 20 }} />}
                    </Box>
                  </Box>

                  {/* Expanded Details */}
                  <Collapse in={isExp}>
                    <Box sx={{ px: 2, pb: 2 }}>
                      <Divider sx={{ mb: 1.5 }} />
                      {/* Info Grid */}
                      <Box sx={{ bgcolor: isDark ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.02)', p: 1.5, mb: 1.5 }}>
                        <Stack spacing={0.8}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="caption" sx={{ fontFamily: 'Outfit', fontWeight: 700, letterSpacing: 0.5 }}>{letter.refNumber}</Typography>
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>رقم المرجع</Typography>
                          </Stack>
                          {letter.recipientTitle && (
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                              <Typography variant="caption" fontWeight={600}>{letter.recipientTitle}</Typography>
                              <Typography variant="caption" color="text.secondary" fontWeight={600}>الصفة</Typography>
                            </Stack>
                          )}
                          {letter.recipientPhone && (
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                              <Typography variant="caption" fontWeight={600} sx={{ fontFamily: 'Outfit' }}>{letter.recipientPhone}</Typography>
                              <Typography variant="caption" color="text.secondary" fontWeight={600}>الهاتف</Typography>
                            </Stack>
                          )}
                          {letter.recipientAddress && (
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                              <Typography variant="caption" fontWeight={600}>{letter.recipientAddress}</Typography>
                              <Typography variant="caption" color="text.secondary" fontWeight={600}>العنوان</Typography>
                            </Stack>
                          )}
                        </Stack>
                      </Box>
                      {/* Actions */}
                      <Stack direction="row" spacing={1} justifyContent="flex-end" flexWrap="wrap" useFlexGap>
                        <IconButton size="small" onClick={() => handleDelete(letter.id)}
                          sx={{ color: '#d64545', bgcolor: 'rgba(214,69,69,0.06)', '&:hover': { bgcolor: 'rgba(214,69,69,0.12)' } }}>
                          <Delete sx={{ fontSize: 18 }} />
                        </IconButton>
                        <IconButton size="small" onClick={() => openEdit(letter)}
                          sx={{ color: '#5a8fc4', bgcolor: 'rgba(90,143,196,0.06)', '&:hover': { bgcolor: 'rgba(90,143,196,0.12)' } }}>
                          <Edit sx={{ fontSize: 18 }} />
                        </IconButton>
                        <Button size="small" variant="outlined" startIcon={<Share sx={{ fontSize: 15 }} />}
                          onClick={() => handleShare(letter)} disabled={pdfLoading}
                          sx={{ fontSize: '0.7rem', borderRadius: 1, px: 1.5, minWidth: 'auto' }}>
                          مشاركة
                        </Button>
                        <Button size="small" variant="contained" startIcon={<Download sx={{ fontSize: 15 }} />}
                          onClick={() => handleDownload(letter)} disabled={pdfLoading}
                          sx={{ fontSize: '0.7rem', borderRadius: 1, px: 1.5, minWidth: 'auto' }}>
                          PDF
                        </Button>
                      </Stack>
                    </Box>
                  </Collapse>
                </Box>
              );
            })}
          </Stack>
        )}
      </Container>

      {/* ── FAB ── */}
      <Fab onClick={openAdd} size="medium" sx={{
        position: 'fixed', bottom: 'calc(env(safe-area-inset-bottom) + 96px)', left: '50%', transform: 'translateX(-50%)',
        bgcolor: isDark ? '#8B5CF6' : '#6D28D9', color: '#fff', zIndex: 999,
        boxShadow: '0 6px 20px rgba(74,93,74,0.5)',
        '&:hover': { bgcolor: isDark ? '#A78BFA' : '#5B21B6' },
      }}>
        <Add />
      </Fab>

      {/* ═══ DIALOG ═══ */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullScreen
        PaperProps={{ sx: { bgcolor: isDark ? '#151a15' : '#f5f3ef', backgroundImage: 'none' } }}>
        {/* Top bar */}
        <Box sx={{ bgcolor: isDark ? 'var(--surface-panel)' : '#fff', borderBottom: `1px solid ${cardBorder}`, px: 2, pt: 'calc(env(safe-area-inset-top) + 12px)', pb: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <IconButton onClick={() => setDialogOpen(false)} size="small"><Close /></IconButton>
          <Typography fontWeight={800} sx={{ flex: 1, textAlign: 'center' }}>{editingId ? 'تعديل الرسالة' : 'رسالة جديدة'}</Typography>
          <Button variant="contained" size="small" onClick={handleSave} sx={{ borderRadius: 1, px: 3, fontWeight: 700 }}>حفظ</Button>
        </Box>

        <Box sx={{ overflow: 'auto', flex: 1, px: 2, py: 2 }}>
          <Container maxWidth="sm" disableGutters>
            <Stack spacing={2}>

              {/* Type */}
              <FormControl fullWidth size="small">
                <InputLabel>نوع الرسالة</InputLabel>
                <Select value={form.type || 'official'} label="نوع الرسالة" onChange={e => updateForm('type', e.target.value)}>
                  <MenuItem value="official">خطاب رسمي</MenuItem>
                  <MenuItem value="offer">عرض سعر</MenuItem>
                  <MenuItem value="entitlement">مستخلص</MenuItem>
                </Select>
              </FormControl>

              {/* Ref & Date */}
              <Stack direction="row" spacing={1.5}>
                <TextField fullWidth size="small" label="رقم المرجع" value={form.refNumber || ''} onChange={e => updateForm('refNumber', e.target.value)} InputProps={{ sx: { fontFamily: 'Outfit' } }} />
                <TextField fullWidth size="small" label="التاريخ" type="date" value={form.date || ''} onChange={e => updateForm('date', e.target.value)} InputLabelProps={{ shrink: true }} />
              </Stack>

              {/* ═══ RECIPIENT ═══ */}
              <Typography variant="subtitle2" fontWeight={700} color="primary">المستلم</Typography>
              <Stack direction="row" justifyContent="center" sx={{ mb: -0.5 }}>
                <Stack direction="row" spacing={0.5} sx={{ bgcolor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.04)', borderRadius: 1, p: 0.5 }}>
                  <Button size="small" variant={useExistingClient ? 'contained' : 'text'}
                    onClick={() => { setUseExistingClient(true); setSelectedClientId(null); setForm(p => ({ ...p, recipientName: '', recipientAddress: '', recipientPhone: '' })); }}
                    startIcon={<Person sx={{ fontSize: 15 }} />}
                    sx={{ borderRadius: 0.5, fontSize: '0.72rem', px: 2, fontWeight: 700, ...(useExistingClient ? {} : { color: 'text.secondary' }) }}>
                    من العملاء
                  </Button>
                  <Button size="small" variant={!useExistingClient ? 'contained' : 'text'}
                    onClick={() => { setUseExistingClient(false); setSelectedClientId(null); setForm(p => ({ ...p, clientId: '', recipientName: '', recipientAddress: '', recipientPhone: '' })); }}
                    startIcon={<PersonAdd sx={{ fontSize: 15 }} />}
                    sx={{ borderRadius: 0.5, fontSize: '0.72rem', px: 2, fontWeight: 700, ...(!useExistingClient ? { bgcolor: '#c9a54e', '&:hover': { bgcolor: '#b8943d' } } : { color: 'text.secondary' }) }}>
                    عميل مؤقت
                  </Button>
                </Stack>
              </Stack>

              {useExistingClient ? (
                <Autocomplete options={clientOptions} value={clientOptions.find(c => c.id === selectedClientId) || null}
                  onChange={(_, v) => handleClientSelect(v?.id || null)} getOptionLabel={o => o.label}
                  renderInput={p => <TextField {...p} size="small" label="اختر عميل" placeholder="ابحث..." />}
                  noOptionsText="لا يوجد عملاء" />
              ) : (
                <TextField fullWidth size="small" label="اسم المستلم *" value={form.recipientName || ''} onChange={e => updateForm('recipientName', e.target.value)} />
              )}
              <TextField fullWidth size="small" label="صفة المستلم (اختياري)" value={form.recipientTitle || ''} onChange={e => updateForm('recipientTitle', e.target.value)} />
              <Stack direction="row" spacing={1}>
                <TextField fullWidth size="small" label="العنوان" value={form.recipientAddress || ''} onChange={e => updateForm('recipientAddress', e.target.value)} />
                <TextField fullWidth size="small" label="الهاتف" value={form.recipientPhone || ''} onChange={e => updateForm('recipientPhone', e.target.value)} InputProps={{ sx: { fontFamily: 'Outfit' } }} />
              </Stack>

              {/* Subject */}
              <TextField fullWidth size="small" label="الموضوع *" value={form.subject || ''} onChange={e => updateForm('subject', e.target.value)} />

              {/* ═══ GREETING PRESETS ═══ */}
              <Typography variant="subtitle2" fontWeight={700} color="primary">البداية</Typography>
              <FormControl fullWidth size="small">
                <InputLabel>اختر بداية</InputLabel>
                <Select value={GREETINGS.includes(form.greeting || '') ? form.greeting : 'custom'} label="اختر بداية"
                  onChange={e => { if (e.target.value !== 'custom') updateForm('greeting', e.target.value); }}>
                  {GREETINGS.map((g, i) => (
                    <MenuItem key={i} value={g} sx={{ whiteSpace: 'pre-line', py: 1, fontSize: '0.85rem' }}>{g}</MenuItem>
                  ))}
                  <MenuItem value="custom" sx={{ color: 'primary.main', fontWeight: 700 }}>كتابة يدوية</MenuItem>
                </Select>
              </FormControl>
              <TextField fullWidth size="small" multiline minRows={2} label="نص البداية" value={form.greeting || ''} onChange={e => updateForm('greeting', e.target.value)} />

              {/* Body */}
              <Typography variant="subtitle2" fontWeight={700} color="primary">نص الرسالة</Typography>
              {(form.bodyParagraphs || ['']).map((para, i) => (
                <Box key={i} sx={{ position: 'relative' }}>
                  <TextField fullWidth size="small" multiline minRows={2} label={`الفقرة ${i + 1}`} value={para} onChange={e => updateParagraph(i, e.target.value)} />
                  {(form.bodyParagraphs || []).length > 1 && (
                    <IconButton size="small" onClick={() => removeParagraph(i)}
                      sx={{ position: 'absolute', top: -8, left: -8, bgcolor: 'error.main', color: '#fff', width: 20, height: 20, '&:hover': { bgcolor: 'error.dark' } }}>
                      <RemoveCircleOutline sx={{ fontSize: 13 }} />
                    </IconButton>
                  )}
                </Box>
              ))}
              <Button size="small" startIcon={<AddCircleOutline />} onClick={addParagraph} sx={{ alignSelf: 'flex-end', fontSize: '0.75rem' }}>إضافة فقرة</Button>

              {/* Notes */}
              <TextField fullWidth size="small" multiline minRows={2} label="ملاحظات (اختياري)" value={form.notes || ''} onChange={e => updateForm('notes', e.target.value)} />

              {/* ═══ CLOSING PRESETS ═══ */}
              <Typography variant="subtitle2" fontWeight={700} color="primary">الخاتمة</Typography>
              <FormControl fullWidth size="small">
                <InputLabel>اختر خاتمة</InputLabel>
                <Select value={CLOSINGS.includes(form.closing || '') ? form.closing : 'custom'} label="اختر خاتمة"
                  onChange={e => { if (e.target.value !== 'custom') updateForm('closing', e.target.value); }}>
                  {CLOSINGS.map((c, i) => (
                    <MenuItem key={i} value={c} sx={{ whiteSpace: 'pre-line', py: 1, fontSize: '0.85rem' }}>{c}</MenuItem>
                  ))}
                  <MenuItem value="custom" sx={{ color: 'primary.main', fontWeight: 700 }}>كتابة يدوية</MenuItem>
                </Select>
              </FormControl>
              <TextField fullWidth size="small" multiline minRows={2} label="نص الخاتمة" value={form.closing || ''} onChange={e => updateForm('closing', e.target.value)} />

              {/* Signer */}
              <Typography variant="subtitle2" fontWeight={700} color="primary">التوقيع والختم</Typography>
              <Stack direction="row" spacing={1.5}>
                <TextField fullWidth size="small" label="اسم الموقع" value={form.signerName || ''} onChange={e => updateForm('signerName', e.target.value)} />
                <TextField fullWidth size="small" label="الصفة" value={form.signerTitle || ''} onChange={e => updateForm('signerTitle', e.target.value)} />
              </Stack>
              <Stack direction="row" alignItems="center" justifyContent="flex-end" spacing={1}>
                <Typography variant="body2" fontWeight={600}>إظهار الختم</Typography>
                <Button variant={form.showStamp ? 'contained' : 'outlined'} size="small" onClick={() => updateForm('showStamp', !form.showStamp)} sx={{ borderRadius: 1, minWidth: 50 }}>
                  {form.showStamp ? 'نعم' : 'لا'}
                </Button>
              </Stack>

              <Box sx={{ height: 40 }} />
            </Stack>
          </Container>
        </Box>
      </Dialog>
    </Box>
  );
};
