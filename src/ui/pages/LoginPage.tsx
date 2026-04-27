import { FormEvent, useRef, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { fadeInUp, staggerChildren, scaleIn } from '../../core/motion/presets';
import {
  Mail,
  Lock,
  ArrowForward,
  ArrowBack,
  Visibility,
  VisibilityOff,
  Bolt,
  Shield,
} from '@mui/icons-material';
import { useAuthStore } from '../../stores/useAuthStore';
import { useBrand } from '../../config/BrandProvider';
import { LogoMark } from '../brand/LogoMark';
import { Button, Input, IconButton } from '../../design-system/primitives';

/**
 * Login — fintech / premium SaaS auth (UI/UX Pro Max: trust palette, glass, motion budget).
 * Mobile: full-bleed aurora hero + overlapping frosted sheet (iOS-style), 48px touch rows.
 * Desktop: split hero + same glass panel for visual parity.
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

  const loginGradient =
    'linear-gradient(160deg, #050810 0%, #0d1528 38%, #1A2B58 72%, #2a4275 100%)';

  useGSAP(
    () => {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const root = container.current;
      if (!root) return;

      const card = root.querySelector('[data-login-card]');
      const hero = root.querySelector('[data-hero]');
      const mobileHero = root.querySelector('[data-mobile-hero]');

      if (reduced) {
        if (hero) gsap.set(hero, { autoAlpha: 1, y: 0 });
        if (mobileHero) gsap.set(mobileHero, { autoAlpha: 1, y: 0 });
        if (card) gsap.set(card, { autoAlpha: 1, scale: 1 });
        gsap.set(root.querySelectorAll('[data-reveal]'), { autoAlpha: 1, y: 0 });
      } else {
        if (hero) fadeInUp(hero, 0, 12);
        if (mobileHero) fadeInUp(mobileHero, 0, 10);
        if (card) scaleIn(card, 0.06);
        staggerChildren(root, '[data-reveal]', { duration: 0.28, stagger: 0.065, delay: 0.16 });

        gsap.to(root.querySelectorAll('[data-blob="1"]'), {
          x: 30,
          y: 20,
          duration: 8,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
        });
        gsap.to(root.querySelectorAll('[data-blob="2"]'), {
          x: -24,
          y: -18,
          duration: 10,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
        });
        gsap.to(root.querySelectorAll('[data-blob="3"]'), {
          x: 14,
          y: 14,
          duration: 13,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
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

  const Blob = ({ n, className, style }: { n: '1' | '2' | '3'; className?: string; style?: CSSProperties }) => (
    <div data-blob={n} aria-hidden className={className} style={style} />
  );

  return (
    <div
      ref={container}
      className="min-h-[100dvh] bg-surface-canvas flex flex-col lg:flex-row lg:min-h-screen"
    >
      {/* ── Mobile hero — immersive aurora (app-like first paint) ── */}
      <div
        data-mobile-hero
        className="lg:hidden relative flex-shrink-0 overflow-hidden grain text-white min-h-[min(52vh,520px)] max-h-[560px]"
        style={{ background: loginGradient }}
      >
        <Blob
          n="1"
          className="absolute -top-24 -end-8 w-[280px] h-[280px] rounded-full blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(closest-side, rgba(96,130,200,0.45), transparent)', opacity: 0.45 }}
        />
        <Blob
          n="2"
          className="absolute -bottom-20 -start-16 w-[320px] h-[320px] rounded-full blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(closest-side, rgba(196,92,78,0.5), transparent)', opacity: 0.22 }}
        />
        <Blob
          n="3"
          className="absolute top-1/3 start-1/4 w-[200px] h-[200px] rounded-full blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(closest-side, rgba(253,226,230,0.35), transparent)', opacity: 0.18 }}
        />
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.85) 1px, transparent 0)',
            backgroundSize: '20px 20px',
          }}
          aria-hidden
        />

        <div
          className="relative h-full flex flex-col justify-between px-5 pt-[max(16px,env(safe-area-inset-top))] pb-16"
        >
          <div className="flex items-start gap-3.5">
            <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 p-2.5 shadow-lg">
              <LogoMark size={40} />
            </div>
            <div className="min-w-0 flex-1 pt-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-lg text-white leading-tight tracking-tight">
                  {brand.name}
                </span>
                <span className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full text-[0.65rem] font-bold bg-white/12 border border-white/15 backdrop-blur-sm">
                  <Bolt sx={{ fontSize: 12, color: '#FBBF24' }} />
                  {rtl ? 'تسجيل الدخول' : 'Sign in'}
                </span>
              </div>
              <p className="text-white/88 text-sm font-medium mt-2 leading-snug max-w-[20rem]">
                {rtl
                  ? 'فواتير، عملاء، ومدفوعات — في تجربة واحدة سلسة.'
                  : brand.tagline || 'Operations, simplified.'}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-2xl xs:text-3xl font-extrabold leading-[1.15] tracking-tight text-white drop-shadow-sm">
              {rtl ? 'مرحباً بعودتك' : 'Welcome back'}
            </h1>
            <p className="text-white/75 text-sm leading-relaxed max-w-[18rem]">
              {rtl
                ? 'أدخل بياناتك للوصول إلى لوحة التحكم بأمان.'
                : 'Enter your credentials to access your workspace securely.'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Desktop hero ── */}
      <div
        data-hero
        className="relative overflow-hidden text-white flex-shrink-0 hidden lg:flex lg:w-[46%] xl:w-1/2 lg:min-h-[100dvh] grain"
        style={{ background: loginGradient }}
      >
        <Blob
          n="1"
          className="absolute -top-28 -right-24 w-[340px] h-[340px] rounded-full blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(closest-side, rgba(96,130,200,0.45), transparent)', opacity: 0.45 }}
        />
        <Blob
          n="2"
          className="absolute -bottom-24 -left-28 w-[420px] h-[420px] rounded-full blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(closest-side, rgba(196,92,78,0.5), transparent)', opacity: 0.22 }}
        />
        <Blob
          n="3"
          className="absolute top-1/3 left-1/4 w-[240px] h-[240px] rounded-full blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(closest-side, rgba(253,226,230,0.35), transparent)', opacity: 0.18 }}
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
            <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/12 p-2 shadow-lg">
              <LogoMark size={44} />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-white font-extrabold text-lg sm:text-xl tracking-tight">{brand.name}</span>
              {brand.features?.showTagline && (
                <span className="text-white/70 text-2xs">{brand.fullName}</span>
              )}
            </div>
          </div>

          <div className="space-y-5 max-w-lg">
            <span className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full text-2xs font-bold bg-white/12 text-white/95 backdrop-blur-md border border-white/15">
              <Bolt sx={{ fontSize: 13, color: '#FBBF24' }} />
              {rtl ? 'منصة موثوقة' : 'Trusted platform'}
            </span>
            <h2 className="text-3xl xl:text-5xl font-extrabold leading-[1.08] tracking-tight">
              {rtl ? 'إدارة أعمالك — أسرع، أوضح، أجمل.' : brand.tagline || 'Operations, simplified.'}
            </h2>
            <p className="text-white/80 text-sm xl:text-base leading-relaxed">
              {rtl
                ? 'فواتير، عملاء، مدفوعات، ومستندات احترافية — كل ما تحتاجه في مكان واحد.'
                : 'Invoices, clients, payments, and documents — everything in one place.'}
            </p>
          </div>

          <div className="flex items-center gap-3 text-sm text-white/65">
            <span className="inline-block h-px w-10 bg-white/35" />
            <span>
              © {new Date().getFullYear()} {brand.fullName}
            </span>
          </div>
        </div>
      </div>

      {/* ── Form — glass sheet on mobile (overlap hero), centered on desktop ── */}
      <div className="flex-1 flex flex-col justify-start lg:justify-center min-h-0 overflow-y-auto z-10 -mt-10 lg:mt-0 px-4 sm:px-6 lg:px-10 xl:px-14 pb-[max(28px,env(safe-area-inset-bottom))] pt-1 lg:pt-8">
        <div
          data-login-card
          className={[
            'w-full max-w-md mx-auto',
            'rounded-[1.75rem] p-6 sm:p-8',
            'bg-surface-panel/85 supports-[backdrop-filter]:bg-surface-panel/75 backdrop-blur-2xl',
            'border border-border/90 shadow-[0_25px_60px_-15px_rgba(15,23,42,0.18)]',
            'dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.55)]',
            'ring-1 ring-inset ring-black/[0.03] dark:ring-white/[0.06]',
          ].join(' ')}
        >
          <div data-reveal className="mb-6 sm:mb-7">
            <h2 className="text-xl sm:text-2xl font-extrabold text-fg tracking-tight">
              {rtl ? 'تسجيل الدخول' : 'Sign in'}
            </h2>
            <p className="text-sm text-fg-subtle mt-2 leading-relaxed">
              {rtl ? 'استخدم بريدك وكلمة المرور المرتبطة بحسابك.' : 'Use your work email and password.'}
            </p>
          </div>

          {error && (
            <div
              data-reveal
              role="alert"
              className="mb-5 p-3.5 rounded-xl text-sm font-medium flex items-start gap-2.5"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--brand-danger) 10%, transparent)',
                color: 'var(--brand-danger)',
                borderWidth: 1,
                borderStyle: 'solid',
                borderColor: 'color-mix(in srgb, var(--brand-danger) 24%, transparent)',
              }}
            >
              <span
                className="inline-block w-1 self-stretch rounded-full shrink-0 mt-0.5"
                style={{ backgroundColor: 'var(--brand-danger)' }}
                aria-hidden
              />
              <span className="flex-1 leading-snug">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div data-reveal>
              <Input
                fieldSize="lg"
                label={rtl ? 'البريد الإلكتروني' : 'Email'}
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail sx={{ fontSize: 20 }} />}
                autoComplete="email"
                required
                dir="ltr"
              />
            </div>
            <div data-reveal>
              <Input
                fieldSize="lg"
                label={rtl ? 'كلمة المرور' : 'Password'}
                type={showPw ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock sx={{ fontSize: 20 }} />}
                rightIcon={
                  <IconButton
                    type="button"
                    size="sm"
                    label={showPw ? (rtl ? 'إخفاء' : 'Hide') : rtl ? 'إظهار' : 'Show'}
                    onClick={() => setShowPw((v) => !v)}
                    className="!h-9 !w-9 min-h-[44px] min-w-[44px]"
                  >
                    {showPw ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                  </IconButton>
                }
                autoComplete="current-password"
                required
                dir="ltr"
              />
            </div>

            <div
              data-reveal
              className="flex items-center justify-center gap-2 py-1 text-2xs text-fg-muted"
            >
              <Shield sx={{ fontSize: 15 }} className="text-[color:var(--brand-success)] shrink-0" />
              <span>{rtl ? 'اتصال مشفّر (TLS) — بياناتك محمية' : 'Encrypted connection (TLS)'}</span>
            </div>

            <div data-reveal className="pt-1">
              <Button
                type="submit"
                block
                size="lg"
                loading={loading}
                rightIcon={!loading && <ArrowIcon sx={{ fontSize: 19 }} />}
                className="btn-primary-glow min-h-[52px] !text-base !rounded-xl"
              >
                {loading
                  ? rtl
                    ? 'جاري التحقق…'
                    : 'Signing in…'
                  : rtl
                    ? 'دخول'
                    : 'Sign in'}
              </Button>
            </div>
          </form>

          <p data-reveal className="text-2xs text-fg-muted text-center mt-8 leading-relaxed lg:hidden">
            © {new Date().getFullYear()} {brand.fullName}
          </p>
        </div>
      </div>
    </div>
  );
}
