import { ReactNode, useState } from 'react';
import { useAppLockStore, AppModule } from '../store/useAppLockStore';
import { Box, Typography, TextField, Button, Card, CardContent } from '@mui/material';
import { Lock } from '@mui/icons-material';

interface Props {
  module: AppModule;
  children: ReactNode;
  fallback?: ReactNode; // If not provided, will show Lock Screen. If provided, will render fallback (e.g. null)
  requireScreen?: boolean; // Whether to render full screen lock or just nothing
}

export const AppLockGuard = ({ module, children, fallback = null, requireScreen = false }: Props) => {
  const { canAccess, unlockSession } = useAppLockStore();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  if (canAccess(module)) {
    return <>{children}</>;
  }

  if (!requireScreen) {
    return <>{fallback}</>;
  }

  const handleUnlock = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (unlockSession(pin)) {
      setError(false);
    } else {
      setError(true);
      setPin('');
    }
  };

  return (
    <Box sx={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2, background: 'linear-gradient(160deg, #1a1f1a 0%, #2f3e2f 50%, #3a4a3a 100%)', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}>
      <Card sx={{ maxWidth: 400, width: '100%', borderRadius: 5, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.98)', backdropFilter: 'blur(20px)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
        <form onSubmit={handleUnlock}>
          <CardContent sx={{ p: 4, pt: 6 }}>
            <Box sx={{ width: 80, height: 80, borderRadius: '50%', bgcolor: 'rgba(214, 69, 69, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3 }}>
              <Lock sx={{ fontSize: 40, color: '#d64545' }} />
            </Box>
            <Typography variant="h5" fontWeight={800} mb={1} color="#2a3a2a">الوصول مقيد</Typography>
            <Typography variant="body2" color="#666" mb={4} sx={{ px: 2, lineHeight: 1.6 }}>
              هذا القسم محمي برمز مرور. يرجى إدخال الرقم السري للمتابعة.
            </Typography>
            
            <TextField 
              fullWidth 
              type="password"
              placeholder="••••••"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              error={error}
              helperText={error ? "الرمز غير صحيح" : ""}
              sx={{ 
                mb: 4, 
                '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: 'rgba(0,0,0,0.02)' }
              }}
              InputProps={{
                inputProps: { style: { textAlign: 'center', letterSpacing: '0.6em', fontSize: '1.4rem', fontWeight: 800 } }
              }}
            />
            <Button type="submit" variant="contained" fullWidth size="large" sx={{ borderRadius: 3, bgcolor: '#4a5d4a', py: 1.5, fontWeight: 800, fontSize: '1.05rem', boxShadow: '0 4px 14px rgba(74,93,74,0.3)', '&:hover': { bgcolor: '#364036' } }}>
              فتح القفل
            </Button>
            <Button variant="text" fullWidth size="large" onClick={() => window.history.back()} sx={{ mt: 2, color: 'text.secondary', fontWeight: 700, borderRadius: 3 }}>
              الرجوع للخلف
            </Button>
          </CardContent>
        </form>
      </Card>
    </Box>
  );
};
