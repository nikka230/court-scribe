import type { CaseDossier, Language, PassageLine, SpeakerRole } from '../types/game';
import { sanitizeTextForLanguage } from './typingEngine';

export interface WikiSearchItem {
  title: string;
  snippet: string;
  pageid: number;
}

/**
 * Split a long plain-text article into comfortable courtroom transcript sentences (~85-155 chars),
 * strictly sanitized so ONLY characters typable on the target language keyboard remain!
 */
export function splitIntoTranscriptLines(
  rawText: string,
  lang: Language,
  maxLines = 10,
  speakerName?: string
): PassageLine[] {
  const rawParagraphs = rawText
    .replace(/\[\d+\]/g, '')
    .replace(/\[citation needed\]/gi, '')
    .replace(/\[ต้องการอ้างอิง\]/g, '')
    .split(/\n+/)
    .map((p) => sanitizeTextForLanguage(p, lang))
    .filter((p) => p.length > 18);

  const sentences: string[] = [];

  for (const para of rawParagraphs) {
    if (lang === 'en') {
      const parts = para.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g) || [para];
      let buf = '';
      for (const part of parts) {
        const p = part.trim();
        if (!p) continue;
        if (buf.length > 0 && buf.length + p.length > 155) {
          sentences.push(buf.trim());
          buf = p;
        } else {
          buf = buf ? `${buf} ${p}` : p;
        }
      }
      if (buf.trim()) sentences.push(buf.trim());
    } else {
      // Thai: split cleanly by spaces / clause boundaries to keep ~90-140 chars per line
      if (para.length <= 140) {
        sentences.push(para);
      } else {
        const tokens = para.split(' ');
        let buf = '';
        for (const tok of tokens) {
          if (!tok) continue;
          if (buf.length > 0 && buf.length + tok.length > 125) {
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
    .map((s) => sanitizeTextForLanguage(s, lang))
    .filter((s) => s.length >= 14)
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
 * 100% zero-backend using Wikimedia CORS API + strict language character sanitizer.
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
    throw new Error('บทความนี้ไม่มีเนื้อหาภาษาที่พิมพ์ได้เพียงพอ กรุณาลองบทความอื่น');
  }

  const resolvedTitle = firstPage.title || title;
  return {
    id: `wiki-${lang}-${firstPage.pageid || Date.now()}`,
    caseCode: `WIKI-${lang.toUpperCase()}`,
    title: resolvedTitle,
    subtitle:
      lang === 'th'
        ? 'นำเข้าสดจากวิกิพีเดียภาษาไทย (กรองเฉพาะอักษรไทยพิมพ์ได้ 100%)'
        : 'Live English Wikipedia Dossier (sanitized QWERTY + auto Thai translation)',
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
 * Fetches 12 candidates and ranks by clean sanitized length so Thai random Wiki ONLY contains
 * rich, fluent, 100% pure-Thai typable paragraphs (zero Chinese/English/foreign glyphs!).
 */
export async function loadRandomWikipediaCase(
  lang: Language,
  lineCount = 6
): Promise<CaseDossier> {
  const endpoint = `https://${lang}.wikipedia.org/w/api.php?action=query&generator=random&grnnamespace=0&grnlimit=12&prop=extracts&exintro=0&exchars=2600&explaintext=1&format=json&origin=*`;
  const res = await fetch(endpoint);
  if (!res.ok) throw new Error('ไม่สามารถสุ่มบทความจาก Wikipedia ได้ในขณะนี้');
  const data = await res.json();
  const pages = Object.values(data?.query?.pages || {}) as Array<{
    pageid: number;
    title: string;
    extract?: string;
  }>;

  const candidates = pages
    .filter((p) => p.extract && p.extract.trim().length > 220)
    .filter((p) => {
      // Skip disambiguation/list stubs
      if (lang === 'th' && /อาจหมายถึง|รายชื่อ|แก้ความกำกวม/.test(p.title + ' ' + (p.extract || '').slice(0, 140))) {
        return false;
      }
      if (lang === 'en' && /may refer to:|List of /i.test(p.title + ' ' + (p.extract || '').slice(0, 140))) {
        return false;
      }
      return true;
    })
    .map((p) => {
      const lines = splitIntoTranscriptLines(
        p.extract || '',
        lang,
        lineCount,
        lang === 'th' ? 'บันทึกสุ่มวิกิพีเดีย' : 'Random Archive Witness'
      );
      const totalLen = lines.reduce((acc, l) => acc + l.text.length, 0);
      return { page: p, lines, totalLen };
    })
    .filter((c) => c.lines.length >= 2 && c.totalLen >= 160)
    .sort((a, b) => b.totalLen - a.totalLen);

  const best = candidates[0];
  if (!best) {
    throw new Error('สุ่มพบบทความที่สั้นเกินไป กรุณากดสุ่มอีกครั้ง');
  }

  return {
    id: `wiki-rand-${lang}-${best.page.pageid}-${Date.now()}`,
    caseCode: `RAND-${lang.toUpperCase()}`,
    title: best.page.title,
    subtitle:
      lang === 'th'
        ? 'สุ่มสดจากวิกิพีเดียภาษาไทย (คัดกรองเฉพาะภาษาไทย 100%)'
        : 'Live Random English Wikipedia — Practice Typing, Reading & Translation',
    language: lang,
    sourceKind: 'random',
    difficulty: 'senior',
    category: `สุ่มวิกิพีเดีย (${lang.toUpperCase()})`,
    sourceUrl: `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(best.page.title.replace(/ /g, '_'))}`,
    lines: best.lines,
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

  const lines: PassageLine[] = [];
  let buf = '';
  let segStart = 0;
  let segEnd = 0;

  for (const node of textNodes) {
    const start = parseFloat(node.getAttribute('start') || '0');
    const dur = parseFloat(node.getAttribute('dur') || '3');
    const content = sanitizeTextForLanguage(
      decodeHtmlEntities(node.textContent || '').replace(/\[[^\]]+\]/g, ''),
      lang
    );
    if (!content) continue;

    if (!buf) {
      buf = content;
      segStart = start;
      segEnd = start + dur;
    } else if (buf.length + content.length <= 135 && start - segEnd < 4) {
      buf = `${buf} ${content}`;
      segEnd = start + dur;
    } else {
      lines.push({
        id: `yt-xml-${lines.length}`,
        speaker: 'witness',
        speakerName: `Witness Feed (${formatTimestamp(segStart)})`,
        startSec: Math.floor(segStart),
        endSec: Math.ceil(segEnd),
        text: sanitizeTextForLanguage(buf, lang),
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
      text: sanitizeTextForLanguage(buf, lang),
    });
  }
  return lines.filter((l) => l.text.length >= 6).slice(0, 30);
}

export interface TrendingTopicItem {
  title: string;
  views: number;
}

/**
 * Fetch real-time Trending Wikipedia articles from yesterday via Wikimedia Pageviews REST API (100% CORS-enabled!).
 * Gives players fresh, unpredictable real-world topics every single day with zero backend.
 */
export async function fetchTrendingWikipediaTitles(lang: Language): Promise<TrendingTopicItem[]> {
  // Pageviews API publishes yesterday's top articles reliably
  const d = new Date(Date.now() - 86400000 * 2);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');

  const url = `https://wikimedia.org/api/rest_v1/metrics/pageviews/top/${lang}.wikipedia/all-access/${yyyy}/${mm}/${dd}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    const articles = data?.items?.[0]?.articles || [];
    const skipPattern =
      /^(Main_Page|หน้าหลัก|Special:|พิเศษ:|Wikipedia:|วิกิพีเดีย:|File:|ไฟล์:|Portal:|สถานีย่อย:|Category:|หมวดหมู่:|รายชื่อ)/i;

    return articles
      .filter(
        (a: { article?: string; views?: number }) =>
          a.article && !skipPattern.test(a.article) && !a.article.includes(':')
      )
      .slice(0, 12)
      .map((a: { article: string; views: number }) => ({
        title: a.article.replace(/_/g, ' '),
        views: a.views || 0,
      }));
  } catch {
    return [];
  }
}

export async function tryAutoFetchYouTubeCaptions(
  videoId: string,
  lang: Language
): Promise<{ lines: PassageLine[]; detectedLang: Language } | null> {
  const langsToTry: Language[] = lang === 'th' ? ['th', 'en'] : ['en', 'th'];

  const fetchWithTimeout = async (url: string, timeoutMs = 4800) => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      return await fetch(url, { signal: ctrl.signal });
    } finally {
      clearTimeout(timer);
    }
  };

  // Tier 1: Extract real signed captionTracks baseUrl from YouTube watch page via CORS proxy
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const proxyUrls = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(watchUrl)}`,
    `https://corsproxy.io/?${encodeURIComponent(watchUrl)}`,
  ];

  for (const pUrl of proxyUrls) {
    try {
      const res = await fetchWithTimeout(pUrl, 5000);
      if (!res.ok) continue;
      const html = await res.text();
      const tracksMatch = html.match(/"captionTracks":(\[.*?\])/);
      if (!tracksMatch) continue;
      const tracks = JSON.parse(tracksMatch[1]) as Array<{
        baseUrl?: string;
        languageCode?: string;
      }>;
      if (!Array.isArray(tracks) || tracks.length === 0) continue;

      for (const tryLang of langsToTry) {
        const track =
          tracks.find((t) => (t.languageCode || '').toLowerCase().startsWith(tryLang)) ||
          tracks[0];
        if (!track?.baseUrl) continue;
        const cleanBase = track.baseUrl.replace(/\\u0026/g, '&');
        const capLang: Language = (track.languageCode || '').toLowerCase().startsWith('th')
          ? 'th'
          : 'en';

        // Try direct fetch first (YouTube timedtext baseUrl sometimes allows GET), then via proxy
        for (const capUrl of [
          cleanBase,
          `https://api.allorigins.win/raw?url=${encodeURIComponent(cleanBase)}`,
        ]) {
          try {
            const capRes = await fetchWithTimeout(capUrl, 4500);
            if (capRes.ok) {
              const xml = await capRes.text();
              if (xml.includes('<text')) {
                const lines = parseTimedTextXml(xml, capLang);
                if (lines.length > 0) {
                  return { lines, detectedLang: capLang };
                }
              }
            }
          } catch {
            // next
          }
        }
      }
    } catch {
      // try next proxy
    }
  }

  // Tier 2: Legacy timedtext endpoint fallback
  for (const tryLang of langsToTry) {
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

export function parseSubtitleOrTranscript(
  rawText: string,
  lang: Language,
  speakerPrefix = 'Witness Feed'
): PassageLine[] {
  const normalizedRaw = rawText.replace(/\r\n/g, '\n').trim();
  if (!normalizedRaw) return [];

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
      const clean = sanitizeTextForLanguage(body, lang);
      if (!clean) continue;
      rawCues.push({
        startSec: parseTimestampToSec(startStr),
        endSec: parseTimestampToSec(endStr),
        text: clean,
      });
    }

    if (rawCues.length > 0) {
      return mergeTimedCues(rawCues, lang, speakerPrefix);
    }
  }

  const linesArr = normalizedRaw.split('\n').map((l) => l.trim()).filter(Boolean);
  const tsRegex = /^(\d{1,2}:)?\d{1,2}:\d{2}$/;
  const hasYtTimestamps = linesArr.filter((l) => tsRegex.test(l)).length >= 2;

  if (hasYtTimestamps) {
    const rawCues: Array<{ startSec: number; endSec: number; text: string }> = [];
    let currentTs: number | null = null;
    let buf: string[] = [];

    const flush = (nextTs?: number) => {
      if (currentTs !== null && buf.length > 0) {
        const text = sanitizeTextForLanguage(buf.join(' '), lang);
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
      return mergeTimedCues(rawCues, lang, speakerPrefix);
    }
  }

  return splitIntoTranscriptLines(normalizedRaw, lang, 24, speakerPrefix);
}

function mergeTimedCues(
  cues: Array<{ startSec: number; endSec: number; text: string }>,
  lang: Language,
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
        text: sanitizeTextForLanguage(buf, lang),
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
      text: sanitizeTextForLanguage(buf, lang),
    });
  }

  return merged.filter((m) => m.text.length >= 6).slice(0, 40);
}

export function detectTextLanguage(text: string): Language {
  const thaiChars = (text.match(/[\u0E00-\u0E7F]/g) || []).length;
  const latinChars = (text.match(/[a-zA-Z]/g) || []).length;
  return thaiChars >= latinChars ? 'th' : 'en';
}
