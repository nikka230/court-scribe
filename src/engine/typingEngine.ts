import type { CaseDossier, Language } from '../types/game';

const ARABIC_TO_THAI_DIGITS: Record<string, string> = {
  '0': '๐',
  '1': '๑',
  '2': '๒',
  '3': '๓',
  '4': '๔',
  '5': '๕',
  '6': '๖',
  '7': '๗',
  '8': '๘',
  '9': '๙',
};

/**
 * Clean and normalize passage text so every character is accurately typable
 * on standard Thai Kedmanee & English US QWERTY keyboards.
 */
export function normalizeTypableText(raw: string): string {
  return raw
    .normalize('NFC')
    .replace(/[\u200B-\u200D\uFEFF\u00AD]/g, '') // Strip zero-width & soft hyphens
    .replace(/[\u00A0\u2000-\u200A\u202F\u205F]/g, ' ') // Non-breaking spaces -> regular space
    .replace(/[‘’`´]/g, "'")
    .replace(/[“”„‟]/g, '"')
    .replace(/[—–―]/g, '-')
    .replace(/…/g, '...')
    .replace(/\r?\n+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Strictly sanitize text for the target keyboard language so players NEVER get stuck
 * on untypable foreign scripts (e.g. Chinese 蔡, Greek β, Latin inside Thai Wiki, or ü in EN Wiki)!
 */
export function sanitizeTextForLanguage(raw: string, lang: Language): string {
  let text = normalizeTypableText(raw)
    .replace(/\[\d+\]/g, '')
    .replace(/\[citation needed\]/gi, '')
    .replace(/\[ต้องการอ้างอิง\]/g, '');

  if (lang === 'th') {
    // 1. Remove parenthetical blocks containing ANY non-Thai letters (e.g. "(จีน: 蔡)", "(อังกฤษ: Supreme Court)", IPA)
    text = text.replace(/\([^()]*[^\u0E00-\u0E7F\s\d.,\-/"?+_%][^()]*\)/g, ' ');
    text = text.replace(/（[^（）]*）/g, ' ');

    // 2. Remove standalone foreign words/tokens containing Latin, CJK, Japanese, Korean, Cyrillic, Arabic, Greek, etc.
    text = text.replace(/\S*[A-Za-z\u00C0-\u024F\u0370-\u03FF\u0400-\u04FF\u0600-\u06FF\u3040-\u30FF\u3400-\u9FFF\uAC00-\uD7AF]\S*/g, ' ');

    // 3. Convert Arabic numerals 0-9 into Thai numerals ๐-๙ (100% typable on Thai Kedmanee Shift+Number row)
    text = text.replace(/[0-9]/g, (d) => ARABIC_TO_THAI_DIGITS[d] || d);

    // 4. Keep ONLY characters physically typable on Thai Kedmanee (Thai script + Thai digits + Kedmanee punctuation)
    text = text.replace(/[^\u0E01-\u0E3A\u0E40-\u0E4E\u0E50-\u0E59\u0E3F \-\.,()"?/]/g, ' ');

    // 5. Clean up empty parentheses, stray quotes/punctuation, and collapse whitespace
    text = text
      .replace(/\(\s*[,.\-/ ]*\s*\)/g, ' ')
      .replace(/\s+([,.)?])/g, '$1')
      .replace(/(\()\s+/g, '$1')
      .replace(/["]{2,}/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim();

    return text;
  }

  // English mode: strip foreign parentheticals, normalize Latin diacritics (ü -> u, é -> e), replace common Greek
  text = text.replace(/\([^()]*[\u0E00-\u0E7F\u0400-\u04FF\u0600-\u06FF\u3040-\u30FF\u3400-\u9FFF\uAC00-\uD7AF][^()]*\)/g, ' ');
  text = text
    .replace(/α/g, 'a')
    .replace(/β/g, 'B')
    .replace(/γ/g, 'g')
    .replace(/δ/g, 'd')
    .replace(/μ/g, 'u')
    .replace(/π/g, 'pi')
    .replace(/×/g, 'x')
    .replace(/±/g, '+/-');

  // Fold accented Latin letters (Müllerian -> Mullerian, café -> cafe)
  text = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').normalize('NFC');

  // Strip any remaining non-ASCII untypable glyphs
  text = text.replace(/[^\x20-\x7E]/g, ' ');

  return text
    .replace(/\(\s*[,.\-/ ]*\s*\)/g, ' ')
    .replace(/\s+([,.)!?;:])/g, '$1')
    .replace(/(\()\s+/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export interface GraphemeCluster {
  cluster: string;
  startIndex: number;
  endIndex: number;
  chars: string[];
  cpStart: number;
  cpEnd: number;
}

/**
 * Splits a normalized string into visual grapheme clusters using Intl.Segmenter
 * so Thai combining marks (สระบน/ล่าง วรรณยุกต์) NEVER break visually into floating
 * dotted circles while still allowing exact 1-to-1 keystroke progression!
 */
export function segmentLineIntoClusters(text: string, lang: Language): GraphemeCluster[] {
  const clusters: GraphemeCluster[] = [];
  if (!text) return clusters;

  const IntlAny = Intl as unknown as {
    Segmenter?: new (
      locale: string,
      opts: { granularity: 'grapheme' }
    ) => { segment: (s: string) => Iterable<{ segment: string; index: number }> };
  };

  let cpCursor = 0;
  if (typeof IntlAny.Segmenter === 'function') {
    const seg = new IntlAny.Segmenter(lang === 'th' ? 'th' : 'en', {
      granularity: 'grapheme',
    });
    for (const part of seg.segment(text)) {
      const chars = Array.from(part.segment);
      const cpStart = cpCursor;
      const cpEnd = cpCursor + chars.length;
      cpCursor = cpEnd;
      clusters.push({
        cluster: part.segment,
        startIndex: part.index,
        endIndex: part.index + part.segment.length,
        chars,
        cpStart,
        cpEnd,
      });
    }
    return clusters;
  }

  let idx = 0;
  for (const ch of Array.from(text)) {
    const cpStart = cpCursor;
    const cpEnd = cpCursor + 1;
    cpCursor = cpEnd;
    clusters.push({
      cluster: ch,
      startIndex: idx,
      endIndex: idx + ch.length,
      chars: [ch],
      cpStart,
      cpEnd,
    });
    idx += ch.length;
  }
  return clusters;
}

export interface WordToken {
  text: string;
  isSpace: boolean;
  clusters: GraphemeCluster[];
  cpStart: number;
  cpEnd: number;
}

export interface LockedVisualLayout {
  rows: WordToken[][];
  seamSpaceIndices: Set<number>;
}

/**
 * Segment text into atomic, indivisible word tokens (keeping attached punctuation like "(MIF)," glued
 * to the word so neither Thai words nor English words EVER break in half across lines).
 */
export function tokenizeIntoAtomicWords(text: string, lang: Language): WordToken[] {
  const clusters = segmentLineIntoClusters(text, lang);
  if (clusters.length === 0) return [];

  const IntlAny = Intl as unknown as {
    Segmenter?: new (
      locale: string,
      opts: { granularity: 'word' }
    ) => { segment: (s: string) => Iterable<{ segment: string; index: number; isWordLike?: boolean }> };
  };

  // Step 1: Collect raw word segments
  const rawSegments: Array<{ start: number; end: number; text: string; isSpace: boolean }> = [];
  if (lang === 'en') {
    // For English, split strictly on spaces so "(MIF),", "Anti-Mullerian", "don't" remain 100% intact atomic words!
    const re = /(\s+|\S+)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      rawSegments.push({
        start: m.index,
        end: m.index + m[0].length,
        text: m[0],
        isSpace: /^\s+$/.test(m[0]),
      });
    }
  } else if (typeof IntlAny.Segmenter === 'function') {
    const seg = new IntlAny.Segmenter('th', { granularity: 'word' });
    for (const part of seg.segment(text)) {
      const isSpace = /^\s+$/.test(part.segment);
      rawSegments.push({
        start: part.index,
        end: part.index + part.segment.length,
        text: part.segment,
        isSpace,
      });
    }
  } else {
    const re = /(\s+|\S+)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      rawSegments.push({
        start: m.index,
        end: m.index + m[0].length,
        text: m[0],
        isSpace: /^\s+$/.test(m[0]),
      });
    }
  }

  // Step 2: Glue leading opening brackets/quotes to next word and trailing closing punctuation to previous word
  const merged: Array<{ start: number; end: number; text: string; isSpace: boolean }> = [];
  for (const seg of rawSegments) {
    if (seg.isSpace) {
      merged.push(seg);
      continue;
    }
    const prev = merged[merged.length - 1];
    const isTrailingPunct = /^[.,)!?;:'"ๆฯ]+$/.test(seg.text);
    const prevIsOpeningPunct = prev && !prev.isSpace && /^[("'-]+$/.test(prev.text);

    if (prev && !prev.isSpace && (isTrailingPunct || prevIsOpeningPunct)) {
      prev.end = seg.end;
      prev.text += seg.text;
    } else {
      merged.push({ ...seg });
    }
  }

  // Step 3: Map grapheme clusters into each atomic token
  const tokens: WordToken[] = [];
  let cIdx = 0;
  for (const seg of merged) {
    const segClusters: GraphemeCluster[] = [];
    while (cIdx < clusters.length && clusters[cIdx].startIndex < seg.end) {
      segClusters.push(clusters[cIdx]);
      cIdx += 1;
    }
    if (segClusters.length === 0) continue;
    tokens.push({
      text: seg.text,
      isSpace: seg.isSpace,
      clusters: segClusters,
      cpStart: segClusters[0].cpStart,
      cpEnd: segClusters[segClusters.length - 1].cpEnd,
    });
  }

  return tokens;
}

let measureCanvasCtx: CanvasRenderingContext2D | null = null;
function measureTextPx(str: string, fontCss: string): number {
  if (typeof document === 'undefined') return str.length * 14;
  if (!measureCanvasCtx) {
    const c = document.createElement('canvas');
    measureCanvasCtx = c.getContext('2d');
  }
  if (!measureCanvasCtx) return str.length * 14;
  measureCanvasCtx.font = fontCss;
  return measureCanvasCtx.measureText(str).width;
}

/**
 * Packs atomic word tokens into LOCKED visual rows that fit the container width cleanly:
 * - No word is EVER broken in half across rows (whole word moves to the next row).
 * - Neither the first nor the last token of ANY row is EVER a spacebar!
 * - Any space sitting at a row seam is returned in `seamSpaceIndices` so the typing engine
 *   auto-bridges cleanly from the last letter of Row N straight to the first letter of Row N+1.
 */
export function buildLockedVisualRows(
  text: string,
  lang: Language,
  maxWidthPx: number,
  fontCss: string
): LockedVisualLayout {
  const tokens = tokenizeIntoAtomicWords(text, lang);
  const seamSpaceIndices = new Set<number>();

  if (tokens.length === 0) {
    return { rows: [], seamSpaceIndices };
  }

  // Reserve a comfortable horizontal buffer so active/red highlight padding never triggers browser reflow
  const budget = Math.max(220, maxWidthPx - 28);
  const rows: WordToken[][] = [];
  let currentRow: WordToken[] = [];
  let currentWidth = 0;
  let pendingSpace: WordToken | null = null;

  for (const tok of tokens) {
    if (tok.isSpace) {
      // Never put a space at the very beginning of a row!
      if (currentRow.length > 0) {
        pendingSpace = tok;
      } else {
        for (let i = tok.cpStart; i < tok.cpEnd; i++) seamSpaceIndices.add(i);
      }
      continue;
    }

    const spaceWidth = pendingSpace ? measureTextPx(pendingSpace.text, fontCss) + 2 : 0;
    const wordWidth = measureTextPx(tok.text, fontCss) + 4;

    if (currentRow.length > 0 && currentWidth + spaceWidth + wordWidth > budget) {
      // Drop the ENTIRE word onto a fresh visual row!
      // Elide the seam space so NEITHER the end of the previous row NOR the start of the new row is a spacebar!
      if (pendingSpace) {
        for (let i = pendingSpace.cpStart; i < pendingSpace.cpEnd; i++) {
          seamSpaceIndices.add(i);
        }
        pendingSpace = null;
      }
      rows.push(currentRow);
      currentRow = [tok];
      currentWidth = wordWidth;
    } else {
      if (pendingSpace) {
        currentRow.push(pendingSpace);
        currentWidth += spaceWidth;
        pendingSpace = null;
      }
      currentRow.push(tok);
      currentWidth += wordWidth;
    }
  }

  // Trailing space at the very end of the final row is also elided
  if (pendingSpace) {
    for (let i = pendingSpace.cpStart; i < pendingSpace.cpEnd; i++) {
      seamSpaceIndices.add(i);
    }
  }

  if (currentRow.length > 0) {
    rows.push(currentRow);
  }

  return { rows, seamSpaceIndices };
}

/**
 * Flatten a string into individual keystroke characters (preserving exact code-point indices).
 */
export function getTypingChars(text: string): string[] {
  return Array.from(text);
}

/**
 * Calculate WPM & CPM cleanly.
 * Standard typing benchmark: 1 word = 5 characters (both EN & TH standard typing speed).
 */
export function computeSpeedMetrics(
  correctChars: number,
  totalAttempts: number,
  elapsedSec: number
): { wpm: number; rawWpm: number; cpm: number; accuracy: number } {
  const safeMinutes = Math.max(elapsedSec / 60, 1 / 60);
  const wpm = elapsedSec < 0.8 ? 0 : Math.round(correctChars / 5 / safeMinutes);
  const rawWpm = elapsedSec < 0.8 ? 0 : Math.round(totalAttempts / 5 / safeMinutes);
  const cpm = elapsedSec < 0.8 ? 0 : Math.round(correctChars / safeMinutes);
  const accuracy =
    totalAttempts === 0 ? 100 : Math.max(0, Math.min(100, Math.round((correctChars / totalAttempts) * 100)));
  return { wpm, rawWpm, cpm, accuracy };
}

export function computeVerdictGrade(wpm: number, accuracy: number, lang: Language): 'S' | 'A' | 'B' | 'C' {
  const sThreshold = lang === 'th' ? 42 : 52;
  const aThreshold = lang === 'th' ? 30 : 38;
  const bThreshold = lang === 'th' ? 18 : 24;

  if (wpm >= sThreshold && accuracy >= 96) return 'S';
  if (wpm >= aThreshold && accuracy >= 92) return 'A';
  if (wpm >= bThreshold && accuracy >= 84) return 'B';
  return 'C';
}

/**
 * Dynamically generate a targeted touch-typing practice drill based on a player's weakest keys!
 */
export function buildTargetedWeakKeyDrill(weakChars: string[], lang: Language): CaseDossier {
  const unique = Array.from(new Set(weakChars.filter((c) => c.trim().length > 0))).slice(0, 6);
  const fallback = lang === 'th' ? ['ก', 'ด', 'เ', '่', 'า', 'ส'] : ['e', 'r', 't', 'i', 'o', 's'];
  const targets = unique.length > 0 ? unique : fallback;

  const linesText: string[] = [];
  if (lang === 'th') {
    const safePairs = targets.map((ch) => {
      if (/[ัิีึืุู่้๊๋็์]/.test(ch)) {
        return `ก${ch}า ด${ch}า ต${ch}า ป${ch}า ม${ch}า`;
      }
      return `${ch}า ${ch}ี ${ch}ู ${ch}ะ เ${ch}า แ${ch}ง`;
    });
    linesText.push(safePairs.slice(0, 3).join(' '));
    if (safePairs.length > 3) {
      linesText.push(safePairs.slice(3).join(' '));
    }
    linesText.push(
      `ฝึกซ้ำอย่างใจเย็นเพื่อสร้างความแม่นยำในปุ่ม ${targets.join(' ')} ให้คล่องแคล่วทุกนิ้ว`
    );
  } else {
    const enWordBank = [
      'verdict', 'justice', 'evidence', 'witness', 'clarity', 'precision', 'rhythm',
      'practice', 'chamber', 'record', 'accurate', 'truth', 'context', 'silent',
      'document', 'verify', 'confirm', 'observe', 'order', 'court', 'judge',
      'prosecutor', 'defense', 'alibi', 'ledger', 'timeline', 'integrity', 'fluent',
      'curious', 'knowledge', 'archive', 'memory', 'focus', 'steady', 'swift',
    ];
    const matched = enWordBank.filter((w) =>
      targets.some((ch) => w.toLowerCase().includes(ch.toLowerCase()))
    );
    const chosen = (matched.length >= 10 ? matched : [...matched, ...enWordBank]).slice(0, 18);
    linesText.push(chosen.slice(0, 9).join(' '));
    linesText.push(chosen.slice(9, 18).join(' '));
    linesText.push(
      `Focus smoothly on keys (${targets.join(', ')}) until every strike feels effortless and accurate.`
    );
  }

  return {
    id: `targeted-drill-${Date.now()}`,
    caseCode: 'REMEDIAL DRILL',
    title:
      lang === 'th'
        ? `แบบฝึกหัดซ่อมจุดอ่อนเฉพาะปุ่ม (${targets.join(' ')})`
        : `Targeted Precision Drill (${targets.join(', ')})`,
    subtitle: 'สร้างขึ้นอัตโนมัติจากสถิติปุ่มที่พิมพ์พลาดบ่อยที่สุดของคุณ',
    language: lang,
    sourceKind: 'drill',
    difficulty: 'senior',
    category: 'ซ่อมจุดอ่อนเฉพาะบุคคล',
    lines: linesText.map((text, i) => ({
      id: `td-${i}`,
      speaker: 'judge',
      speakerName: lang === 'th' ? 'ครูฝึกศาลฎีกา' : 'Chief Typing Instructor',
      text: sanitizeTextForLanguage(text, lang),
      translationTh:
        lang === 'en'
          ? 'แบบฝึกหัดเฉพาะจุดสำหรับปุ่มที่ผิดพลาดบ่อย เพื่อสร้างความจำของกล้ามเนื้อให้แม่นยำ'
          : undefined,
    })),
  };
}
