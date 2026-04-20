// @ts-nocheck
import { Font } from '@react-pdf/renderer';

const REGULAR_FONT = `${window.location.origin}/fonts/Tajawal-Regular.ttf`;
const BOLD_FONT = `${window.location.origin}/fonts/Tajawal-Bold.ttf`;

Font.register({
  family: 'Cairo',
  fonts: [
    { src: REGULAR_FONT, fontWeight: 400 },
    { src: BOLD_FONT, fontWeight: 700 },
  ],
});

export const PDF_FONT_FAMILY = 'Cairo';
