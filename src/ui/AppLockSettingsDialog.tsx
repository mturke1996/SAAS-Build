import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, FormControlLabel, Checkbox, Typography, Stack,
  IconButton, Box, Divider
} from '@mui/material';
import { Close, Lock, LockOpen, Security, PeopleAlt, ViewModule, CheckCircleOutline, CheckCircle } from '@mui/icons-material';
import { useAppLockStore, AppModule } from '../store/useAppLockStore';
import toast from 'react-hot-toast';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useEffect } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
}

const MODULES: { id: AppModule; label: string }[] = [
  { id: 'stats', label: 'الإحصائيات والأرباح (الرئيسية)' },
  { id: 'clients', label: 'سجل العملاء' },
  { id: 'invoices', label: 'الفواتير' },
  { id: 'payments', label: 'المدفوعات' },
  { id: 'debts', label: 'الديون' },
  { id: 'expenses', label: 'المصروفات' },
  { id: 'users', label: 'المستخدمين' },
  { id: 'workers', label: 'العمال' },
  { id: 'balances', label: 'أرصدة المستخدمين (العهد)' },
  { id: 'letters', label: 'الرسائل الرسمية' },
];

export const AppLockSettingsDialog = ({ open, onClose }: Props) => {
  const { 
    isLocked, 
    unlockedModules, 
    ownerId, 
    exemptUsers, 
    isSessionUnlocked, 
    setPinCode, 
    removePinCode, 
    setUnlockedModules, 
    setExemptUsers,
    unlockSession, 
    lockSession 
  } = useAppLockStore();
  
  const [enteredPin, setEnteredPin] = useState('');
  const [tempModules, setTempModules] = useState<AppModule[]>(unlockedModules);
  const [tempExemptUsers, setTempExemptUsers] = useState<string[]>(exemptUsers || []);
  const [newPin, setNewPin] = useState('');
  const [usersList, setUsersList] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'modules' | 'users'>('modules');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTempModules(unlockedModules);
      setTempExemptUsers(exemptUsers || []);
      
      const q = query(collection(db, 'users'));
      const unsub = onSnapshot(q, (snapshot) => {
        setUsersList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
      return () => unsub();
    }
  }, [open, unlockedModules, exemptUsers]);

  // If locked but session is NOT unlocked, attempting to open settings should first ask for PIN!
  // OR we just show a PIN prompt here if not isSessionUnlocked().
  // Let's assume the parent handles showing a Pin Prompt before rendering this dialog if needed, 
  // OR we just show a PIN prompt here if not isSessionUnlocked().

  if (isLocked && !isSessionUnlocked()) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ textAlign: 'center', pb: 1, pt: 3 }}>
          <Box sx={{ width: 64, height: 64, borderRadius: '50%', bgcolor: 'rgba(214, 69, 69, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
            <Lock sx={{ fontSize: 32, color: '#d64545' }} />
          </Box>
          <Typography variant="h6" fontWeight={800}>الرجاء إدخال الرمز السري</Typography>
        </DialogTitle>
        <DialogContent sx={{ px: 3 }}>
          <TextField
            fullWidth
            type="password"
            placeholder="••••••"
            value={enteredPin}
            onChange={(e) => setEnteredPin(e.target.value)}
            sx={{ 
              mt: 2,
              '& .MuiOutlinedInput-root': { borderRadius: 2.5 }
            }}
            InputProps={{
              inputProps: { style: { textAlign: 'center', letterSpacing: '0.5em', fontSize: '1.4rem', fontWeight: 800 } }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1, flexDirection: 'column', gap: 1 }}>
          <Button 
            variant="contained" 
            fullWidth 
            size="large"
            onClick={() => {
              if (unlockSession(enteredPin)) {
                setTempModules(unlockedModules);
                setTempExemptUsers(exemptUsers || []);
                setEnteredPin('');
              } else {
                toast.error('الرمز السري غير صحيح');
                setEnteredPin('');
              }
            }}
            sx={{ bgcolor: '#4a5d4a', borderRadius: 2.5, fontWeight: 700, py: 1.2 }}
          >
            فتح القفل
          </Button>
          <Button onClick={onClose} fullWidth sx={{ borderRadius: 2.5, m: '0 !important', color: 'text.secondary' }}>إلغاء</Button>
        </DialogActions>
      </Dialog>
    );
  }

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (!isLocked && newPin.length > 0) {
        if (newPin.length < 4) {
          toast.error('يجب أن يكون الرمز من 4 أرقام على الأقل');
          setIsSaving(false);
          return;
        }
        await setPinCode(newPin);
      }
      await setUnlockedModules(tempModules);
      await setExemptUsers(tempExemptUsers);
      toast.success('تم الحفظ بنجاح');
      onClose();
    } catch (error) {
      toast.error('حدث خطأ أثناء الحفظ');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleModule = (modId: AppModule) => {
    if (tempModules.includes(modId)) {
      setTempModules(tempModules.filter(m => m !== modId));
    } else {
      setTempModules([...tempModules, modId]);
    }
  };

  const handleToggleExemptUser = (userId: string) => {
    if (tempExemptUsers.includes(userId)) {
      setTempExemptUsers(tempExemptUsers.filter(id => id !== userId));
    } else {
      setTempExemptUsers([...tempExemptUsers, userId]);
    }
  };

  const handleRemovePin = () => {
    if (window.confirm('هل أنت متأكد من إزالة الرمز السري؟ سيكون التطبيق متاحاً بالكامل للجميع.')) {
      removePinCode();
      setNewPin('');
      toast.success('تمت إزالة الرمز السري');
    }
  };

  const handleLockNow = () => {
    lockSession();
    toast.success('تم قفل التطبيق');
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ style: { borderRadius: 20, overflow: 'hidden' } }}>
      <Box sx={{ p: 2.5, background: 'linear-gradient(160deg, #364036 0%, #4a5d4a 100%)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" fontWeight={800} color="white">إدارة الحماية والصلاحيات</Typography>
        <IconButton onClick={onClose} sx={{ color: 'rgba(255,255,255,0.8)', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }} size="small">
          <Close fontSize="small" />
        </IconButton>
      </Box>
      <Divider />
      
      <DialogContent sx={{ p: 3 }}>
        <Typography variant="body2" color="text.secondary" mb={3}>
          قم بتحديد ما يمكن للمستخدم الآخر رؤيته والوصول إليه بدون حاجة لكلمة سر.
        </Typography>

        {!isLocked ? (
          <Box sx={{ mb: 4 }}>
            <Typography fontWeight={700} mb={1}>تعيين رمز سري جديد:</Typography>
            <TextField 
              fullWidth 
              size="small" 
              type="password"
              placeholder="مثال: 123456" 
              value={newPin} 
              onChange={(e) => setNewPin(e.target.value)}
              sx={{ mb: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <Typography variant="caption" color="text.secondary">بمجرد تعيين الرمز، سيتم قفل التطبيق بناءً على الإعدادات أدناه.</Typography>
          </Box>
        ) : (
          <Box sx={{ mb: 4, p: 2, bgcolor: 'rgba(214, 69, 69, 0.05)', borderRadius: 2, border: '1px solid rgba(214, 69, 69, 0.2)' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography fontWeight={700} color="#d64545">التطبيق محمي برمز سري</Typography>
                <Typography variant="caption" color="text.secondary">كلمة السر مفعلة. للوصول للأقسام المغلقة يجب إدخال الرمز.</Typography>
              </Box>
              <Stack spacing={1}>
                <Button size="small" variant="outlined" color="error" onClick={handleRemovePin} sx={{ borderRadius: 1.5, fontWeight: 700 }}>إزالة الرمز</Button>
                <Button size="small" variant="contained" color="warning" onClick={handleLockNow} sx={{ borderRadius: 1.5, fontWeight: 700, boxShadow: 'none' }}>قفل الآن</Button>
              </Stack>
            </Stack>
          </Box>
        )}

        {isLocked && (
          <Box sx={{ mb: 3 }}>
            <Stack direction="row" spacing={1} sx={{ bgcolor: 'rgba(0,0,0,0.03)', p: 0.5, borderRadius: 2 }}>
              <Button
                fullWidth
                disabled={!isLocked}
                onClick={() => setActiveTab('modules')}
                startIcon={<ViewModule />}
                sx={{
                  borderRadius: 1.5, py: 1,
                  bgcolor: activeTab === 'modules' ? 'white' : 'transparent',
                  color: activeTab === 'modules' ? '#4a5d4a' : 'text.secondary',
                  boxShadow: activeTab === 'modules' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                  fontWeight: activeTab === 'modules' ? 700 : 500,
                  '&:hover': { bgcolor: activeTab === 'modules' ? 'white' : 'rgba(0,0,0,0.05)' }
                }}
              >
                الأقسام المشتركة
              </Button>
              <Button
                fullWidth
                disabled={!isLocked}
                onClick={() => setActiveTab('users')}
                startIcon={<PeopleAlt />}
                sx={{
                  borderRadius: 1.5, py: 1,
                  bgcolor: activeTab === 'users' ? 'white' : 'transparent',
                  color: activeTab === 'users' ? '#4a5d4a' : 'text.secondary',
                  boxShadow: activeTab === 'users' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                  fontWeight: activeTab === 'users' ? 700 : 500,
                  '&:hover': { bgcolor: activeTab === 'users' ? 'white' : 'rgba(0,0,0,0.05)' }
                }}
              >
                صلاحيات المستخدمين
              </Button>
            </Stack>
          </Box>
        )}

        {(isLocked && activeTab === 'modules') || (!isLocked) ? (
          <Box>
            <Typography variant="subtitle2" fontWeight={700} mb={1.5} color="#4a5d4a">
              الأقسام المفتوحة للجميع:
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" mb={2}>
              هذه الأقسام ستكون ظاهرة ومتاحة لجميع المستخدمين بدون الحاجة للرمز السري.
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
              {MODULES.map(mod => (
                <FormControlLabel
                  key={mod.id}
                  control={<Checkbox size="small" checked={tempModules.includes(mod.id)} onChange={() => handleToggleModule(mod.id)} color="success" />}
                  label={<Typography variant="body2" fontWeight={600}>{mod.label}</Typography>}
                  sx={{ 
                    bgcolor: tempModules.includes(mod.id) ? 'rgba(74, 93, 74, 0.08)' : 'rgba(0,0,0,0.02)', 
                    pr: 1, pl: 0.5, py: 0.5, borderRadius: 2, 
                    border: tempModules.includes(mod.id) ? '1px solid rgba(74, 93, 74, 0.2)' : '1px solid rgba(0,0,0,0.05)', 
                    ml: 0, m: 0, transition: 'all 0.2s' 
                  }}
                />
              ))}
            </Box>
          </Box>
        ) : null}

        {isLocked && activeTab === 'users' && (
          <Box>
            <Typography variant="subtitle2" fontWeight={700} mb={1.5} color="#4a5d4a">
              الاستثناء من القفل حسب المستخدم:
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" mb={2}>
              المستخدم الذي أعطيته صلاحية (وصول كامل) سيتمكن من رؤية كل شيء في النظام وكأنه المالك ولن يطلب منه رمز سري.
            </Typography>
            <Stack spacing={1.5}>
              {usersList.filter(u => u.id !== ownerId).map(user => {
                const isExempt = tempExemptUsers.includes(user.id);
                return (
                  <Box key={user.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, borderRadius: 2, bgcolor: isExempt ? 'rgba(13, 150, 104, 0.05)' : 'rgba(214, 69, 69, 0.03)', border: isExempt ? '1px solid rgba(13, 150, 104, 0.2)' : '1px solid rgba(214, 69, 69, 0.1)' }}>
                    <Box>
                      <Typography variant="body2" fontWeight={700}>{user.displayName}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ opacity: 0.8 }}>{user.email}</Typography>
                    </Box>
                    <Button
                      size="small"
                      variant={isExempt ? "contained" : "outlined"}
                      onClick={() => handleToggleExemptUser(user.id)}
                      startIcon={isExempt ? <CheckCircleOutline /> : <Lock />}
                      sx={{ 
                        borderRadius: 2, 
                        fontWeight: 700,
                        bgcolor: isExempt ? '#0d9668' : 'transparent',
                        color: isExempt ? 'white' : '#d64545',
                        borderColor: isExempt ? 'transparent' : 'rgba(214,69,69,0.5)',
                        '&:hover': {
                          bgcolor: isExempt ? '#0a7d56' : 'rgba(214,69,69,0.08)',
                          borderColor: isExempt ? 'transparent' : '#d64545'
                        },
                        fontSize: { xs: '0.65rem', sm: '0.75rem' },
                        minWidth: { xs: 80, sm: 100 },
                        px: { xs: 1, sm: 2 }
                      }}
                    >
                      {isExempt ? 'وصول كامل' : 'مقيد'}
                    </Button>
                  </Box>
                )
              })}
              {usersList.filter(u => u.id !== ownerId).length === 0 && (
                <Typography variant="body2" color="text.secondary" textAlign="center" py={3}>لاحقا: سيظهر الموظفون هنا عند إضافتهم للنظام.</Typography>
              )}
            </Stack>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2, px: 3, pt: 1, bgcolor: 'background.paper' }}>
        <Button onClick={onClose} disabled={isSaving} sx={{ borderRadius: 2, color: 'text.secondary', fontWeight: 600 }}>إلغاء</Button>
        <Button onClick={handleSave} disabled={isSaving} variant="contained" sx={{ bgcolor: '#4a5d4a', borderRadius: 2.5, px: 4, fontWeight: 700, boxShadow: '0 4px 12px rgba(74,93,74,0.3)' }}>
          {isSaving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
