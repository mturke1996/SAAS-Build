import { FormEvent, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { fadeInUp, staggerChildren } from '../../core/motion/presets';
import { Mail, Lock, ArrowForward, ArrowBack, Visibility, VisibilityOff, Bolt } from '@mui/icons-material';
import { useAuthStore } from '../../stores/useAuthStore';
import { useBrand } from '../../config/BrandProvider';
import { LogoMark } from '../brand/LogoMark';
import { Button, Input, IconButton } from '../../design-system/primitives';

/**
 * LoginPage — premium hero with a moving brand aurora mesh.
 *
 *  Mobile: hero ~42vh at top (gradient + subtle grain + drifting blobs),
 *          form below in comfortable padding. Touch-friendly.
 *  Desktop: side-by-side, hero on the start edge.
 *
 *  Motion: GSAP drives the aurora blobs (sine yoyo), form fields stagger in.
 *  `useGSAP` provides automatic cleanup on unmount.
 */
export function LoginPage() {
  const brand = useBrand();
  const rtl = brand.direction === 'rtl';
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const container = useRef<HTMLDivElement>(null);
  const ArrowIcon = rtl ? ArrowBack : ArrowForward;

  // GSAP intro + aurora drift — auto-cleaned by useGSAP
  useGSAP(
    () => {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const root = container.current;
      const hero = root?.querySelector('[data-hero]');
      if (reduced) {
        if (hero) gsap.set(hero, { autoAlpha: 1, y: 0 });
        if (root) gsap.set(root.querySelectorAll('[data-reveal]'), { autoAlpha: 1, y: 0 });
      } else {
        if (hero) fadeInUp(hero, 0, 10);
        if (root) staggerChildren(root, '[data-reveal]', { duration: 0.3, stagger: 0.06, delay: 0.12 });
      }

      // Aurora drift
      if (!reduced) {
        gsap.to('[data-blob="1"]', {
          x: 30, y: 20, duration: 8, ease: 'sine.inOut', yoyo: true, repeat: -1,
        });
        gsap.to('[data-blob="2"]', {
          x: -24, y: -18, duration: 10, ease: 'sine.inOut', yoyo: true, repeat: -1,
        });
        gsap.to('[data-blob="3"]', {
          x: 14, y: 14, duration: 13, ease: 'sine.inOut', yoyo: true, repeat: -1,
        });
      }
    },
    { scope: container }
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      const msg = err?.message || '';
      setError(
        rtl
          ? msg.includes('invalid-credential') || msg.includes('wrong-password')
            ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
            : 'تعذر تسجيل الدخول. تحقق من البيانات.'
          : msg || 'Unable to sign in. Please check your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  const loginGradient =
    'linear-gradient(155deg, #0c1222 0%, #1e3a8a 45%, #2563eb 100%)';

  return (
    <div ref={container} className="min-h-[100dvh] bg-surface-canvas flex flex-col lg:flex-row lg:min-h-screen">
      {/* Mobile — compact branded strip: form stays above the fold (no 40vh empty hero) */}
      <div
        className="lg:hidden relative overflow-hidden shrink-0 grain text-white px-5 pt-[max(12px,env(safe-area-inset-top))] pb-4"
        style={{ background: loginGradient }}
      >
        <div
          aria-hidden
          className="absolute -top-16 end-0 w-[200px] h-[200px] rounded-full blur-3xl pointer-events-none opacity-50"
          style={{ background: 'radial-gradient(closest-side, #8B5CF6, transparent)' }}
        />
        <div className="relative flex items-start gap-3">
          <LogoMark size={36} />
          <div className="min-w-0 flex-1 pt-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-base text-white leading-tight">{brand.name}</span>
              <span className="inline-flex items-center gap-1 h-6 px-2 rounded-full text-[0.65rem] font-semibold bg-white/15 border border-white/15">
                <Bolt sx={{ fontSize: 11, color: '#FBBF24' }} />
                {rtl ? 'تسجيل الدخول' : 'Sign in'}
              </span>
            </div>
            <p className="text-white/85 text-sm font-medium mt-1.5 leading-snug line-clamp-2">
              {rtl ? 'فواتير، عملاء، ومدفوعات في مكان واحد.' : brand.tagline || 'Operations, simplified.'}
            </p>
          </div>
        </div>
      </div>

      {/* Desktop — full aurora hero */}
      <div
        data-hero
        className="relative overflow-hidden text-white flex-shrink-0 hidden lg:flex lg:w-1/2 lg:min-h-[100dvh] grain"
        style={{
          background: loginGradient,
        }}
      >
        <div
          data-blob="1"
          aria-hidden
          className="absolute -top-28 -right-24 w-[340px] h-[340px] rounded-full blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(closest-side, #8B5CF6, transparent)', opacity: 0.55 }}
        />
        <div
          data-blob="2"
          aria-hidden
          className="absolute -bottom-24 -left-28 w-[420px] h-[420px] rounded-full blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(closest-side, #F59E0B, transparent)', opacity: 0.3 }}
        />
        <div
          data-blob="3"
          aria-hidden
          className="absolute top-1/3 left-1/4 w-[240px] h-[240px] rounded-full blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(closest-side, #EC4899, transparent)', opacity: 0.25 }}
        />

        <div
          className="absolute inset-0 opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.8) 1px, transparent 0)',
            backgroundSize: '22px 22px',
          }}
          aria-hidden
        />

        <div className="relative h-full flex flex-col justify-between p-10 xl:p-14">
          <div className="flex items-center gap-3">
            <LogoMark size={40} />
            <div className="flex flex-col leading-tight">
              <span className="text-white font-bold text-base sm:text-lg">{brand.name}</span>
              {brand.features?.showTagline && (
                <span className="text-white/70 text-2xs">{brand.fullName}</span>
              )}
            </div>
          </div>

          <div className="space-y-4 max-w-lg">
            <span className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-2xs font-semibold bg-white/15 text-white/90 backdrop-blur border border-white/15">
              <Bolt sx={{ fontSize: 12, color: '#FBBF24' }} />
              {rtl ? 'الإصدار الجديد' : 'New generation'}
            </span>
            <h1 className="text-3xl xl:text-5xl font-extrabold leading-[1.1] tracking-tight">
              {rtl ? 'إدارة أعمالك — أسرع، أذكى، أجمل.' : brand.tagline || 'Operations, simplified.'}
            </h1>
            <p className="text-white/80 text-sm xl:text-base leading-relaxed">
              {rtl
                ? 'فواتير، عملاء، مدفوعات، ومستندات احترافية — كل ما تحتاجه لإدارة عملك بسلاسة.'
                : 'Invoices, clients, payments, and professional documents — everything you need.'}
            </p>
          </div>

          <div className="flex items-center gap-3 text-sm text-white/70">
            <span className="inline-block h-px w-10 bg-white/40" />
            <span>© {new Date().getFullYear()} {brand.fullName}</span>
          </div>
        </div>
      </div>

      {/* Form — priority on mobile: scroll if keyboard open, still starts at top */}
      <div className="flex-1 flex flex-col justify-start lg:justify-center min-h-0 overflow-y-auto p-5 sm:p-8 lg:p-12 pb-[max(24px,env(safe-area-inset-bottom))]">
        <div className="w-full max-w-sm mx-auto">
          <div data-reveal className="mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-fg tracking-tight">
              {rtl ? 'مرحباً بعودتك' : 'Welcome back'}
            </h2>
            <p className="text-sm text-fg-subtle mt-1.5">
              {rtl ? 'سجّل الدخول للمتابعة إلى حسابك.' : 'Sign in to continue to your workspace.'}
            </p>
          </div>

          {error && (
            <div
              data-reveal
              role="alert"
              className="mb-4 p-3 rounded-md text-sm font-medium flex items-start gap-2"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--brand-danger) 10%, transparent)',
                color: 'var(--brand-danger)',
                borderWidth: 1,
                borderStyle: 'solid',
                borderColor: 'color-mix(in srgb, var(--brand-danger) 24%, transparent)',
              }}
            >
              <span
                className="inline-block w-1 self-stretch rounded-full shrink-0"
                style={{ backgroundColor: 'var(--brand-danger)' }}
                aria-hidden
              />
              <span className="flex-1">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div data-reveal>
              <Input
                label={rtl ? 'البريد الإلكتروني' : 'Email'}
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail sx={{ fontSize: 18 }} />}
                autoComplete="email"
                required
                dir="ltr"
              />
            </div>
            <div data-reveal>
              <Input
                label={rtl ? 'كلمة المرور' : 'Password'}
                type={showPw ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock sx={{ fontSize: 18 }} />}
                rightIcon={
                  <IconButton
                    type="button"
                    size="sm"
                    label={showPw ? (rtl ? 'إخفاء' : 'Hide') : rtl ? 'إظهار' : 'Show'}
                    onClick={() => setShowPw((v) => !v)}
                    className="!h-7 !w-7"
                  >
                    {showPw ? <VisibilityOff sx={{ fontSize: 16 }} /> : <Visibility sx={{ fontSize: 16 }} />}
                  </IconButton>
                }
                autoComplete="current-password"
                required
                dir="ltr"
              />
            </div>

            <div data-reveal className="pt-3">
              <Button
                type="submit"
                block
                size="lg"
                loading={loading}
                rightIcon={!loading && <ArrowIcon sx={{ fontSize: 18 }} />}
                className="btn-primary-glow"
              >
                {loading
                  ? rtl ? 'جاري التحقق…' : 'Signing in…'
                  : rtl ? 'تسجيل الدخول' : 'Sign in'}
              </Button>
            </div>
          </form>

          <p data-reveal className="text-2xs text-fg-muted text-center mt-8 lg:hidden">
            © {new Date().getFullYear()} {brand.fullName}
          </p>
        </div>
      </div>
    </div>
  );
}
