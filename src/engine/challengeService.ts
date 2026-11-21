import type {
  ActiveChallenge,
  CaseDossier,
  Language,
  SessionResult,
  SpeakerRole,
} from '../types/game';
import { BUILT_IN_CASES, OFFLINE_RANDOM_GEMS } from '../data/builtInCases';
import { isValidSheetUrl } from './sheetsService';

interface CompactChallengePayload {
  v: 1;
  c: string; // challengerName
  w: number; // targetWpm
  a: number; // targetAcc
  g: 'S' | 'A' | 'B' | 'C';
  bid?: string; // built-in dossier id (ultra short URL!)
  // Custom / Wikipedia / Random / YouTube payload when not built-in:
  t?: string; // title
  l?: Language;
  sk?: CaseDossier['sourceKind'];
  yt?: string;
  su?: string;
  lines?: Array<{
    s?: SpeakerRole;
    sn?: string;
    tx: string;
    tr?: string;
    ss?: number;
  }>;
  sh?: string; // optional shared Google Sheet URL
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBytes(str: string): Uint8Array<ArrayBuffer> {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((str.length + 3) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function compressString(input: string): Promise<string> {
  const encoded = new TextEncoder().encode(input);
  const rawBytes = new Uint8Array(new ArrayBuffer(encoded.length));
  rawBytes.set(encoded);
  if (typeof CompressionStream === 'function') {
    try {
      const cs = new CompressionStream('deflate-raw');
      const writer = cs.writable.getWriter();
      writer.write(rawBytes);
      writer.close();
      const compressed = new Uint8Array(await new Response(cs.readable).arrayBuffer());
      return `z.${bytesToBase64Url(compressed)}`;
    } catch {
      // fallback to plain base64url
    }
  }
  return `p.${bytesToBase64Url(rawBytes)}`;
}

async function decompressString(token: string): Promise<string> {
  if (token.startsWith('z.') && typeof DecompressionStream === 'function') {
    const bytes = base64UrlToBytes(token.slice(2));
    const ds = new DecompressionStream('deflate-raw');
    const writer = ds.writable.getWriter();
    writer.write(bytes);
    writer.close();
    const raw = await new Response(ds.readable).arrayBuffer();
    return new TextDecoder().decode(raw);
  }
  const b64 = token.startsWith('p.') ? token.slice(2) : token;
  return new TextDecoder().decode(base64UrlToBytes(b64));
}

const ALL_PRESET_CASES = [...BUILT_IN_CASES, ...OFFLINE_RANDOM_GEMS];

/**
 * Generate a shareable Challenge Link so friends play the EXACT SAME passage and try to beat the score!
 */
export async function buildChallengeUrl(
  dossier: CaseDossier,
  result: SessionResult,
  challengerName: string,
  sheetUrl?: string
): Promise<string> {
  const isBuiltIn = ALL_PRESET_CASES.some((c) => c.id === dossier.id);

  const payload: CompactChallengePayload = {
    v: 1,
    c: (challengerName || 'เสมียนผู้ท้าชิง').trim().slice(0, 32),
    w: result.wpm,
    a: result.accuracy,
    g: result.grade,
  };

  if (isBuiltIn) {
    payload.bid = dossier.id;
  } else {
    payload.t = dossier.title.slice(0, 120);
    payload.l = dossier.language;
    payload.sk = dossier.sourceKind;
    if (dossier.youtubeId) payload.yt = dossier.youtubeId;
    if (dossier.sourceUrl) payload.su = dossier.sourceUrl;
    payload.lines = dossier.lines.slice(0, 14).map((l) => ({
      s: l.speaker,
      sn: l.speakerName,
      tx: l.text,
      tr: l.translationTh,
      ss: l.startSec,
    }));
  }

  if (sheetUrl && isValidSheetUrl(sheetUrl)) {
    payload.sh = sheetUrl.trim();
  }

  const encoded = await compressString(JSON.stringify(payload));
  const baseUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}`
      : 'https://nikka230.github.io/court-scribe/';
  return `${baseUrl}?challenge=${encoded}`;
}

export interface DecodedChallenge {
  dossier: CaseDossier;
  challenge: ActiveChallenge;
  sharedSheetUrl?: string;
}

/**
 * Check window.location.search for ?challenge=... and decode into a playable Dossier + Challenge target!
 */
export async function readChallengeFromUrl(): Promise<DecodedChallenge | null> {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const raw = params.get('challenge');
  if (!raw) return null;

  try {
    const json = await decompressString(raw);
    const data = JSON.parse(json) as CompactChallengePayload;
    if (!data || data.v !== 1) return null;

    let dossier: CaseDossier | undefined;
    if (data.bid) {
      dossier = ALL_PRESET_CASES.find((c) => c.id === data.bid);
    }

    if (!dossier && Array.isArray(data.lines) && data.lines.length > 0) {
      const lang: Language = data.l === 'en' ? 'en' : 'th';
      dossier = {
        id: `challenge-${Date.now()}`,
        caseCode: 'DUEL CHALLENGE',
        title: data.t || (lang === 'th' ? 'สำนวนคำท้าดวล' : 'Courtroom Duel Dossier'),
        subtitle: `คำท้าดวลจาก ${data.c} — ทำลายสถิติ ${data.w} WPM (${data.a}%) ให้ได้!`,
        language: lang,
        sourceKind: data.sk || 'custom',
        difficulty: 'senior',
        category: 'คำท้าดวลจากเพื่อน',
        youtubeId: data.yt,
        sourceUrl: data.su,
        lines: data.lines.map((l, idx) => ({
          id: `ch-line-${idx}`,
          speaker: l.s || 'witness',
          speakerName: l.sn || (lang === 'th' ? `พยานคำท้า #${idx + 1}` : `Duel Record #${idx + 1}`),
          text: l.tx,
          translationTh: l.tr,
          startSec: l.ss,
        })),
      };
    }

    if (!dossier) return null;

    return {
      dossier,
      challenge: {
        challengerName: data.c || 'เสมียนผู้ท้าชิง',
        targetWpm: Number(data.w || 0),
        targetAcc: Number(data.a || 100),
        targetGrade: data.g || 'B',
        caseTitle: dossier.title,
      },
      sharedSheetUrl: data.sh && isValidSheetUrl(data.sh) ? data.sh : undefined,
    };
  } catch {
    return null;
  }
}
