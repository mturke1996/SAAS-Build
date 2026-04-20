// @ts-nocheck
/**
 * Arabic Text Reshaper for @react-pdf/renderer
 * 
 * react-pdf does NOT support Arabic natively:
 * - Letters appear disconnected (no contextual joining)
 * - Text direction is LTR instead of RTL
 * 
 * This module fixes both issues by:
 * 1. Replacing Arabic letters with their correct presentation forms
 * 2. Handling lam-alef ligatures
 * 3. Reversing text order for correct RTL display
 */

// Arabic Presentation Forms B (FE70-FEFF)
// Format: [isolated, final, initial, medial]
// Right-joining letters have only [isolated, final] (initial/medial = null)
const FORMS: Record<string, (string | null)[]> = {
  '\u0621': ['\uFE80', null, null, null],          // ء hamza
  '\u0622': ['\uFE81', '\uFE82', null, null],      // آ alef madda
  '\u0623': ['\uFE83', '\uFE84', null, null],      // أ alef hamza above
  '\u0624': ['\uFE85', '\uFE86', null, null],      // ؤ waw hamza
  '\u0625': ['\uFE87', '\uFE88', null, null],      // إ alef hamza below
  '\u0626': ['\uFE89', '\uFE8A', '\uFE8B', '\uFE8C'], // ئ yeh hamza
  '\u0627': ['\uFE8D', '\uFE8E', null, null],      // ا alef
  '\u0628': ['\uFE8F', '\uFE90', '\uFE91', '\uFE92'], // ب beh
  '\u0629': ['\uFE93', '\uFE94', null, null],      // ة teh marbuta
  '\u062A': ['\uFE95', '\uFE96', '\uFE97', '\uFE98'], // ت teh
  '\u062B': ['\uFE99', '\uFE9A', '\uFE9B', '\uFE9C'], // ث theh
  '\u062C': ['\uFE9D', '\uFE9E', '\uFE9F', '\uFEA0'], // ج jeem
  '\u062D': ['\uFEA1', '\uFEA2', '\uFEA3', '\uFEA4'], // ح hah
  '\u062E': ['\uFEA5', '\uFEA6', '\uFEA7', '\uFEA8'], // خ khah
  '\u062F': ['\uFEA9', '\uFEAA', null, null],      // د dal
  '\u0630': ['\uFEAB', '\uFEAC', null, null],      // ذ thal
  '\u0631': ['\uFEAD', '\uFEAE', null, null],      // ر reh
  '\u0632': ['\uFEAF', '\uFEB0', null, null],      // ز zain
  '\u0633': ['\uFEB1', '\uFEB2', '\uFEB3', '\uFEB4'], // س seen
  '\u0634': ['\uFEB5', '\uFEB6', '\uFEB7', '\uFEB8'], // ش sheen
  '\u0635': ['\uFEB9', '\uFEBA', '\uFEBB', '\uFEBC'], // ص sad
  '\u0636': ['\uFEBD', '\uFEBE', '\uFEBF', '\uFEC0'], // ض dad
  '\u0637': ['\uFEC1', '\uFEC2', '\uFEC3', '\uFEC4'], // ط tah
  '\u0638': ['\uFEC5', '\uFEC6', '\uFEC7', '\uFEC8'], // ظ zah
  '\u0639': ['\uFEC9', '\uFECA', '\uFECB', '\uFECC'], // ع ain
  '\u063A': ['\uFECD', '\uFECE', '\uFECF', '\uFED0'], // غ ghain
  '\u0640': ['\u0640', '\u0640', '\u0640', '\u0640'],   // ـ tatweel
  '\u0641': ['\uFED1', '\uFED2', '\uFED3', '\uFED4'], // ف feh
  '\u0642': ['\uFED5', '\uFED6', '\uFED7', '\uFED8'], // ق qaf
  '\u0643': ['\uFED9', '\uFEDA', '\uFEDB', '\uFEDC'], // ك kaf
  '\u0644': ['\uFEDD', '\uFEDE', '\uFEDF', '\uFEE0'], // ل lam
  '\u0645': ['\uFEE1', '\uFEE2', '\uFEE3', '\uFEE4'], // م meem
  '\u0646': ['\uFEE5', '\uFEE6', '\uFEE7', '\uFEE8'], // ن noon
  '\u0647': ['\uFEE9', '\uFEEA', '\uFEEB', '\uFEEC'], // ه heh
  '\u0648': ['\uFEED', '\uFEEE', null, null],      // و waw
  '\u0649': ['\uFEEF', '\uFEF0', null, null],      // ى alef maksura
  '\u064A': ['\uFEF1', '\uFEF2', '\uFEF3', '\uFEF4'], // ي yeh
};

// Lam-Alef ligatures: when lam (U+0644) is followed by alef variants
const LAM_ALEF: Record<string, [string, string]> = {
  '\u0622': ['\uFEF5', '\uFEF6'], // لآ [isolated, final]
  '\u0623': ['\uFEF7', '\uFEF8'], // لأ
  '\u0625': ['\uFEF9', '\uFEFA'], // لإ
  '\u0627': ['\uFEFB', '\uFEFC'], // لا
};

// Diacritics (tashkeel) - these are non-joining combining marks
const DIACRITICS = new Set([
  '\u064B', '\u064C', '\u064D', '\u064E', '\u064F',
  '\u0650', '\u0651', '\u0652', '\u0670', '\u0610',
  '\u0611', '\u0612', '\u0613', '\u0614', '\u0615',
]);

function isArabicLetter(ch: string): boolean {
  return FORMS.hasOwnProperty(ch);
}

function isDiacritic(ch: string): boolean {
  return DIACRITICS.has(ch);
}

function isRightJoiningOnly(ch: string): boolean {
  const f = FORMS[ch];
  return f != null && f[2] === null; // no initial form = right-joining only
}

function canJoinRight(ch: string): boolean {
  return isArabicLetter(ch);
}

function canJoinLeft(ch: string): boolean {
  return isArabicLetter(ch) && !isRightJoiningOnly(ch);
}

/**
 * Reshape Arabic text: replace characters with correct presentation forms
 * and handle lam-alef ligatures
 */
function reshapeArabic(text: string): string {
  // Strip diacritics for simpler reshaping (they cause issues in react-pdf anyway)
  const chars: string[] = [];
  for (const ch of text) {
    if (!isDiacritic(ch)) {
      chars.push(ch);
    }
  }

  const result: string[] = [];
  let i = 0;

  while (i < chars.length) {
    const ch = chars[i];

    if (!isArabicLetter(ch)) {
      result.push(ch);
      i++;
      continue;
    }

    // Check for lam-alef ligature
    if (ch === '\u0644' && i + 1 < chars.length && LAM_ALEF[chars[i + 1]]) {
      const alef = chars[i + 1];
      const prevChar = i > 0 ? chars[i - 1] : null;
      const prevCanJoinLeft = prevChar && canJoinLeft(prevChar);

      // Ligature form: [isolated, final]
      const lig = LAM_ALEF[alef];
      result.push(prevCanJoinLeft ? lig[1] : lig[0]);
      i += 2;
      continue;
    }

    // Determine context
    const prevChar = i > 0 ? chars[i - 1] : null;
    const nextChar = i + 1 < chars.length ? chars[i + 1] : null;

    const prevJoinsLeft = prevChar != null && canJoinLeft(prevChar);
    const nextJoinsRight = nextChar != null && canJoinRight(nextChar);
    const currentCanJoinLeft = canJoinLeft(ch);

    const forms = FORMS[ch];
    let form: string;

    if (prevJoinsLeft && nextJoinsRight && currentCanJoinLeft) {
      // Medial form
      form = forms[3] || forms[0];
    } else if (prevJoinsLeft) {
      // Final form
      form = forms[1] || forms[0];
    } else if (nextJoinsRight && currentCanJoinLeft) {
      // Initial form
      form = forms[2] || forms[0];
    } else {
      // Isolated form
      form = forms[0];
    }

    result.push(form);
    i++;
  }

  return result.join('');
}

/**
 * Process text for react-pdf Arabic display:
 * 1. Reshape Arabic characters to presentation forms
 * 2. Reverse text segments for RTL display (react-pdf only does LTR)
 * 3. Handle mixed Arabic/Latin/number text
 */
export function ar(text: string | number | null | undefined): string {
  if (text == null) return '';
  const str = String(text);
  if (!str) return '';

  // Split into segments: Arabic vs non-Arabic
  const segments: { text: string; isArabic: boolean }[] = [];
  let current = '';
  let currentIsArabic = false;

  for (const ch of str) {
    const charCode = ch.charCodeAt(0);
    const isAr = (charCode >= 0x0600 && charCode <= 0x06FF) || 
                 (charCode >= 0xFB50 && charCode <= 0xFDFF) ||
                 (charCode >= 0xFE70 && charCode <= 0xFEFF);

    if (current === '') {
      currentIsArabic = isAr;
      current = ch;
    } else if (isAr === currentIsArabic || ch === ' ') {
      current += ch;
    } else {
      segments.push({ text: current, isArabic: currentIsArabic });
      current = ch;
      currentIsArabic = isAr;
    }
  }
  if (current) {
    segments.push({ text: current, isArabic: currentIsArabic });
  }

  // Process each segment
  const processed = segments.map(seg => {
    if (seg.isArabic) {
      // Reshape and reverse for RTL display
      const reshaped = reshapeArabic(seg.text);
      return [...reshaped].reverse().join('');
    }
    return seg.text;
  });

  // Reverse segment order for RTL
  return processed.reverse().join('');
}

/**
 * Format number with Arabic currency suffix
 * Keeps numbers as-is (Western digits) for clarity
 */
export function arMoney(n: number): string {
  return ar(String(Math.round(n)) + ' د.ل');
}

/**
 * Format date for PDF
 */
export function arDate(d: string): string {
  try {
    const dt = new Date(d);
    return `${dt.getDate().toString().padStart(2, '0')}/${(dt.getMonth() + 1).toString().padStart(2, '0')}/${dt.getFullYear()}`;
  } catch {
    return d;
  }
}
