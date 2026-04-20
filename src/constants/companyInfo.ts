import { useBrandStore } from '../stores/useBrandStore';

/**
 * ============================================================================
 *  LEGACY COMPANY_INFO — shim
 * ============================================================================
 *  Older screens (legacy pages, PDF templates) imported a static
 *  `COMPANY_INFO` object. In the white-label system, there is no static
 *  company — everything reads from the dynamic `BrandConfig`.
 *
 *  We expose a `COMPANY_INFO` proxy whose getters pull LIVE values from the
 *  brand store, so those old screens continue to work without modification
 *  AND automatically reflect any runtime branding changes.
 * ============================================================================
 */

function snapshot() {
  const b = useBrandStore.getState().brand;
  return {
    name: b.name,
    fullName: b.fullName,
    address: b.contact.address || '',
    phone: b.contact.phone || '',
    phone2: b.contact.phoneSecondary || '',
    email: b.contact.email || '',
    website: b.contact.website || '',
    facebook: b.contact.social?.facebook || '',
    instagram: b.contact.social?.instagram || '',
  };
}

/**
 * Live proxy — every read hits the current brand. Use this if you need the
 * values to update on brand changes without re-subscribing.
 */
export const COMPANY_INFO = new Proxy(
  {} as ReturnType<typeof snapshot>,
  {
    get(_t, key: string) {
      return (snapshot() as any)[key];
    },
    ownKeys() {
      return Object.keys(snapshot());
    },
    getOwnPropertyDescriptor() {
      return { enumerable: true, configurable: true };
    },
  }
);

/** Helper for non-reactive, one-shot reads (PDF render etc.). */
export function getCompanyInfo() {
  return snapshot();
}
