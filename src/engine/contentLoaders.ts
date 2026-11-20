import type { CaseDossier, Language, PassageLine, SpeakerRole } from '../types/game';
import { normalizeTypableText } from './typingEngine';

export interface WikiSearchItem {
  title: string;
  snippet: string;
  pageid: number;
}

/**
 * Split a long plain-text article into comfortable courtroom transcript lines (~90-175 chars).
 */
export function splitIntoTranscriptLines(
  rawText: string,
  lang: Language,
  maxLines = 10,
  speakerName?: string
): PassageLine[] {
  const cleaned = rawText
    .replace(/\[\d+\]/g, '') // Remove Wikipedia footnote markers [1]
    .replace(/\[citation needed\]/gi, '')
    .replace(/\[ต้องการอ้างอิง\]/g, '')
    .replace(/\(\s*\)/g, '')
    .trim();

  const rawParagraphs = cleaned
    .split(/\n+/)
    .map((p) => normalizeTypableText(p))
    .filter((p) => p.length > 18);

  const sentences: string[] = [];

  for (const para of rawParagraphs) {
    if (lang === 'en') {
      // Split on sentence boundaries
      const parts = para.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g) || [para];
      let buf = '';
      for (const part of parts) {
        const p = part.trim();
        if (!p) continue;
        if (buf.length > 0 && buf.length + p.length > 165) {
          sentences.push(buf.trim());
          buf = p;
        } else {
          buf = buf ? `${buf} ${p}` : p;
        }
      }
      if (buf.trim()) sentences.push(buf.trim());
    } else {
      // Thai: split cleanly by spaces / clause boundaries to keep ~95-145 chars per line
      if (para.length <= 145) {
        sentences.push(para);
      } else {
        const tokens = para.split(' ');
        let buf = '';
        for (const tok of tokens) {
          if (!tok) continue;
          if (buf.length > 0 && buf.length + tok.length > 130) {
            sentences.push(buf.trim());
            buf = tok;
          } else {
            buf = buf ? `${buf} ${tok}` : tok;
          }
        }
        if (buf.trim()) sentences.push(buf.trim());
      }
    }
    if (sentences.length >= maxLines * 2) break;
  }

  const finalLines = sentences
    .map((s) => normalizeTypableText(s))
    .filter((s) => s.length >= 12)
    .slice(0, maxLines);

  const roles: SpeakerRole[] = ['witness', 'defense', 'prosecutor', 'judge'];
  return finalLines.map((text, idx) => ({
    id: `line-${Date.now()}-${idx}`,
    text,
    speaker: roles[idx % roles.length],
    speakerName:
      speakerName ||
      (lang === 'th' ? `บันทึกพยานช่วงที่ ${idx + 1}` : `Record Segment #${idx + 1}`),
  }));
}

/**
 * Parse a Wikipedia URL (EN or TH or any language) and extract language + decoded title.
 */
export function parseWikipediaUrl(input: string): { lang: Language; title: string } | null {
  const trimmed = input.trim();
  const match = trimmed.match(/https?:\/\/([a-z]{2,3})\.(?:m\.)?wikipedia\.org\/wiki\/([^#?]+)/i);
  if (!match) return null;
  const wikiLang = match[1].toLowerCase() === 'th' ? 'th' : 'en';
  const title = decodeURIComponent(match[2]).replace(/_/g, ' ');
  return { lang: wikiLang, title };
}

/**
 * Search Wikipedia directly from the browser (CORS-enabled via origin=*).
 */
export async function searchWikipedia(query: string, lang: Language): Promise<WikiSearchItem[]> {
  if (!query.trim()) return [];
  const endpoint = `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
    query.trim()
  )}&srlimit=6&format=json&origin=*`;

  const res = await fetch(endpoint);
  if (!res.ok) throw new Error('ไม่สามารถเชื่อมต่อ Wikipedia ได้ในขณะนี้');
  const data = await res.json();
  const list = data?.query?.search || [];
  return list.map((item: { title: string; snippet: string; pageid: number }) => ({
    title: item.title,
    snippet: item.snippet.replace(/<[^>]+>/g, ''),
    pageid: item.pageid,
  }));
}

/**
 * Load a specific Wikipedia article (by URL or title) into a playable CaseDossier!
 * 100% zero-backend using Wikimedia CORS API.
 */
export async function loadWikipediaCase(
  titleOrUrl: string,
  preferredLang: Language,
  lineCount = 6
): Promise<CaseDossier> {
  const parsed = parseWikipediaUrl(titleOrUrl);
  const lang = parsed ? parsed.lang : preferredLang;
  const title = parsed ? parsed.title : titleOrUrl.trim();

  if (!title) {
    throw new Error('กรุณากรอกลิงก์หรือชื่อบทความ Wikipedia');
  }

  const endpoint = `https://${lang}.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=1&exsectionformat=plain&redirects=1&titles=${encodeURIComponent(
    title
  )}&format=json&origin=*`;

  const res = await fetch(endpoint);
  if (!res.ok) throw new Error('ไม่สามารถดึงข้อมูลจาก Wikipedia ได้');
  const data = await res.json();
  const pages = data?.query?.pages || {};
  const firstPage = Object.values(pages)[0] as
    | { title?: string; extract?: string; missing?: string; pageid?: number }
    | undefined;

  if (!firstPage || firstPage.missing !== undefined || !firstPage.extract) {
    throw new Error(`ไม่พบบทความ "${title}" บน Wikipedia (${lang.toUpperCase()})`);
  }

  const lines = splitIntoTranscriptLines(
    firstPage.extract,
    lang,
    lineCount,
    lang === 'th' ? 'คลังวิกิพีเดีย' : 'Wikipedia Record'
  );

  if (lines.length === 0) {
    throw new Error('บทความนี้สั้นเกินไปสำหรับนำมาฝึกพิมพ์ กรุณาลองบทความอื่น');
  }

  const resolvedTitle = firstPage.title || title;
  return {
    id: `wiki-${lang}-${firstPage.pageid || Date.now()}`,
    caseCode: `WIKI-${lang.toUpperCase()}`,
    title: resolvedTitle,
    subtitle:
      lang === 'th'
        ? 'นำเข้าสดจากวิกิพีเดียภาษาไทย (ไม่ต้องใช้เซิร์ฟเวอร์)'
        : 'Live English Wikipedia Dossier (with auto Thai translation & dictionary)',
    language: lang,
    sourceKind: 'wikipedia',
    difficulty: 'senior',
    category: `Wikipedia (${lang.toUpperCase()})`,
    sourceUrl: `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(resolvedTitle.replace(/ /g, '_'))}`,
    lines,
  };
}

/**
 * Fetch a genuine Random Wikipedia article in Thai or English (100% browser CORS).
 */
export async function loadRandomWikipediaCase(
  lang: Language,
  lineCount = 6
): Promise<CaseDossier> {
  // Fetch a batch of 6 random articles and pick the richest one so we never land on a tiny stub!
  const endpoint = `https://${lang}.wikipedia.org/w/api.php?action=query&generator=random&grnnamespace=0&grnlimit=6&prop=extracts&exintro=0&exchars=2200&explaintext=1&format=json&origin=*`;
  const res = await fetch(endpoint);
  if (!res.ok) throw new Error('ไม่สามารถสุ่มบทความจาก Wikipedia ได้ในขณะนี้');
  const data = await res.json();
  const pages = Object.values(data?.query?.pages || {}) as Array<{
    pageid: number;
    title: string;
    extract?: string;
  }>;

  const ranked = pages
    .filter((p) => p.extract && p.extract.trim().length > 180)
    .sort((a, b) => (b.extract?.length || 0) - (a.extract?.length || 0));

  const best = ranked[0];
  if (!best || !best.extract) {
    throw new Error('สุ่มพบบทความที่สั้นเกินไป กรุณากดสุ่มอีกครั้ง');
  }

  const lines = splitIntoTranscriptLines(
    best.extract,
    lang,
    lineCount,
    lang === 'th' ? 'บันทึกสุ่มวิกิพีเดีย' : 'Random Archive Witness'
  );

  return {
    id: `wiki-rand-${lang}-${best.pageid}-${Date.now()}`,
    caseCode: `RAND-${lang.toUpperCase()}`,
    title: best.title,
    subtitle:
      lang === 'th'
        ? 'สุ่มสดจากสารานุกรม Wikipedia ภาษาไทย'
        : 'Live Random English Wikipedia — Practice Typing, Reading & Translation',
    language: lang,
    sourceKind: 'random',
    difficulty: 'senior',
    category: `สุ่มวิกิพีเดีย (${lang.toUpperCase()})`,
    sourceUrl: `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(best.title.replace(/ /g, '_'))}`,
    lines,
  };
}

// =========================================================================
// YOUTUBE ZERO-BACKEND LOADER & TIMESTAMPED TRANSCRIPT PARSER
// =========================================================================

export function extractYouTubeId(input: string): string | null {
  const trimmed = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  const patterns = [
    /(?:youtube\.com\/watch\?.*v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pat of patterns) {
    const m = trimmed.match(pat);
    if (m) return m[1];
  }
  return null;
}

export interface YouTubeMetadata {
  videoId: string;
  title: string;
  author: string;
  thumbnailUrl: string;
}

export async function fetchYouTubeMetadata(videoId: string): Promise<YouTubeMetadata> {
  try {
    const res = await fetch(
      `https://noembed.com/embed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}`
    );
    if (res.ok) {
      const data = await res.json();
      if (data && data.title) {
        return {
          videoId,
          title: data.title,
          author: data.author_name || 'YouTube Channel',
          thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        };
      }
    }
  } catch {
    // fallback below
  }
  return {
    videoId,
    title: `YouTube Video (${videoId})`,
    author: 'YouTube',
    thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
  };
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(Number(num)));
}

function parseTimedTextXml(xml: string, lang: Language): PassageLine[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');
  const textNodes = Array.from(doc.querySelectorAll('text'));
  if (textNodes.length === 0) return [];

  // Merge short 2-second caption fragments into natural readable ~95-140 char sentences
  const lines: PassageLine[] = [];
  let buf = '';
  let segStart = 0;
  let segEnd = 0;

  for (const node of textNodes) {
    const start = parseFloat(node.getAttribute('start') || '0');
    const dur = parseFloat(node.getAttribute('dur') || '3');
    const content = normalizeTypableText(
      decodeHtmlEntities(node.textContent || '').replace(/\[[^\]]+\]/g, '')
    );
    if (!content) continue;

    if (!buf) {
      buf = content;
      segStart = start;
      segEnd = start + dur;
    } else if (buf.length + content.length <= 135 && start - segEnd < 4) {
      buf = lang === 'th' ? `${buf} ${content}` : `${buf} ${content}`;
      segEnd = start + dur;
    } else {
      lines.push({
        id: `yt-xml-${lines.length}`,
        speaker: 'witness',
        speakerName: `Witness Feed (${formatTimestamp(segStart)})`,
        startSec: Math.floor(segStart),
        endSec: Math.ceil(segEnd),
        text: normalizeTypableText(buf),
      });
      buf = content;
      segStart = start;
      segEnd = start + dur;
    }
  }
  if (buf.trim()) {
    lines.push({
      id: `yt-xml-${lines.length}`,
      speaker: 'witness',
      speakerName: `Witness Feed (${formatTimestamp(segStart)})`,
      startSec: Math.floor(segStart),
      endSec: Math.ceil(segEnd),
      text: normalizeTypableText(buf),
    });
  }
  return lines.slice(0, 30);
}

/**
 * Multi-tier zero-backend YouTube caption fetcher.
 * Attempts CORS-friendly public gateways with fast timeout; if YouTube rate-limits
 * public proxies, gracefully informs UI so the user can paste the transcript / drop .SRT/.VTT
 * while the embedded YouTube player is ALREADY live and ready!
 */
export async function tryAutoFetchYouTubeCaptions(
  videoId: string,
  lang: Language
): Promise<{ lines: PassageLine[]; detectedLang: Language } | null> {
  const langsToTry: Language[] = lang === 'th' ? ['th', 'en'] : ['en', 'th'];

  const fetchWithTimeout = async (url: string, timeoutMs = 4500) => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      return await fetch(url, { signal: ctrl.signal });
    } finally {
      clearTimeout(timer);
    }
  };

  for (const tryLang of langsToTry) {
    // Attempt 1: Public timedtext via AllOrigins CORS gateway
    const timedTextUrl = `https://video.google.com/timedtext?lang=${tryLang}&v=${videoId}`;
    const gateways = [
      `https://api.allorigins.win/raw?url=${encodeURIComponent(timedTextUrl)}`,
      `https://corsproxy.io/?${encodeURIComponent(timedTextUrl)}`,
    ];

    for (const url of gateways) {
      try {
        const res = await fetchWithTimeout(url, 4200);
        if (res.ok) {
          const xml = await res.text();
          if (xml.includes('<text')) {
            const lines = parseTimedTextXml(xml, tryLang);
            if (lines.length > 0) {
              return { lines, detectedLang: tryLang };
            }
          }
        }
      } catch {
        // try next gateway
      }
    }
  }

  return null;
}

export function formatTimestamp(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function parseTimestampToSec(ts: string): number {
  const clean = ts.trim().replace(',', '.');
  const parts = clean.split(':').map(Number);
  if (parts.some((n) => Number.isNaN(n))) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] || 0;
}

/**
 * Intelligent parser supporting:
 * 1) SRT subtitle files
 * 2) WebVTT (.vtt) files
 * 3) Direct copy-paste from YouTube's "Show transcript" panel (timestamps + text lines!)
 * 4) Plain text paragraphs
 */
export function parseSubtitleOrTranscript(
  rawText: string,
  lang: Language,
  speakerPrefix = 'Witness Feed'
): PassageLine[] {
  const normalizedRaw = rawText.replace(/\r\n/g, '\n').trim();
  if (!normalizedRaw) return [];

  // Case 1: SRT or VTT format (contains "-->")
  if (normalizedRaw.includes('-->')) {
    const blocks = normalizedRaw
      .replace(/^WEBVTT[^\n]*\n+/i, '')
      .split(/\n{2,}/);

    const rawCues: Array<{ startSec: number; endSec: number; text: string }> = [];
    for (const block of blocks) {
      const rows = block.split('\n').map((r) => r.trim()).filter(Boolean);
      const timeIdx = rows.findIndex((r) => r.includes('-->'));
      if (timeIdx === -1) continue;
      const [startStr, endStr] = rows[timeIdx].split('-->').map((s) => s.trim().split(' ')[0]);
      const body = rows
        .slice(timeIdx + 1)
        .join(' ')
        .replace(/<[^>]+>/g, '');
      const clean = normalizeTypableText(body);
      if (!clean) continue;
      rawCues.push({
        startSec: parseTimestampToSec(startStr),
        endSec: parseTimestampToSec(endStr),
        text: clean,
      });
    }

    if (rawCues.length > 0) {
      return mergeTimedCues(rawCues, speakerPrefix);
    }
  }

  // Case 2: YouTube "Show transcript" copy-paste format:
  // e.g.
  // 0:04
  // Hello everyone, welcome back
  // 0:09
  // Today we are examining...
  const linesArr = normalizedRaw.split('\n').map((l) => l.trim()).filter(Boolean);
  const tsRegex = /^(\d{1,2}:)?\d{1,2}:\d{2}$/;
  const hasYtTimestamps = linesArr.filter((l) => tsRegex.test(l)).length >= 2;

  if (hasYtTimestamps) {
    const rawCues: Array<{ startSec: number; endSec: number; text: string }> = [];
    let currentTs: number | null = null;
    let buf: string[] = [];

    const flush = (nextTs?: number) => {
      if (currentTs !== null && buf.length > 0) {
        const text = normalizeTypableText(buf.join(' '));
        if (text) {
          rawCues.push({
            startSec: currentTs,
            endSec: nextTs ?? currentTs + 5,
            text,
          });
        }
      }
      buf = [];
    };

    for (const line of linesArr) {
      if (tsRegex.test(line)) {
        const sec = parseTimestampToSec(line);
        flush(sec);
        currentTs = sec;
      } else {
        // Also handle inline "0:12 Some text here"
        const inline = line.match(/^((?:\d{1,2}:)?\d{1,2}:\d{2})\s+(.+)$/);
        if (inline) {
          const sec = parseTimestampToSec(inline[1]);
          flush(sec);
          currentTs = sec;
          buf.push(inline[2]);
        } else {
          buf.push(line);
        }
      }
    }
    flush();

    if (rawCues.length > 0) {
      return mergeTimedCues(rawCues, speakerPrefix);
    }
  }

  // Case 3: Plain text fallback
  return splitIntoTranscriptLines(normalizedRaw, lang, 24, speakerPrefix);
}

function mergeTimedCues(
  cues: Array<{ startSec: number; endSec: number; text: string }>,
  speakerPrefix: string
): PassageLine[] {
  const merged: PassageLine[] = [];
  let buf = '';
  let startSec = 0;
  let endSec = 0;

  for (const cue of cues) {
    if (!buf) {
      buf = cue.text;
      startSec = cue.startSec;
      endSec = cue.endSec;
    } else if (buf.length + cue.text.length <= 135 && cue.startSec - endSec < 5) {
      buf = `${buf} ${cue.text}`;
      endSec = cue.endSec;
    } else {
      merged.push({
        id: `cue-${merged.length}-${Date.now()}`,
        speaker: 'witness',
        speakerName: `${speakerPrefix} (${formatTimestamp(startSec)})`,
        startSec: Math.floor(startSec),
        endSec: Math.ceil(endSec),
        text: normalizeTypableText(buf),
      });
      buf = cue.text;
      startSec = cue.startSec;
      endSec = cue.endSec;
    }
  }
  if (buf.trim()) {
    merged.push({
      id: `cue-${merged.length}-${Date.now()}`,
      speaker: 'witness',
      speakerName: `${speakerPrefix} (${formatTimestamp(startSec)})`,
      startSec: Math.floor(startSec),
      endSec: Math.ceil(endSec),
      text: normalizeTypableText(buf),
    });
  }

  return merged.slice(0, 40);
}

/**
 * Simple automatic language heuristic (detects Thai script ratio).
 */
export function detectTextLanguage(text: string): Language {
  const thaiChars = (text.match(/[\u0E00-\u0E7F]/g) || []).length;
  const latinChars = (text.match(/[a-zA-Z]/g) || []).length;
  return thaiChars >= latinChars ? 'th' : 'en';
}
