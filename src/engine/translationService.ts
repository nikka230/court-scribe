import type { Language, VocabHint } from '../types/game';
import { lookupOfflineWord } from '../data/dictionary';

const TRANS_CACHE_KEY = 'court_scribe_trans_cache_v1';
const memCache = new Map<string, string>();
const wordCache = new Map<string, VocabHint>();

// Hydrate cache from localStorage safely
try {
  const raw = localStorage.getItem(TRANS_CACHE_KEY);
  if (raw) {
    const parsed = JSON.parse(raw) as Record<string, string>;
    Object.entries(parsed).forEach(([k, v]) => memCache.set(k, v));
  }
} catch {
  // ignore storage error
}

function saveCacheEntry(key: string, val: string) {
  memCache.set(key, val);
  try {
    const entries = Array.from(memCache.entries()).slice(-180);
    localStorage.setItem(TRANS_CACHE_KEY, JSON.stringify(Object.fromEntries(entries)));
  } catch {
    // ignore quota error
  }
}

/**
 * Zero-backend English -> Thai sentence/phrase translator.
 * Uses local cache -> Google GTX CORS endpoint -> MyMemory CORS API fallback.
 */
export async function translateEnToTh(text: string): Promise<string | null> {
  const clean = text.trim();
  if (!clean) return null;
  if (memCache.has(clean)) return memCache.get(clean)!;

  // Tier 1: Google Translate GTX endpoint (fast, accurate, CORS-friendly)
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5000);
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=th&dt=t&q=${encodeURIComponent(
      clean
    )}`;
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(t);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const translated = data[0]
          .map((seg: unknown[]) => (typeof seg[0] === 'string' ? seg[0] : ''))
          .join('')
          .trim();
        if (translated) {
          saveCacheEntry(clean, translated);
          return translated;
        }
      }
    }
  } catch {
    // fallback to MyMemory
  }

  // Tier 2: MyMemory public CORS translation API
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5000);
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
      clean.slice(0, 480)
    )}&langpair=en|th`;
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(t);
    if (res.ok) {
      const data = await res.json();
      const translated = data?.responseData?.translatedText;
      if (typeof translated === 'string' && translated.trim() && !translated.includes('MYMEMORY WARNING')) {
        saveCacheEntry(clean, translated.trim());
        return translated.trim();
      }
    }
  } catch {
    // offline
  }

  return null;
}

/**
 * Rich bilingual word lookup:
 * 1) Instant hit from built-in offline legal/academic dictionary
 * 2) Enriches with Free Dictionary API (IPA, definition, example) + Thai translation
 */
export async function lookupEnglishWord(rawWord: string): Promise<VocabHint> {
  const clean = rawWord
    .trim()
    .toLowerCase()
    .replace(/^[^a-z'-]+|[^a-z'-]+$/g, '');

  if (!clean) {
    return { word: rawWord, th: 'ไม่พบคำศัพท์' };
  }

  if (wordCache.has(clean)) {
    return wordCache.get(clean)!;
  }

  const offline = lookupOfflineWord(clean);
  if (offline) {
    const result = { ...offline, word: clean };
    wordCache.set(clean, result);
    return result;
  }

  // Online zero-backend enrichment (Free Dictionary API + EN->TH translation)
  let ipa: string | undefined;
  let pos: string | undefined;
  let definition: string | undefined;
  let example: string | undefined;

  const [dictRes, thRes] = await Promise.allSettled([
    fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(clean)}`).then((r) =>
      r.ok ? r.json() : null
    ),
    translateEnToTh(clean),
  ]);

  if (dictRes.status === 'fulfilled' && Array.isArray(dictRes.value) && dictRes.value[0]) {
    const entry = dictRes.value[0];
    ipa =
      entry.phonetic ||
      entry.phonetics?.find((p: { text?: string }) => p.text)?.text ||
      undefined;
    const firstMeaning = entry.meanings?.[0];
    pos = firstMeaning?.partOfSpeech;
    definition = firstMeaning?.definitions?.[0]?.definition;
    example = firstMeaning?.definitions?.[0]?.example;
  }

  const th =
    thRes.status === 'fulfilled' && thRes.value
      ? thRes.value
      : 'เชื่อมต่ออินเทอร์เน็ตเพื่อแปลคำนี้เพิ่มเติม';

  const result: VocabHint = {
    word: clean,
    ipa,
    pos,
    th,
    definition,
    example,
  };
  wordCache.set(clean, result);
  return result;
}

/**
 * Built-in Browser Speech Synthesis for English reading/listening practice & word pronunciation.
 */
export function speakText(text: string, lang: Language = 'en', rate = 0.95): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang === 'en' ? 'en-US' : 'th-TH';
    utter.rate = Math.min(1.4, Math.max(0.65, rate));

    const voices = window.speechSynthesis.getVoices();
    const targetPrefix = lang === 'en' ? 'en' : 'th';
    const preferred =
      voices.find((v) => v.lang.toLowerCase().startsWith(targetPrefix) && /natural|google|samantha|aria|premwadee/i.test(v.name)) ||
      voices.find((v) => v.lang.toLowerCase().startsWith(targetPrefix));
    if (preferred) utter.voice = preferred;

    window.speechSynthesis.speak(utter);
  } catch {
    // ignore speech synthesis restrictions
  }
}

export function stopSpeaking(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
