import { useEffect, useState } from 'react';

/**
 * useIdleHint — fires `true` after `ms` of no pointer/keyboard activity.
 * Useful for triggering subtle "need help?" hints or auto-collapsing panels.
 */
export function useIdleHint(ms: number = 45_000) {
  const [idle, setIdle] = useState(false);

  useEffect(() => {
    let timer: number | undefined;
    const reset = () => {
      setIdle(false);
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(() => setIdle(true), ms);
    };
    const events = ['mousemove', 'keydown', 'pointerdown', 'scroll', 'touchstart'];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => {
      events.forEach((e) => window.removeEventListener(e, reset));
      if (timer) window.clearTimeout(timer);
    };
  }, [ms]);

  return idle;
}
