import type { CaseDossier, Language } from '../types/game';

/**
 * Clean and normalize passage text so every character is accurately typable
 * on standard Thai Kedmanee & English US QWERTY keyboards.
 * Removes invisible zero-width spaces (common in Thai Wikipedia/web copy!).
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

export interface GraphemeCluster {
  cluster: string;
  startIndex: number; // code-unit index inside normalized line
  endIndex: number;   // exclusive code-unit index
  chars: string[];    // individual keystroke code points in typing order
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

  if (typeof IntlAny.Segmenter === 'function') {
    const seg = new IntlAny.Segmenter(lang === 'th' ? 'th' : 'en', {
      granularity: 'grapheme',
    });
    for (const part of seg.segment(text)) {
      const chars = Array.from(part.segment);
      clusters.push({
        cluster: part.segment,
        startIndex: part.index,
        endIndex: part.index + part.segment.length,
        chars,
      });
    }
    return clusters;
  }

  // Fallback for environments without Intl.Segmenter
  let idx = 0;
  for (const ch of Array.from(text)) {
    clusters.push({
      cluster: ch,
      startIndex: idx,
      endIndex: idx + ch.length,
      chars: [ch],
    });
    idx += ch.length;
  }
  return clusters;
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
      text: normalizeTypableText(text),
      translationTh:
        lang === 'en'
          ? 'แบบฝึกหัดเฉพาะจุดสำหรับปุ่มที่ผิดพลาดบ่อย เพื่อสร้างความจำของกล้ามเนื้อให้แม่นยำ'
          : undefined,
    })),
  };
}
