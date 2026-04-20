/**
 * PDF Shared Styles
 * =================
 * Print-safe colors and base styles for all PDF documents
 */

import { StyleSheet } from '@react-pdf/renderer';
import { PDF_FONT_FAMILY } from './pdfFonts';

// Brand Colors (print-safe)
export const PDF_COLORS = {
  primary: '#364036',
  secondary: '#4a5d4a',
  accent: '#c8c0b0',
  accentDark: '#8b7e6a',
  text: '#1a1f1a',
  textMuted: '#6b7f6b',
  textLight: '#999999',
  white: '#ffffff',
  border: '#e8e5de',
  success: '#0d9668',
  warning: '#c9a54e',
  error: '#d64545',
  tableRowAlt: '#fafaf8',
};

// Base page styles
export const pdfBaseStyles = StyleSheet.create({
  page: {
    fontFamily: PDF_FONT_FAMILY,
    fontSize: 10,
    color: PDF_COLORS.text,
    backgroundColor: PDF_COLORS.white,
    paddingTop: 35,
    paddingBottom: 60,
    paddingHorizontal: 40,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    textAlign: 'center',
    borderTopWidth: 1,
    borderTopColor: PDF_COLORS.border,
    paddingTop: 8,
  },
  footerText: {
    fontSize: 7,
    color: PDF_COLORS.textLight,
    fontWeight: 600,
    fontFamily: PDF_FONT_FAMILY,
  },
});
