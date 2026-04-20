/**
 * Legacy theme shim — forwards to the new design-system MUI bridge.
 *
 * The old code imported `createAppTheme(mode)` from `./theme`. That API is
 * preserved here, but it now reads the live brand from `useBrandStore` so
 * legacy MUI surfaces inherit the white-label palette automatically.
 */
import { createMuiBridge } from '../design-system/theme/createMuiBridge';
import { useBrandStore } from '../stores/useBrandStore';
import type { ThemeMode } from '../config/brand.types';

export type { ThemeMode };

export function createAppTheme(mode: ThemeMode = 'light') {
  const brand = useBrandStore.getState().brand;
  return createMuiBridge(brand, mode);
}

export default createAppTheme;
