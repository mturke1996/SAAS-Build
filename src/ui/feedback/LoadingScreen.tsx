import { useBrand } from '../../config/BrandProvider';
import { LogoMark } from '../brand/LogoMark';

/**
 * LoadingScreen — premium cold-start screen.
 *
 *  Brand aurora + subtle grain + pulsing dots. Feels like opening a native
 *  iOS app. Uses only CSS animations (no JS deps) so it renders before the
 *  main bundle is parsed.
 */
export function LoadingScreen() {
  const brand = useBrand();
  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-5 bg-surface-canvas grain"
      aria-busy="true"
      role="status"
      aria-label={brand.direction === 'rtl' ? 'جاري التحميل' : 'Loading'}
    >
      {/* Aurora blobs */}
      <div
        aria-hidden
        className="absolute inset-0 overflow-hidden pointer-events-none"
      >
        <div
          className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] rounded-full blur-3xl opacity-30 animate-aurora"
          style={{ background: 'radial-gradient(closest-side, var(--brand-primary), transparent)' }}
        />
        <div
          className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full blur-3xl opacity-20 animate-aurora"
          style={{
            background: 'radial-gradient(closest-side, var(--brand-secondary), transparent)',
            animationDelay: '-6s',
          }}
        />
      </div>

      <LogoMark size={64} />

      <div className="flex items-center gap-2" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 rounded-full"
            style={{
              background: 'var(--brand-primary)',
              animation: `saas-dot 1.2s ${i * 0.15}s infinite ease-in-out both`,
            }}
          />
        ))}
      </div>
      <span className="text-xs text-fg-muted font-medium">
        {brand.direction === 'rtl' ? `جاري تحميل ${brand.name}…` : `Loading ${brand.name}…`}
      </span>

      <style>{`
        @keyframes saas-dot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40%           { transform: scale(1);   opacity: 1; }
        }
      `}</style>
    </div>
  );
}
