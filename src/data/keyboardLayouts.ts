import type { Language } from '../types/game';

export type FingerId =
  | 'L-pinky'
  | 'L-ring'
  | 'L-middle'
  | 'L-index'
  | 'R-index'
  | 'R-middle'
  | 'R-ring'
  | 'R-pinky'
  | 'thumb';

export interface KeyDef {
  code: string;
  en: string;
  enShift: string;
  th: string;
  thShift: string;
  finger: FingerId;
  width?: number; // relative units, default 1
  isModifier?: boolean;
  label?: string;
  homeBump?: boolean;
}

export const FINGER_META: Record<
  FingerId,
  { nameTh: string; nameEn: string; color: string; glow: string }
> = {
  'L-pinky': {
    nameTh: 'นิ้วก้อยซ้าย',
    nameEn: 'Left Pinky',
    color: '#c95656',
    glow: 'rgba(201, 86, 86, 0.45)',
  },
  'L-ring': {
    nameTh: 'นิ้วนางซ้าย',
    nameEn: 'Left Ring',
    color: '#d48b45',
    glow: 'rgba(212, 139, 69, 0.45)',
  },
  'L-middle': {
    nameTh: 'นิ้วกลางซ้าย',
    nameEn: 'Left Middle',
    color: '#d4af37',
    glow: 'rgba(212, 175, 55, 0.45)',
  },
  'L-index': {
    nameTh: 'นิ้วชี้ซ้าย',
    nameEn: 'Left Index',
    color: '#48a87b',
    glow: 'rgba(72, 168, 123, 0.45)',
  },
  'R-index': {
    nameTh: 'นิ้วชี้ขวา',
    nameEn: 'Right Index',
    color: '#3f9bb8',
    glow: 'rgba(63, 155, 184, 0.45)',
  },
  'R-middle': {
    nameTh: 'นิ้วกลางขวา',
    nameEn: 'Right Middle',
    color: '#5a7ad4',
    glow: 'rgba(90, 122, 212, 0.45)',
  },
  'R-ring': {
    nameTh: 'นิ้วนางขวา',
    nameEn: 'Right Ring',
    color: '#9b6bc7',
    glow: 'rgba(155, 107, 199, 0.45)',
  },
  'R-pinky': {
    nameTh: 'นิ้วก้อยขวา',
    nameEn: 'Right Pinky',
    color: '#c95c98',
    glow: 'rgba(201, 92, 152, 0.45)',
  },
  thumb: {
    nameTh: 'นิ้วโป้ง',
    nameEn: 'Thumb',
    color: '#c8a96e',
    glow: 'rgba(200, 169, 110, 0.45)',
  },
};

export const KEYBOARD_ROWS: KeyDef[][] = [
  // Row 0: Number row
  [
    { code: 'Backquote', en: '`', enShift: '~', th: '_', thShift: '%', finger: 'L-pinky' },
    { code: 'Digit1', en: '1', enShift: '!', th: 'ๅ', thShift: '+', finger: 'L-pinky' },
    { code: 'Digit2', en: '2', enShift: '@', th: '/', thShift: '๑', finger: 'L-ring' },
    { code: 'Digit3', en: '3', enShift: '#', th: '-', thShift: '๒', finger: 'L-middle' },
    { code: 'Digit4', en: '4', enShift: '$', th: 'ภ', thShift: '๓', finger: 'L-index' },
    { code: 'Digit5', en: '5', enShift: '%', th: 'ถ', thShift: '๔', finger: 'L-index' },
    { code: 'Digit6', en: '6', enShift: '^', th: 'ุ', thShift: 'ู', finger: 'R-index' },
    { code: 'Digit7', en: '7', enShift: '&', th: 'ึ', thShift: '฿', finger: 'R-index' },
    { code: 'Digit8', en: '8', enShift: '*', th: 'ค', thShift: '๕', finger: 'R-middle' },
    { code: 'Digit9', en: '9', enShift: '(', th: 'ต', thShift: '๖', finger: 'R-ring' },
    { code: 'Digit0', en: '0', enShift: ')', th: 'จ', thShift: '๗', finger: 'R-pinky' },
    { code: 'Minus', en: '-', enShift: '_', th: 'ข', thShift: '๘', finger: 'R-pinky' },
    { code: 'Equal', en: '=', enShift: '+', th: 'ช', thShift: '๙', finger: 'R-pinky' },
    {
      code: 'Backspace',
      en: '',
      enShift: '',
      th: '',
      thShift: '',
      finger: 'R-pinky',
      width: 1.9,
      isModifier: true,
      label: '⌫',
    },
  ],
  // Row 1: QWERTY / Top Thai row
  [
    {
      code: 'Tab',
      en: '',
      enShift: '',
      th: '',
      thShift: '',
      finger: 'L-pinky',
      width: 1.45,
      isModifier: true,
      label: 'TAB',
    },
    { code: 'KeyQ', en: 'q', enShift: 'Q', th: 'ๆ', thShift: '๐', finger: 'L-pinky' },
    { code: 'KeyW', en: 'w', enShift: 'W', th: 'ไ', thShift: '"', finger: 'L-ring' },
    { code: 'KeyE', en: 'e', enShift: 'E', th: 'ำ', thShift: 'ฎ', finger: 'L-middle' },
    { code: 'KeyR', en: 'r', enShift: 'R', th: 'พ', thShift: 'ฑ', finger: 'L-index' },
    { code: 'KeyT', en: 't', enShift: 'T', th: 'ะ', thShift: 'ธ', finger: 'L-index' },
    { code: 'KeyY', en: 'y', enShift: 'Y', th: 'ั', thShift: 'ํ', finger: 'R-index' },
    { code: 'KeyU', en: 'u', enShift: 'U', th: 'ี', thShift: '๊', finger: 'R-index' },
    { code: 'KeyI', en: 'i', enShift: 'I', th: 'ร', thShift: 'ณ', finger: 'R-middle' },
    { code: 'KeyO', en: 'o', enShift: 'O', th: 'น', thShift: 'ฯ', finger: 'R-ring' },
    { code: 'KeyP', en: 'p', enShift: 'P', th: 'ย', thShift: 'ญ', finger: 'R-pinky' },
    { code: 'BracketLeft', en: '[', enShift: '{', th: 'บ', thShift: 'ฐ', finger: 'R-pinky' },
    { code: 'BracketRight', en: ']', enShift: '}', th: 'ล', thShift: ',', finger: 'R-pinky' },
    {
      code: 'Backslash',
      en: '\\',
      enShift: '|',
      th: 'ฃ',
      thShift: 'ฅ',
      finger: 'R-pinky',
      width: 1.45,
    },
  ],
  // Row 2: Home row
  [
    {
      code: 'CapsLock',
      en: '',
      enShift: '',
      th: '',
      thShift: '',
      finger: 'L-pinky',
      width: 1.75,
      isModifier: true,
      label: 'CAPS',
    },
    { code: 'KeyA', en: 'a', enShift: 'A', th: 'ฟ', thShift: 'ฤ', finger: 'L-pinky' },
    { code: 'KeyS', en: 's', enShift: 'S', th: 'ห', thShift: 'ฆ', finger: 'L-ring' },
    { code: 'KeyD', en: 'd', enShift: 'D', th: 'ก', thShift: 'ฏ', finger: 'L-middle' },
    {
      code: 'KeyF',
      en: 'f',
      enShift: 'F',
      th: 'ด',
      thShift: 'โ',
      finger: 'L-index',
      homeBump: true,
    },
    { code: 'KeyG', en: 'g', enShift: 'G', th: 'เ', thShift: 'ฌ', finger: 'L-index' },
    { code: 'KeyH', en: 'h', enShift: 'H', th: '้', thShift: '็', finger: 'R-index' },
    {
      code: 'KeyJ',
      en: 'j',
      enShift: 'J',
      th: '่',
      thShift: '๋',
      finger: 'R-index',
      homeBump: true,
    },
    { code: 'KeyK', en: 'k', enShift: 'K', th: 'า', thShift: 'ษ', finger: 'R-middle' },
    { code: 'KeyL', en: 'l', enShift: 'L', th: 'ส', thShift: 'ศ', finger: 'R-ring' },
    { code: 'Semicolon', en: ';', enShift: ':', th: 'ว', thShift: 'ซ', finger: 'R-pinky' },
    { code: 'Quote', en: "'", enShift: '"', th: 'ง', thShift: '.', finger: 'R-pinky' },
    {
      code: 'Enter',
      en: '\n',
      enShift: '\n',
      th: '\n',
      thShift: '\n',
      finger: 'R-pinky',
      width: 2.15,
      isModifier: true,
      label: 'ENTER ↵',
    },
  ],
  // Row 3: Bottom row
  [
    {
      code: 'ShiftLeft',
      en: '',
      enShift: '',
      th: '',
      thShift: '',
      finger: 'L-pinky',
      width: 2.25,
      isModifier: true,
      label: 'SHIFT ⇧',
    },
    { code: 'KeyZ', en: 'z', enShift: 'Z', th: 'ผ', thShift: '(', finger: 'L-pinky' },
    { code: 'KeyX', en: 'x', enShift: 'X', th: 'ป', thShift: ')', finger: 'L-ring' },
    { code: 'KeyC', en: 'c', enShift: 'C', th: 'แ', thShift: 'ฉ', finger: 'L-middle' },
    { code: 'KeyV', en: 'v', enShift: 'V', th: 'อ', thShift: 'ฮ', finger: 'L-index' },
    { code: 'KeyB', en: 'b', enShift: 'B', th: 'ิ', thShift: 'ฺ', finger: 'L-index' },
    { code: 'KeyN', en: 'n', enShift: 'N', th: 'ื', thShift: '์', finger: 'R-index' },
    { code: 'KeyM', en: 'm', enShift: 'M', th: 'ท', thShift: '?', finger: 'R-index' },
    { code: 'Comma', en: ',', enShift: '<', th: 'ม', thShift: 'ฒ', finger: 'R-middle' },
    { code: 'Period', en: '.', enShift: '>', th: 'ใ', thShift: 'ฬ', finger: 'R-ring' },
    { code: 'Slash', en: '/', enShift: '?', th: 'ฝ', thShift: 'ฦ', finger: 'R-pinky' },
    {
      code: 'ShiftRight',
      en: '',
      enShift: '',
      th: '',
      thShift: '',
      finger: 'R-pinky',
      width: 2.65,
      isModifier: true,
      label: '⇧ SHIFT',
    },
  ],
  // Row 4: Spacebar
  [
    {
      code: 'Space',
      en: ' ',
      enShift: ' ',
      th: ' ',
      thShift: ' ',
      finger: 'thumb',
      width: 7.4,
      label: 'SPACEBAR',
    },
  ],
];

export interface KeyLookupResult {
  keyDef: KeyDef;
  needsShift: boolean;
  recommendedShift: 'ShiftLeft' | 'ShiftRight' | null;
}

const flatKeys: KeyDef[] = KEYBOARD_ROWS.flat();
const byCode = new Map<string, KeyDef>(flatKeys.map((k) => [k.code, k]));

export function getKeyDefByCode(code: string): KeyDef | undefined {
  return byCode.get(code);
}

/**
 * Find which physical key (and whether Shift is needed) produces a given character in the target language.
 */
export function lookupKeyForChar(char: string, lang: Language): KeyLookupResult | null {
  if (!char) return null;
  if (char === ' ') {
    const space = byCode.get('Space')!;
    return { keyDef: space, needsShift: false, recommendedShift: null };
  }

  for (const k of flatKeys) {
    if (k.isModifier) continue;
    const normal = lang === 'th' ? k.th : k.en;
    const shifted = lang === 'th' ? k.thShift : k.enShift;
    if (char === normal) {
      return { keyDef: k, needsShift: false, recommendedShift: null };
    }
    if (char === shifted) {
      const isLeftHand = k.finger.startsWith('L-');
      return {
        keyDef: k,
        needsShift: true,
        recommendedShift: isLeftHand ? 'ShiftRight' : 'ShiftLeft',
      };
    }
  }

  // Fallback cross-language lookup (e.g. English digit or punctuation inside Thai text)
  const fallbackLang: Language = lang === 'th' ? 'en' : 'th';
  for (const k of flatKeys) {
    if (k.isModifier) continue;
    const normal = fallbackLang === 'th' ? k.th : k.en;
    const shifted = fallbackLang === 'th' ? k.thShift : k.enShift;
    if (char === normal) {
      return { keyDef: k, needsShift: false, recommendedShift: null };
    }
    if (char === shifted) {
      const isLeftHand = k.finger.startsWith('L-');
      return {
        keyDef: k,
        needsShift: true,
        recommendedShift: isLeftHand ? 'ShiftRight' : 'ShiftLeft',
      };
    }
  }

  return null;
}

/**
 * Map a physical KeyboardEvent.code + shiftKey directly to a character in the desired language.
 * Powers the "Auto-Layout Mode" so users can type Thai/English immediately without switching OS IME.
 */
export function mapPhysicalKeyToChar(
  code: string,
  shiftKey: boolean,
  lang: Language
): string | null {
  if (code === 'Space') return ' ';
  const def = byCode.get(code);
  if (!def || def.isModifier) return null;
  if (lang === 'th') {
    return shiftKey ? def.thShift : def.th;
  }
  return shiftKey ? def.enShift : def.en;
}

/**
 * Detect if a character typed by the user looks like the opposite keyboard layout
 * for the expected character (e.g. user pressed physical KeyD expecting 'ก' but OS sent 'd').
 */
export function isWrongKeyboardLayout(
  typedChar: string,
  expectedChar: string,
  targetLang: Language
): boolean {
  if (!typedChar || !expectedChar || typedChar === expectedChar) return false;
  const expected = lookupKeyForChar(expectedChar, targetLang);
  if (!expected) return false;
  const otherLang: Language = targetLang === 'th' ? 'en' : 'th';
  const otherNormal = otherLang === 'th' ? expected.keyDef.th : expected.keyDef.en;
  const otherShift = otherLang === 'th' ? expected.keyDef.thShift : expected.keyDef.enShift;
  return typedChar === otherNormal || typedChar === otherShift;
}

/**
 * Friendly display name for Thai combining marks so players immediately see what mark is next!
 */
export const THAI_COMBINING_NAMES: Record<string, string> = {
  'ั': 'ไม้หันอากาศ',
  'ิ': 'สระอิ',
  'ี': 'สระอี',
  'ึ': 'สระอึ',
  'ื': 'สระอือ',
  'ุ': 'สระอุ',
  'ู': 'สระอู',
  '่': 'ไม้เอก',
  '้': 'ไม้โท',
  '๊': 'ไม้ตรี',
  '๋': 'ไม้จัตวา',
  '็': 'ไม้ไต่คู้',
  '์': 'การันต์',
  'ํ': 'นิคหิต',
  'ฺ': 'พินทุ',
};

export function isThaiCombiningMark(ch: string): boolean {
  return Boolean(THAI_COMBINING_NAMES[ch]);
}
