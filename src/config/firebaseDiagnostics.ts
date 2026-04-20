import { firebaseConfig, hasValidFirebase, db } from './firebase';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { useBrandStore } from '../stores/useBrandStore';

/**
 * ============================================================================
 *  FIREBASE DIAGNOSTICS — verify the DB connection
 * ============================================================================
 *  Exposes two helpers:
 *    • getFirebaseStatus()   — synchronous snapshot (source + validity)
 *    • testFirestoreRead()   — async ping that actually hits Firestore
 * ============================================================================
 */

export type ConfigSource = 'env' | 'brand' | 'default';

export interface FirebaseStatus {
  /** Which config source is currently active. */
  source: ConfigSource;
  /** Config appears valid (non-placeholder apiKey, projectId set). */
  valid: boolean;
  /** The Firebase projectId the SDK is connected to. */
  projectId: string;
  /** The authDomain (used by auth popups). */
  authDomain: string;
  /** True if the Firestore SDK is initialized. */
  firestoreReady: boolean;
  /** True if the current runtime override differs from what the SDK uses. */
  pendingReload: boolean;
}

/** Resolve which config source the SDK actually used at init time. */
export function getFirebaseStatus(): FirebaseStatus {
  const env = (import.meta.env as Record<string, string | undefined>);
  const hasEnv =
    !!env.VITE_FIREBASE_API_KEY &&
    !!env.VITE_FIREBASE_PROJECT_ID;

  const brandFb = useBrandStore.getState().brand.firebase;
  const hasBrand = !!brandFb.apiKey && brandFb.apiKey !== 'REPLACE_ME';

  const source: ConfigSource = hasEnv ? 'env' : hasBrand ? 'brand' : 'default';

  // Pending reload = user pasted new config but SDK hasn't re-initialized
  const runtimeBrandApiKey = brandFb.apiKey;
  const sdkApiKey = firebaseConfig.apiKey;
  const pendingReload =
    !hasEnv && // env always wins, no reload needed
    !!runtimeBrandApiKey &&
    runtimeBrandApiKey !== 'REPLACE_ME' &&
    runtimeBrandApiKey !== sdkApiKey;

  return {
    source,
    valid: !!hasValidFirebase,
    projectId: firebaseConfig.projectId || '—',
    authDomain: firebaseConfig.authDomain || '—',
    firestoreReady: !!db,
    pendingReload,
  };
}

export interface TestResult {
  ok: boolean;
  durationMs: number;
  collection?: string;
  code?: string;
  message?: string;
}

/**
 * Fire a lightweight read against a harmless collection to verify the DB
 * connection works end-to-end. Uses limit(1) for minimal cost.
 *
 * Returns quickly even when offline (Firestore persistent cache will respond
 * from cache) — we differentiate network success via the timing heuristic.
 */
export async function testFirestoreRead(): Promise<TestResult> {
  const start = performance.now();
  try {
    const q = query(collection(db, 'clients'), limit(1));
    await getDocs(q);
    return { ok: true, durationMs: Math.round(performance.now() - start), collection: 'clients' };
  } catch (err: any) {
    return {
      ok: false,
      durationMs: Math.round(performance.now() - start),
      code: err?.code,
      message: err?.message || String(err),
    };
  }
}
