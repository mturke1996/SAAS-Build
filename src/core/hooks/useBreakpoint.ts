import { useEffect, useState } from 'react';

/** Mobile-first breakpoints (match Tailwind defaults). */
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export type BreakpointKey = keyof typeof BREAKPOINTS;

/** Returns true when viewport >= given breakpoint. SSR-safe. */
export function useBreakpoint(key: BreakpointKey) {
  const query = `(min-width: ${BREAKPOINTS[key]}px)`;
  const [matches, setMatches] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia(query).matches
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    setMatches(mql.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

export function useIsDesktop() {
  return useBreakpoint('lg');
}
