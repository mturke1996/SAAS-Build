import { useState, useEffect } from 'react';
import {
  Box, Container, Typography, Stack, IconButton, Button,
  TextField, InputAdornment, useTheme, Chip, Avatar,
  Dialog, Slide, Fade, Grid, Paper, alpha
} from '@mui/material';
import {
  ArrowBack, Add, Search, Delete, Person, Email, Lock, Edit,
  AdminPanelSettings, Close, PersonAdd, VpnKey, SupervisedUserCircle, VerifiedUser
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, updateDoc, where, getDocs, writeBatch } from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, updateProfile, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { db, auth } from '../../config/firebase';
import { firebaseConfig } from '../../config/firebase';
import { toast } from 'react-hot-toast';
import { forwardRef } from 'react';
import { TransitionProps } from '@mui/material/transitions';

const Transition = forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export const UsersPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', newPassword: '', role: 'editor' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleCreateUser = async () => {
    if (!formData.name || (!editingUserId && (!formData.email || !formData.password))) {
      toast.error('يرجى ملء الحقول المطلوبة');
      return;
    }
    setSubmitting(true);

    if (editingUserId) {
      if (formData.newPassword && formData.newPassword.length < 6) {
        toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
        setSubmitting(false);
        return;
      }
      try {
        const currentUserData = users.find(u => u.id === editingUserId);
        const oldName = currentUserData?.displayName;
        const newName = formData.name;

        await updateDoc(doc(db, 'users', editingUserId), {
          displayName: newName,
          role: formData.role,
        });

        // Update all related balances and expenses if name changed
        if (oldName && oldName !== newName) {
          const batch = writeBatch(db);
          
          const ubQ = query(collection(db, 'userBalances'), where('userName', '==', oldName));
          const ubSnaps = await getDocs(ubQ);
          ubSnaps.forEach(docSnap => batch.update(docSnap.ref, { userName: newName }));

          const expQ = query(collection(db, 'expenses'), where('createdBy', '==', oldName));
          const expSnaps = await getDocs(expQ);
          expSnaps.forEach(docSnap => batch.update(docSnap.ref, { createdBy: newName }));

          await batch.commit();
        }

        // Try to update password if requested and it's the current user
        if (formData.newPassword) {
          if (auth.currentUser && auth.currentUser.email === formData.email) {
            const { updatePassword } = await import('firebase/auth');
            await updatePassword(auth.currentUser, formData.newPassword);
            toast.success('تم تحديث بياناتك وكلمة مرورك وارتباطاتك المالية بنجاح');
          } else {
            toast.error('لم يتم تغيير كلمة المرور: أنظمة الحماية (Firebase) تمنع تغيير رمز حساب شخص آخر مباشرة. أرسل له رابط التعيين.');
          }
        } else {
          toast.success('تم تحديث بيانات المستخدم وارتباطاته المالية بنجاح !');
        }
        
        setDialogOpen(false);
        setEditingUserId(null);
        setFormData({ name: '', email: '', password: '', newPassword: '', role: 'editor' });
      } catch (error: any) {
        if (error.code === 'auth/requires-recent-login') {
          toast.error('لتغيير كلمة مرورك، يرجى تسجيل الخروج والدخول مجدداً لتأكيد هويتك.');
        } else {
          toast.error('حدث خطأ أثناء التحديث');
        }
      } finally {
        setSubmitting(false);
      }
      return;
    }

    let secondaryApp: any = null;
    try {
      secondaryApp = initializeApp(firebaseConfig, "Secondary");
      const secondaryAuth = getAuth(secondaryApp);
      const userCred = await createUserWithEmailAndPassword(secondaryAuth, formData.email, formData.password);
      await updateProfile(userCred.user, { displayName: formData.name });
      await signOut(secondaryAuth);

      await addDoc(collection(db, 'users'), {
        uid: userCred.user.uid,
        displayName: formData.name,
        email: formData.email,
        role: formData.role,
        createdAt: new Date().toISOString()
      });

      toast.success('تم إضافة المستخدم بنجاح');
      setDialogOpen(false);
      setFormData({ name: '', email: '', password: '', newPassword: '', role: 'editor' });
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        toast.error('البريد الإلكتروني مسجل بالفعل');
      } else {
        toast.error('حدث خطأ أثناء إضافة المستخدم');
      }
    } finally {
      if (secondaryApp) { try { await deleteApp(secondaryApp); } catch(e) {} }
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (window.confirm('ملاحظة هامة جداً: الحذف من هنا سيحذف المستخدم، وسيتم مسح كافة سجلات الأرصدة التابعة له. هل أنت متأكد؟')) {
      try {
        const currentUserData = users.find(u => u.id === id);
        const oldName = currentUserData?.displayName;
        
        const batch = writeBatch(db);
        batch.delete(doc(db, 'users', id));

        if (oldName) {
           const ubQ = query(collection(db, 'userBalances'), where('userName', '==', oldName));
           const ubSnaps = await getDocs(ubQ);
           ubSnaps.forEach(docSnap => batch.delete(docSnap.ref));

           const expQ = query(collection(db, 'expenses'), where('createdBy', '==', oldName));
           const expSnaps = await getDocs(expQ);
           expSnaps.forEach(docSnap => batch.delete(docSnap.ref));
        }

        await batch.commit();
        toast.success('تم حذف المستخدم وكافة أرصدته ومصروفاته بنجاح');
      } catch (error: any) { 
        toast.error('حدث خطأ أثناء الحذف: ' + error.message); 
      }
    }
  };

  const handleResetPasswordEmail = async () => {
    if (!formData.email) return;
    try {
      await sendPasswordResetEmail(auth, formData.email);
      toast.success('تم إرسال رابط التغيير إلى إيميله بنجاح! 📧');
    } catch (error: any) {
      toast.error('حدث خطأ أثناء إرسال الرابط.');
    }
  };

  const handleEditClick = (user: any) => {
    setEditingUserId(user.id);
    setFormData({
      name: user.displayName || '',
      email: user.email || '',
      password: '',
      newPassword: '',
      role: user.role || 'editor'
    });
    setDialogOpen(true);
  };

  const filteredUsers = users.filter(u =>
    u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: '#f4f6f4', pb: 10, fontFamily: 'Tajawal, sans-serif' }}>
      
      {/* ── Ultra Premium Header ── */}
      <Box
        sx={{
          background: theme.palette.mode === 'light'
            ? 'linear-gradient(145deg, #2a3a2a 0%, #1f291f 100%)'
            : 'linear-gradient(145deg, #151a15 0%, #1a221a 100%)',
          /* Safari/PWA Safe Area Fix for iPhone 16 Pro Max */
          pt: 'calc(max(env(safe-area-inset-top), 60px) + 16px)',
          pb: 4,
          px: 2.5,
          position: 'relative',
          overflow: 'hidden',
          borderBottomLeftRadius: 36,
          borderBottomRightRadius: 36,
          boxShadow: '0 12px 32px rgba(42,58,42,0.15)',
        }}
      >
        {/* Subtle glowing orb in background */}
        <Box sx={{
          position: 'absolute', top: -40, right: -40, width: 200, height: 200,
          background: 'radial-gradient(circle, rgba(200,192,176,0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1, px: 0 }}>
          
          {/* Top Navigation Row */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3.5}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <IconButton 
                onClick={() => navigate('/')} 
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.08)', color: 'white', 
                  backdropFilter: 'blur(10px)', width: 42, height: 42,
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.15)', transform: 'scale(1.05)' },
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                <ArrowBack fontSize="small" />
              </IconButton>
              <Typography variant="h5" fontWeight={900} sx={{ color: 'white', letterSpacing: '-0.3px', fontSize: '1.35rem' }}>
                الموظفين
              </Typography>
            </Stack>

            <Button
              variant="contained"
              startIcon={<Add sx={{ ml: 0.5, mr: -0.5 }} />}
              onClick={() => {
                setEditingUserId(null);
                setFormData({ name: '', email: '', password: '', newPassword: '', role: 'editor' });
                setDialogOpen(true);
              }}
              sx={{
                bgcolor: '#c8c0b0', color: '#1f291f', fontWeight: 800, borderRadius: 3, 
                px: 2.5, py: 1, fontSize: '0.85rem', boxShadow: '0 4px 12px rgba(200,192,176,0.3)',
                '&:hover': { bgcolor: '#e0d8c8', transform: 'translateY(-2px)' },
              }}
            >
              موظف جديد
            </Button>
          </Stack>

          {/* Quick Stats Row (Compact) */}
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 6 }}>
              <Box sx={{ 
                p: 2, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.06)', 
                border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(16px)',
                display: 'flex', alignItems: 'center', gap: 1.5 
              }}>
                <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: 'rgba(200,192,176,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <SupervisedUserCircle sx={{ color: '#c8c0b0', fontSize: 20 }} />
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>إجمالي الحسابات</Typography>
                  <Typography sx={{ fontSize: '1.1rem', color: 'white', fontWeight: 900, lineHeight: 1.2 }}>{users.length}</Typography>
                </Box>
              </Box>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Box sx={{ 
                p: 2, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.06)', 
                border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(16px)',
                display: 'flex', alignItems: 'center', gap: 1.5 
              }}>
                <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <VerifiedUser sx={{ color: '#fff', fontSize: 18 }} />
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>المدراء (Admin)</Typography>
                  <Typography sx={{ fontSize: '1.1rem', color: 'white', fontWeight: 900, lineHeight: 1.2 }}>{users.filter(u => u.role === 'admin').length}</Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Container maxWidth="sm" sx={{ mt: -3.5, position: 'relative', zIndex: 2, px: 2 }}>
        
        {/* Ultra Sleek Search Bar */}
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            placeholder="البحث الطريع بالاسم أو الإيميل..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <Search sx={{ color: '#8b7e6a', mr: 1.5, ml: 0.5, fontSize: 22 }} />,
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: 'white', height: 52, borderRadius: 4, fontSize: '0.95rem', fontWeight: 600,
                boxShadow: '0 8px 24px rgba(42,58,42,0.06)', border: '1px solid', borderColor: 'rgba(42,58,42,0.04)',
                '& fieldset': { border: 'none' },
                '&:focus-within': { boxShadow: '0 8px 28px rgba(42,58,42,0.12)', transform: 'translateY(-1px)' },
                transition: 'all 0.3s ease',
              }
            }}
          />
        </Box>

        {/* Users List */}
        <Stack spacing={1.5}>
          {filteredUsers.map((user) => (
            <Box
              key={user.id}
              sx={{
                p: 2, borderRadius: 3.5, bgcolor: 'white',
                border: '1px solid', borderColor: 'rgba(0,0,0,0.04)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.02)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                transition: 'all 0.2s', '&:hover': { transform: 'scale(1.01)', boxShadow: '0 6px 20px rgba(0,0,0,0.04)' }
              }}
            >
              <Stack direction="row" alignItems="center" spacing={2} sx={{ minWidth: 0, flex: 1 }}>
                <Avatar 
                  sx={{ 
                    width: 46, height: 46, borderRadius: 2.5, 
                    bgcolor: user.role === 'admin' ? alpha('#2a3a2a', 0.08) : alpha('#8b7e6a', 0.08), 
                    color: user.role === 'admin' ? '#2a3a2a' : '#8b7e6a', 
                    fontWeight: 900, fontSize: '1.1rem' 
                  }}
                >
                  {user.displayName?.[0]?.toUpperCase() || 'U'}
                </Avatar>
                
                <Box sx={{ minWidth: 0 }}>
                  <Stack direction="row" alignItems="center" spacing={1} mb={0.3}>
                    <Typography fontWeight={800} sx={{ fontSize: '0.95rem', color: '#1f291f', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {user.displayName}
                    </Typography>
                    {user.role === 'admin' && (
                      <VerifiedUser sx={{ fontSize: 14, color: '#4a5d4a' }} />
                    )}
                  </Stack>
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#8b7e6a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} dir="ltr">
                    {user.email}
                  </Typography>
                </Box>
              </Stack>

              {/* Action Buttons */}
              <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0, ml: 1 }}>
                <IconButton 
                  onClick={() => handleEditClick(user)} 
                  sx={{ 
                    width: 38, height: 38, borderRadius: 2.5, bgcolor: '#f4f6f4', color: '#4a5d4a',
                    '&:hover': { bgcolor: '#e8ece8' } 
                  }}
                >
                  <Edit sx={{ fontSize: 18 }} />
                </IconButton>
                <IconButton 
                  onClick={() => handleDeleteUser(user.id)} 
                  sx={{ 
                    width: 38, height: 38, borderRadius: 2.5, bgcolor: '#fcf0f0', color: '#d64545',
                    '&:hover': { bgcolor: '#fae4e4' } 
                  }}
                >
                  <Delete sx={{ fontSize: 18 }} />
                </IconButton>
              </Stack>
            </Box>
          ))}

          {!loading && filteredUsers.length === 0 && (
            <Fade in={true}>
              <Box textAlign="center" py={8} sx={{ bgcolor: 'white', borderRadius: 4, border: '1px dashed rgba(0,0,0,0.08)', mt: 2 }}>
                <PersonAdd sx={{ fontSize: 56, color: 'text.disabled', mb: 2, opacity: 0.3 }} />
                <Typography variant="h6" fontWeight={800} color="text.secondary" mb={1}>لا يوجد موظفين</Typography>
                <Typography variant="body2" color="text.disabled" fontWeight={500}>جرب البحث باسم آخر أو أضف موظف جديد</Typography>
              </Box>
            </Fade>
          )}
        </Stack>
      </Container>

      {/* ── Add / Edit Dialog (Ultra Premium Modal) ── */}
      <Dialog
        open={dialogOpen} onClose={() => !submitting && setDialogOpen(false)}
        TransitionComponent={Transition} keepMounted fullWidth maxWidth="xs"
        PaperProps={{ 
          sx: { 
            borderRadius: { xs: '32px 32px 0 0', sm: 5 }, m: { xs: 0, sm: 2 }, 
            position: { xs: 'fixed', sm: 'relative' }, bottom: { xs: 0, sm: 'auto' }, width: '100%',
            boxShadow: '0 -10px 40px rgba(0,0,0,0.1)'
          } 
        }}
      >
        <Box sx={{ p: { xs: 3.5, sm: 4 }, pb: { xs: 'calc(env(safe-area-inset-bottom) + 24px)', sm: 4 }, position: 'relative' }}>
          
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3.5 }}>
            <Box>
              <Typography variant="h5" fontWeight={900} mb={0.5} color="#1f291f">
                {editingUserId ? 'تحديث السجلات' : 'إضافة موظف 👤'}
              </Typography>
              <Typography variant="body2" color="#8b7e6a" fontWeight={600}>
                {editingUserId ? 'تعديل الصلاحيات أو البيانات الأساسية' : 'إنشاء حساب جديد لمنح الوصول'}
              </Typography>
            </Box>
            <IconButton 
              onClick={() => setDialogOpen(false)} 
              sx={{ bgcolor: '#f4f6f4', color: '#1f291f', width: 34, height: 34, '&:hover': { bgcolor: '#e8ece8' } }}
            >
              <Close sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>

          <Stack spacing={2.5}>
            {/* Input Groups */}
            <Box>
              <Typography fontWeight={800} fontSize="0.8rem" color="#4a5d4a" mb={1}>الاسم الكامل</Typography>
              <TextField
                fullWidth variant="outlined" placeholder="محمد أحمد..."
                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                InputProps={{ startAdornment: <InputAdornment position="start"><Person sx={{ color: '#8b7e6a' }} /></InputAdornment> }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: '#f4f6f4', '& fieldset': { border: 'none' }, '&:focus-within': { bgcolor: 'white', '& fieldset': { border: '2px solid #4a5d4a' } } } }}
              />
            </Box>

            <Box>
              <Typography fontWeight={800} fontSize="0.8rem" color="#4a5d4a" mb={1}>البريد الإلكتروني</Typography>
              <TextField
                fullWidth type="email" variant="outlined" placeholder="email@example.com"
                value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                disabled={!!editingUserId}
                InputProps={{ startAdornment: <InputAdornment position="start"><Email sx={{ color: '#8b7e6a' }} /></InputAdornment> }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: '#f4f6f4', '& fieldset': { border: 'none' }, '&.Mui-disabled': { opacity: 0.6 } } }}
              />
            </Box>

            {!editingUserId ? (
              <Box>
                <Typography fontWeight={800} fontSize="0.8rem" color="#4a5d4a" mb={1}>كلمة المرور الأولية</Typography>
                <TextField
                  fullWidth type="password" variant="outlined" placeholder="••••••••"
                  value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                  InputProps={{ startAdornment: <InputAdornment position="start"><Lock sx={{ color: '#8b7e6a' }} /></InputAdornment> }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: '#f4f6f4', '& fieldset': { border: 'none' } } }}
                />
              </Box>
            ) : (
              <Box sx={{ p: 2, borderRadius: 3, bgcolor: '#f8f9f8', border: '1px solid rgba(0,0,0,0.04)' }}>
                <Typography variant="body2" fontWeight={800} color="#1f291f" mb={1.5} display="flex" alignItems="center" gap={1}>
                  <VpnKey fontSize="small" sx={{ color: '#4a5d4a' }}/> إعادة تعيين كلمة المرور
                </Typography>
                <TextField
                  fullWidth placeholder="كلمة مرور جديدة (اختياري)" type="password" size="small"
                  value={formData.newPassword} onChange={e => setFormData({...formData, newPassword: e.target.value})}
                  sx={{ mb: 1.5, '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'white' } }}
                />
                <Button 
                  fullWidth onClick={handleResetPasswordEmail} startIcon={<Email />}
                  sx={{ borderRadius: 2, py: 1, fontWeight: 700, color: '#4a5d4a', bgcolor: 'rgba(74,93,74,0.08)' }}
                >
                  إرسال رابط استعادة للإيميل
                </Button>
              </Box>
            )}

            <Box>
              <Typography fontWeight={800} fontSize="0.8rem" color="#4a5d4a" mb={1}>الصلاحية</Typography>
              <Stack direction="row" spacing={1.5}>
                {[
                  { value: 'editor', label: 'موظف عادي', icon: <Person /> },
                  { value: 'admin', label: 'مدير نظام', icon: <AdminPanelSettings /> },
                ].map((role) => (
                  <Box
                    key={role.value} onClick={() => setFormData({...formData, role: role.value})}
                    sx={{
                      flex: 1, p: 2, borderRadius: 3, cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
                      border: formData.role === role.value ? '2px solid #2a3a2a' : '2px solid transparent',
                      bgcolor: formData.role === role.value ? alpha('#2a3a2a', 0.05) : '#f4f6f4',
                      '&:active': { transform: 'scale(0.96)' }
                    }}
                  >
                    <Box sx={{ color: formData.role === role.value ? '#2a3a2a' : '#8b7e6a', mb: 0.5 }}>
                      {role.icon}
                    </Box>
                    <Typography fontWeight={800} sx={{ fontSize: '0.8rem', color: formData.role === role.value ? '#1f291f' : '#8b7e6a' }}>
                      {role.label}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Box>

            <Button
              variant="contained" fullWidth onClick={handleCreateUser} disabled={submitting}
              sx={{
                py: 2, mt: 2, borderRadius: 3, fontWeight: 900, fontSize: '1.05rem',
                bgcolor: '#2a3a2a', color: 'white', '&:hover': { bgcolor: '#151a15' },
                boxShadow: '0 8px 24px rgba(42,58,42,0.25)',
              }}
            >
              {submitting ? 'جاري المعالجة...' : (editingUserId ? 'حفظ التحديثات' : 'إضافة الموظف المعتمد')}
            </Button>
          </Stack>
        </Box>
      </Dialog>
    </Box>
  );
};

