import { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, Button, TextField, Checkbox, Typography,
  IconButton, Box, Fade, Slide, ThemeProvider, createTheme, useMediaQuery, useTheme
} from '@mui/material';
import {
  Close, Lock, LockOpen, Security, PeopleAlt, ViewModule,
  CheckCircleOutline, Fingerprint, Shield
} from '@mui/icons-material';
import { useAppLockStore, AppModule } from '../store/useAppLockStore';
import toast from 'react-hot-toast';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { cn } from '../design-system/primitives/cn';

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

// Dark mode local theme override just for the dialog interior if you want it to always look premium dark,
// but since we rely on Tailwind, we'll keep it transparent and let CSS handle it.

export const AppLockSettingsDialog = ({ open, onClose }: Props) => {
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
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

  if (isLocked && !isSessionUnlocked()) {
    return (
      <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="xs" 
        fullWidth 
        PaperProps={{ 
          className: cn(
            'bg-surface-panel/90 backdrop-blur-3xl border border-[var(--brand-primary-soft)] overflow-visible shadow-2xl relative',
            isMobile ? 'rounded-none min-h-[100dvh]' : 'rounded-[32px]'
          )
        }}
        fullScreen={isMobile}
        TransitionComponent={Fade}
        transitionDuration={400}
      >
        <div className="absolute -top-12 inset-x-0 flex justify-center z-10 pointer-events-none">
          <div className="w-24 h-24 rounded-full bg-surface-panel border-[6px] border-surface-canvas shadow-xl flex items-center justify-center animate-fade-in relative z-10">
            <Fingerprint className="text-[var(--brand-primary)] text-5xl animate-pulse-ring rounded-full" />
          </div>
          {/* Subtle glow behind the icon */}
          <div className="absolute top-0 w-32 h-32 bg-[var(--brand-primary)] rounded-full blur-3xl opacity-30 mt-2"></div>
        </div>
        
        <DialogContent className={cn('text-center', isMobile ? 'pt-24 pb-8 px-6 flex flex-col justify-center min-h-[80dvh]' : 'pt-16 pb-8 px-6')}>
          <Typography variant="h5" className="font-bold text-fg tracking-tight mb-2 font-arabic">
            مصادقة الصلاحية
          </Typography>
          <Typography variant="body2" className="text-fg-muted mb-8 font-arabic">
            الرجاء إدخال الرمز السري للوصول
          </Typography>
          
          <TextField
            fullWidth
            type="password"
            placeholder="••••••"
            value={enteredPin}
            onChange={(e) => setEnteredPin(e.target.value)}
            className="mb-8"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '16px',
                bgcolor: 'rgba(109, 40, 217, 0.04)',
                '& fieldset': { borderColor: 'rgba(109, 40, 217, 0.2)' },
                '&:hover fieldset': { borderColor: 'rgba(109, 40, 217, 0.4)' },
                '&.Mui-focused fieldset': { borderColor: '#6D28D9' },
                transition: 'all 0.3s ease',
              }
            }}
            InputProps={{
              inputProps: { style: { textAlign: 'center', letterSpacing: '0.8em', fontSize: '1.75rem', fontWeight: 800, color: 'var(--brand-primary)' } }
            }}
          />

          <div className="flex flex-col gap-3">
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
              className="py-3.5 rounded-2xl font-bold text-base shadow-brand font-arabic"
              sx={{ bgcolor: '#6D28D9', '&:hover': { bgcolor: '#5B21B6' }, transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
            >
              دخول
            </Button>
            <Button onClick={onClose} fullWidth className="py-3 rounded-2xl text-fg-subtle hover:bg-surface-hover font-arabic">إلغاء</Button>
          </div>
        </DialogContent>
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

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth 
      PaperProps={{ 
        className: cn(
          'bg-surface-panel/95 backdrop-blur-[40px] border border-[var(--surface-border-strong)] overflow-hidden shadow-2xl relative',
          isMobile ? 'rounded-none m-0' : 'rounded-3xl'
        )
      }}
      fullScreen={isMobile}
      TransitionComponent={Fade}
      transitionDuration={350}
    >
      {/* Decorative Aurora Gradient Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30 select-none">
        <div className="absolute -top-[40%] -right-[20%] w-[80%] h-[80%] rounded-full bg-[radial-gradient(circle,#6D28D9,transparent)] blur-[100px] animate-aurora"></div>
        <div className="absolute -bottom-[40%] -left-[20%] w-[60%] h-[60%] rounded-full bg-[radial-gradient(circle,#F59E0B,transparent)] blur-[80px] animate-aurora" style={{ animationDelay: '-8s' }}></div>
      </div>

      <div className={cn('relative z-10 flex flex-col h-full', isMobile ? 'max-h-[100dvh]' : 'h-[85vh] max-h-[800px]')}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--surface-border)] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-surface-sunken flex items-center justify-center text-[var(--brand-primary)] border border-[var(--surface-border)] shadow-sm">
              <Security className="text-2xl" />
            </div>
            <div>
              <Typography variant="h6" className="font-extrabold text-fg font-arabic tracking-tight leading-tight">
                أمان وصلاحيات النظام
              </Typography>
              <Typography variant="caption" className="text-fg-muted font-medium font-arabic">
                إدارة مستويات الوصول والقفل العام
              </Typography>
            </div>
          </div>
          <IconButton onClick={onClose} className="bg-surface-sunken hover:bg-surface-hover text-fg rounded-xl w-10 h-10 transition-colors">
            <Close fontSize="small" />
          </IconButton>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 custom-scrollbar">
          
          <div className={cn('grid gap-6', isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-12')}>
            
            {/* Sidebar info (Left side logic, but displays on Right in RTL) */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              <div className="p-5 rounded-2xl bg-surface-raised border border-[var(--surface-border)] shadow-sm relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-[var(--brand-primary)]/10 rounded-full blur-2xl group-hover:bg-[var(--brand-primary)]/20 transition-all duration-500"></div>
                <Shield className="text-[var(--brand-primary)] text-4xl mb-3" />
                <Typography variant="subtitle1" className="font-bold text-fg mb-1 font-arabic">كيف يعمل القفل؟</Typography>
                <Typography variant="body2" className="text-fg-muted font-arabic leading-relaxed">
                  عند تفعيل الرمز السري، لن يتمكن أي شخص من رؤية محتويات النظام المحمية. يمكنك استثناء بعض الأقسام لتبقى مفتوحة، أو استثناء بعض المستخدمين.
                </Typography>
              </div>

              {!isLocked ? (
                <div className="p-5 rounded-2xl bg-[var(--surface-sunken)] border border-[var(--surface-border-strong)] relative z-10 transition-transform duration-300 hover:-translate-y-1">
                  <Typography className="font-extrabold text-[var(--brand-primary)] mb-2 font-arabic tracking-tight flex items-center gap-2">
                    <Lock /> تفعيل الحماية بكلمة مرور
                  </Typography>
                  <Typography variant="caption" className="text-fg-muted block mb-4 font-arabic">
                    أدخل رمز PIN من 4 أرقام على الأقل للبدء.
                  </Typography>
                  <TextField 
                    fullWidth 
                    size="medium" 
                    type="password"
                    placeholder="رمز PIN" 
                    value={newPin} 
                    onChange={(e) => setNewPin(e.target.value)}
                    sx={{ 
                      '& .MuiOutlinedInput-root': { 
                        borderRadius: '12px', bgcolor: 'var(--surface-panel)',
                        border: '1px solid var(--surface-border)',
                        color: 'var(--text-primary)'
                      } 
                    }}
                    InputProps={{ style: { letterSpacing: '0.4em', fontWeight: 800, textAlign: 'center' } }}
                  />
                </div>
              ) : (
                <div className="p-5 rounded-2xl bg-gradient-to-br from-red-500/10 to-orange-500/5 border border-red-500/20 relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-pulse-ring">
                      <Lock fontSize="small" />
                    </div>
                    <div>
                      <Typography className="font-extrabold text-red-500 font-arabic leading-none mb-1">وحدة الحماية مفعلة</Typography>
                      <Typography variant="caption" className="text-red-500/70 font-arabic font-medium">النظام مقفل حالياً</Typography>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <Button 
                      variant="contained" 
                      onClick={() => { lockSession(); toast.success('تم قفل التطبيق فوراً'); onClose(); }}
                      className="py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold font-arabic shadow-lg shadow-red-500/25 w-full"
                    >
                      قفل فوراً
                    </Button>
                    <Button 
                      variant="outlined" 
                      onClick={handleRemovePin}
                      className="py-2.5 rounded-xl border-red-500/30 text-red-500 hover:bg-red-500/10 font-bold font-arabic w-full"
                    >
                      إلغاء تنشيط الحماية
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Main Config Area */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              
              {/* Custom Tabs */}
              <div className="flex p-1.5 bg-surface-sunken rounded-2xl border border-[var(--surface-border)] relative">
                <button
                  onClick={() => setActiveTab('modules')}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[12px] font-arabic font-bold text-sm transition-all duration-300 relative z-10",
                    activeTab === 'modules' ? "text-[var(--brand-primary)] shadow-sm border border-[var(--surface-border)]" : "text-fg-muted hover:text-fg"
                  )}
                >
                  <ViewModule className="text-lg" /> الأقسام المشتركة
                  {activeTab === 'modules' && <div className="absolute inset-0 bg-surface-panel rounded-[12px] -z-10 shadow-sm border border-[var(--surface-border)]"></div>}
                </button>
                <button
                  onClick={() => setActiveTab('users')}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[12px] font-arabic font-bold text-sm transition-all duration-300 relative z-10",
                    activeTab === 'users' ? "text-[var(--brand-primary)] shadow-sm border border-[var(--surface-border)]" : "text-fg-muted hover:text-fg"
                  )}
                >
                  <PeopleAlt className="text-lg" /> استثناء المستخدمين
                  {activeTab === 'users' && <div className="absolute inset-0 bg-surface-panel rounded-[12px] -z-10 shadow-sm border border-[var(--surface-border)]"></div>}
                </button>
              </div>

              {/* Tab Content */}
              <div className="bg-surface-raised rounded-3xl border border-[var(--surface-border)] p-6 shadow-xs flex-1 transition-all">
                {activeTab === 'modules' ? (
                  <Fade in={true} timeout={400}>
                    <div>
                      <Typography className="font-extrabold text-lg text-fg mb-1 font-arabic flex items-center gap-2">
                        الأقسام المفتوحة (غير المحمية)
                      </Typography>
                      <Typography variant="body2" className="text-fg-muted mb-6 font-arabic leading-relaxed">
                        حدد الأقسام التي يمكن لأي شخص يتصفح النظام رؤيتها دون الحاجة لإدخال الرمز السري.
                      </Typography>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {MODULES.map(mod => {
                          const isChecked = tempModules.includes(mod.id);
                          return (
                            <div 
                              key={mod.id}
                              onClick={() => handleToggleModule(mod.id)}
                              className={cn(
                                "flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all duration-300 group border",
                                isChecked 
                                  ? "bg-[var(--brand-primary-soft)] border-[var(--brand-primary)]/30 shadow-[0_4px_12px_rgba(109,40,217,0.05)]" 
                                  : "bg-surface-panel border-[var(--surface-border)] hover:border-[var(--brand-primary)]/40 hover:bg-surface-hover"
                              )}
                            >
                              <div className={cn(
                                "w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 shrink-0",
                                isChecked ? "bg-[var(--brand-primary)] text-white" : "border-2 border-fg-muted group-hover:border-[var(--brand-primary)]"
                              )}>
                                {isChecked && <CheckCircleOutline className="text-base" />}
                              </div>
                              <span className={cn(
                                "font-arabic text-sm transition-colors font-semibold",
                                isChecked ? "text-[var(--brand-primary)]" : "text-fg"
                              )}>
                                {mod.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </Fade>
                ) : (
                  <Fade in={true} timeout={400}>
                    <div>
                      <Typography className="font-extrabold text-lg text-fg mb-1 font-arabic flex items-center gap-2">
                        صلاحيات المستخدمين (دخول مفتوح)
                      </Typography>
                      <Typography variant="body2" className="text-fg-muted mb-6 font-arabic leading-relaxed">
                        اختر المستخدمين (الموظفين/المدراء) الذين لا ينطبق عليهم نظام القفل، حيث يحصلون على وصول كامل دائماً دون إدخال الرمز.
                      </Typography>
                      
                      <div className="flex flex-col gap-3">
                        {usersList.filter(u => u.id !== ownerId).length === 0 ? (
                          <div className="text-center py-10 px-4 border border-dashed border-[var(--surface-border-strong)] rounded-2xl bg-surface-panel">
                            <PeopleAlt className="text-4xl text-fg-muted mb-3 opacity-50 mx-auto" />
                            <Typography className="font-arabic font-bold text-fg-muted">لا يوجد موظفون إضافيون في النظام</Typography>
                          </div>
                        ) : (
                          usersList.filter(u => u.id !== ownerId).map(user => {
                            const isExempt = tempExemptUsers.includes(user.id);
                            return (
                              <div 
                                key={user.id} 
                                className={cn(
                                  "flex justify-between items-center p-4 rounded-2xl transition-all duration-300 border",
                                  isExempt
                                    ? "bg-green-500/5 border-green-500/30 shadow-[0_4px_12px_rgba(34,197,94,0.05)]"
                                    : "bg-surface-panel border-[var(--surface-border)] hover:border-[var(--brand-primary)]/40 hover:bg-surface-hover"
                                )}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-surface-sunken flex items-center justify-center font-bold text-[var(--brand-primary)] shadow-sm">
                                    {user.displayName?.charAt(0).toUpperCase() || 'U'}
                                  </div>
                                  <div>
                                    <Typography className="font-bold text-fg text-sm font-arabic">{user.displayName}</Typography>
                                    <Typography className="text-xs text-fg-muted font-mono">{user.email}</Typography>
                                  </div>
                                </div>
                                
                                <Button
                                  variant="contained"
                                  onClick={() => handleToggleExemptUser(user.id)}
                                  startIcon={isExempt ? <CheckCircleOutline /> : <Lock />}
                                  className={cn(
                                    "rounded-xl font-bold font-arabic shadow-none tracking-normal py-1.5 px-4 transition-all duration-300",
                                    isExempt 
                                      ? "bg-green-500 hover:bg-green-600 text-white" 
                                      : "bg-surface-sunken text-fg-subtle border border-[var(--surface-border)] hover:bg-[var(--brand-primary-soft)] hover:text-[var(--brand-primary)] hover:border-[var(--brand-primary-soft)]"
                                  )}
                                  sx={{ '& .MuiButton-startIcon': { marginEnd: '4px', marginStart: '-2px' } }}
                                >
                                  {isExempt ? 'وصول كامل' : 'مقيد بالرمز'}
                                </Button>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </Fade>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 p-5 border-t border-[var(--surface-border)] shrink-0 bg-surface-panel/50 backdrop-blur-md">
          <Button 
            onClick={onClose} 
            disabled={isSaving} 
            className="rounded-xl font-bold text-fg-muted hover:text-fg px-6 py-2.5 font-arabic hover:bg-surface-sunken"
          >
            إلغاء التغييرات
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving} 
            variant="contained" 
            className="rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white px-8 py-2.5 font-bold font-arabic shadow-brand transition-all active:scale-95"
            startIcon={isSaving ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block"></span> : null}
          >
            {isSaving ? 'يتم التوثيق...' : 'اعتماد وحفظ'}
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
