import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { pageIntro } from './presets';

/**
 * useReveal — one-line page intro with automatic cleanup.
 *
 *   const ref = useReveal<HTMLDivElement>();
 *   return <div ref={ref}>...</div>;
 *
 *  Built on `useGSAP` (from @gsap/react) per GSAP's official React skill:
 *   - Automatic cleanup via gsap.context() on unmount
 *   - Strict-mode safe (handles React dev double-mount)
 *   - Respects prefers-reduced-motion
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T | null>(null);

  useGSAP(
    () => {
      if (!ref.current) return;
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduced) {
        gsap.set(ref.current, { autoAlpha: 1 });
        gsap.set(ref.current.querySelectorAll('[data-reveal]'), { autoAlpha: 1, y: 0 });
        return;
      }
      pageIntro(ref.current);
    },
    { scope: ref }
  );

  return ref;
}
