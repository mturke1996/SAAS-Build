/**
 * ============================================================================
 *  MEMORY ENGINE — durable key/value store
 * ============================================================================
 *  Lightweight, dependency-free wrapper around localStorage. Used to
 *  persist:
 *    - white-label overrides (via useBrandStore — already persisted)
 *    - navigation patterns (via useSmartNav)
 *    - user preferences that don't belong in the server DB
 *
 *  Namespaced under `mem:` to avoid collisions with other storage.
 * ============================================================================
 */

const PREFIX = 'mem:';

function safeLs(): Storage | null {
  try {
    if (typeof window === 'undefined') return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

export const memory = {
  get<T = unknown>(key: string, fallback?: T): T | undefined {
    const ls = safeLs();
    if (!ls) return fallback;
    const raw = ls.getItem(PREFIX + key);
    if (raw == null) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  },

  set<T>(key: string, value: T): void {
    const ls = safeLs();
    if (!ls) return;
    try {
      ls.setItem(PREFIX + key, JSON.stringify(value));
    } catch {}
  },

  remove(key: string): void {
    safeLs()?.removeItem(PREFIX + key);
  },

  /** Clear all memory entries (keeps other localStorage keys intact). */
  clearAll(): void {
    const ls = safeLs();
    if (!ls) return;
    const toRemove: string[] = [];
    for (let i = 0; i < ls.length; i++) {
      const k = ls.key(i);
      if (k && k.startsWith(PREFIX)) toRemove.push(k);
    }
    toRemove.forEach((k) => ls.removeItem(k));
  },

  keys(): string[] {
    const ls = safeLs();
    if (!ls) return [];
    const out: string[] = [];
    for (let i = 0; i < ls.length; i++) {
      const k = ls.key(i);
      if (k && k.startsWith(PREFIX)) out.push(k.slice(PREFIX.length));
    }
    return out;
  },
};
