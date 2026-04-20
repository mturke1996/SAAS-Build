/**
 * Legacy Logo shim — forwards to the new LogoMark, mapping the old
 * `size`/`showSubtitle` props to the DS equivalents.
 */
import { LogoMark } from '../brand/LogoMark';

interface LegacyLogoProps {
  size?: number | string;
  variant?: 'light' | 'dark' | 'color';
  showSubtitle?: boolean;
}

export function Logo({ size = 48, showSubtitle }: LegacyLogoProps) {
  const px = typeof size === 'number' ? size : parseInt(String(size), 10) || 48;
  return <LogoMark size={px} showName={showSubtitle} />;
}
