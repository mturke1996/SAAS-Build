import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged, 
} from 'firebase/auth';
import { auth } from '../config/firebase';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => (() => void);
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          const firebaseUser = userCredential.user;
          
          const user: User = {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || 'مستخدم النظام',
            photoURL: firebaseUser.photoURL || undefined,
          };

          set({ user, isAuthenticated: true, isLoading: false });
        } catch (error: any) {
          let errorMessage = 'فشل تسجيل الدخول';
          if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
            errorMessage = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
          } else if (error.code === 'auth/too-many-requests') {
            errorMessage = 'محاولات كثيرة خاطئة. يرجى المحاولة لاحقاً';
          } else if (error.code === 'auth/configuration-not-found' || String(error.message).includes('CONFIGURATION_NOT_FOUND')) {
            errorMessage = 'تفعيل Email/Password مطلوب من Firebase Console → Authentication → Sign-in method';
          } else if (error.code === 'auth/network-request-failed') {
            errorMessage = 'فشل الاتصال بالشبكة. تحقّق من الإنترنت.';
          } else if (error.code === 'auth/invalid-api-key' || error.code === 'auth/api-key-not-valid') {
            errorMessage = 'مفتاح Firebase غير صالح — تحقّق من الإعدادات.';
          }
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await firebaseSignOut(auth);
          set({ user: null, isAuthenticated: false, isLoading: false });
          // Clear the persisted session from localStorage on explicit logout
          localStorage.removeItem('auth-storage');
        } catch (error) {
          set({ error: 'فشل تسجيل الخروج', isLoading: false });
        }
      },

      checkAuth: () => {
        // Check if we already have a persisted auth session in localStorage
        let hasPersistedUser = false;
        try {
          const stored = localStorage.getItem('auth-storage');
          const parsed = JSON.parse(stored || '{}');
          hasPersistedUser = !!(parsed?.state?.isAuthenticated && parsed?.state?.user);
        } catch {}

        // If persisted user exists => show the app immediately (no loading screen)
        if (hasPersistedUser) {
          set({ isLoading: false });
        }

        // Listen for Firebase auth state changes in background
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
          if (firebaseUser) {
            // Firebase confirmed the user — update user data
            const user: User = {
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || 'مستخدم النظام',
              photoURL: firebaseUser.photoURL || undefined,
            };
            set({ user, isAuthenticated: true, isLoading: false });
          } else {
            // Firebase returned no user.
            // If we had a persisted session, we trust it — Firebase may just be loading
            // Only clear the session if we never had a persisted user (true fresh visit)
            if (!hasPersistedUser) {
              set({ user: null, isAuthenticated: false, isLoading: false });
            } else {
              // Keep persisted session alive, just stop loading
              set({ isLoading: false });
            }
          }
        });
        return unsubscribe;
      },

      setUser: (user) => set({ user, isAuthenticated: !!user }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
