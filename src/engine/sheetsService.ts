import type { CaseDossier, Language, SessionResult, SheetScoreRow } from '../types/game';
import { splitIntoTranscriptLines } from './contentLoaders';

/**
 * Optional hardcoded default Google Apps Script Web App URL.
 * If populated, every visitor on GitHub Pages automatically syncs to this shared Sheet!
 */
export const DEFAULT_GOOGLE_SHEET_URL = '';

/**
 * Ready-to-paste Google Apps Script (Code.gs) for 100% free zero-backend Google Sheets leaderboard & personal records.
 */
export const GOOGLE_APPS_SCRIPT_TEMPLATE = `// === COURT SCRIBE — Google Sheets Leaderboard Backend (Apps Script) ===
// วิธีใช้: เปิด Google Sheet -> Extensions -> Apps Script -> วางโค้ดนี้ -> กด Deploy -> New deployment -> Web app
// ตั้งค่า Execute as: Me และ Who has access: Anyone -> คัดลอก Web app URL มาวางในเกม!

const SHEET_NAME = 'CourtScribe_Records';
const STAGES_SHEET_NAME = 'CourtScribe_Stages';

function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow([
      'timestamp',
      'playerName',
      'caseId',
      'caseTitle',
      'language',
      'wpm',
      'cpm',
      'accuracy',
      'maxCombo',
      'grade',
      'durationSec'
    ]);
    sheet.getRange(1, 1, 1, 11).setFontWeight('bold');
  }
  return sheet;
}

function getOrCreateStagesSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(STAGES_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(STAGES_SHEET_NAME);
    sheet.appendRow(['title', 'language', 'category', 'youtubeUrl', 'text']);
    sheet.getRange(1, 1, 1, 5).setFontWeight('bold');
  }
  return sheet;
}

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || 'list';
    if (action === 'ping') {
      return jsonOut({ ok: true, service: 'court-scribe-sheets' });
    }
    if (action === 'stages') {
      const stageSheet = getOrCreateStagesSheet();
      const svals = stageSheet.getDataRange().getValues();
      if (svals.length <= 1) return jsonOut({ ok: true, stages: [] });
      const stages = svals.slice(1)
        .filter(function(r) { return String(r[4] || '').trim().length > 10; })
        .map(function(r, idx) {
          return {
            id: 'sheet-stage-' + idx,
            title: String(r[0] || 'ด่านจาก Google Sheet #' + (idx + 1)),
            language: String(r[1] || 'th').toLowerCase() === 'en' ? 'en' : 'th',
            category: String(r[2] || 'ด่านอัปเดตจาก Google Sheet'),
            youtubeUrl: String(r[3] || ''),
            text: String(r[4] || '')
          };
        });
      return jsonOut({ ok: true, stages: stages });
    }
    const sheet = getOrCreateSheet();
    const values = sheet.getDataRange().getValues();
    if (values.length <= 1) {
      return jsonOut({ ok: true, rows: [] });
    }
    const rows = values.slice(1).map(function(r) {
      return {
        timestamp: String(r[0] || ''),
        playerName: String(r[1] || 'Anonymous'),
        caseId: String(r[2] || ''),
        caseTitle: String(r[3] || ''),
        language: String(r[4] || 'th'),
        wpm: Number(r[5] || 0),
        cpm: Number(r[6] || 0),
        accuracy: Number(r[7] || 0),
        maxCombo: Number(r[8] || 0),
        grade: String(r[9] || 'B'),
        durationSec: Number(r[10] || 0)
      };
    });
    // Sort highest WPM first, cap at latest top 200
    rows.sort(function(a, b) { return (b.wpm - a.wpm) || (b.accuracy - a.accuracy); });
    return jsonOut({ ok: true, rows: rows.slice(0, 200) });
  } catch (err) {
    return jsonOut({ ok: false, error: String(err) });
  }
}

function doPost(e) {
  try {
    const raw = (e && e.postData && e.postData.contents) ? e.postData.contents : '{}';
    const data = JSON.parse(raw);
    const sheet = getOrCreateSheet();
    sheet.appendRow([
      data.timestamp || new Date().toISOString(),
      String(data.playerName || 'เสมียนนิรนาม').slice(0, 40),
      String(data.caseId || '').slice(0, 80),
      String(data.caseTitle || '').slice(0, 120),
      data.language === 'en' ? 'en' : 'th',
      Number(data.wpm || 0),
      Number(data.cpm || 0),
      Number(data.accuracy || 0),
      Number(data.maxCombo || 0),
      String(data.grade || 'B').slice(0, 2),
      Math.round(Number(data.durationSec || 0))
    ]);
    return jsonOut({ ok: true });
  } catch (err) {
    return jsonOut({ ok: false, error: String(err) });
  }
}
`;

export function isValidSheetUrl(url: string): boolean {
  const trimmed = url.trim();
  return /^https:\/\/script\.google\.com\/macros\/s\/[a-zA-Z0-9_-]+\/exec/i.test(trimmed);
}

export async function testGoogleSheetConnection(
  sheetUrl: string
): Promise<{ ok: boolean; message: string }> {
  const clean = sheetUrl.trim();
  if (!isValidSheetUrl(clean)) {
    return {
      ok: false,
      message: 'รูปแบบ URL ไม่ถูกต้อง ต้องขึ้นต้นด้วย https://script.google.com/macros/s/.../exec',
    };
  }
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(`${clean}?action=ping`, { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) {
      return { ok: false, message: `เซิร์ฟเวอร์ตอบกลับ HTTP ${res.status}` };
    }
    const data = await res.json();
    if (data && data.ok) {
      return { ok: true, message: 'เชื่อมต่อ Google Sheet สำเร็จ! พร้อมบันทึกและดึงสถิติอัตโนมัติ' };
    }
    return { ok: false, message: data?.error || 'ได้รับคำตอบที่ไม่รองรับจาก Apps Script' };
  } catch {
    return {
      ok: false,
      message:
        'เชื่อมต่อไม่สำเร็จ กรุณาตรวจสอบว่า Deploy เป็น Web App โดยตั้งค่า "Who has access: Anyone" แล้ว',
    };
  }
}

export async function submitScoreToGoogleSheet(
  sheetUrl: string,
  playerName: string,
  result: SessionResult
): Promise<boolean> {
  const clean = sheetUrl.trim();
  if (!isValidSheetUrl(clean)) return false;

  const payload = {
    timestamp: new Date(result.timestamp).toISOString(),
    playerName: playerName.trim() || 'เสมียนนิรนาม',
    caseId: result.caseId,
    caseTitle: result.caseTitle,
    language: result.language,
    wpm: result.wpm,
    cpm: result.cpm,
    accuracy: result.accuracy,
    maxCombo: result.maxCombo,
    grade: result.grade,
    durationSec: Math.round(result.durationSec),
  };

  try {
    // Using text/plain avoids CORS preflight while Google Apps Script reads e.postData.contents cleanly!
    const res = await fetch(clean, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const data = await res.json().catch(() => ({ ok: true }));
      return Boolean(data?.ok ?? true);
    }
    return false;
  } catch {
    // Fallback no-cors fire-and-forget in restrictive environments
    try {
      await fetch(clean, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
      });
      return true;
    } catch {
      return false;
    }
  }
}

export async function fetchLeaderboardFromGoogleSheet(
  sheetUrl: string
): Promise<SheetScoreRow[]> {
  const clean = sheetUrl.trim();
  if (!isValidSheetUrl(clean)) return [];

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 9000);
  try {
    const res = await fetch(`${clean}?action=list`, { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) return [];
    const data = await res.json();
    if (!data?.ok || !Array.isArray(data.rows)) return [];
    return data.rows.map((r: Record<string, unknown>) => ({
      timestamp: String(r.timestamp || ''),
      playerName: String(r.playerName || 'Anonymous'),
      caseId: String(r.caseId || ''),
      caseTitle: String(r.caseTitle || ''),
      language: (r.language === 'en' ? 'en' : 'th') as Language,
      wpm: Number(r.wpm || 0),
      cpm: Number(r.cpm || 0),
      accuracy: Number(r.accuracy || 0),
      maxCombo: Number(r.maxCombo || 0),
      grade: (['S', 'A', 'B', 'C'].includes(String(r.grade)) ? String(r.grade) : 'B') as
        | 'S'
        | 'A'
        | 'B'
        | 'C',
      durationSec: Number(r.durationSec || 0),
    }));
  } catch {
    clearTimeout(t);
    return [];
  }
}

/**
 * Fetch user-updated custom stages directly from the "CourtScribe_Stages" tab in Google Sheets!
 * Lets the game owner push fresh stages to all players simply by adding rows in Google Sheets.
 */
export async function fetchStagesFromGoogleSheet(sheetUrl: string): Promise<CaseDossier[]> {
  const clean = sheetUrl.trim();
  if (!isValidSheetUrl(clean)) return [];

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 9000);
  try {
    const res = await fetch(`${clean}?action=stages`, { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) return [];
    const data = await res.json();
    if (!data?.ok || !Array.isArray(data.stages)) return [];

    return data.stages
      .map((s: Record<string, unknown>, idx: number): CaseDossier | null => {
        const lang: Language = String(s.language || 'th').toLowerCase() === 'en' ? 'en' : 'th';
        const rawText = String(s.text || '');
        const lines = splitIntoTranscriptLines(rawText, lang, 16, 'ด่านจาก Google Sheet');
        if (lines.length === 0) return null;
        return {
          id: String(s.id || `sheet-stage-${idx}`),
          caseCode: `SHEET #${idx + 1}`,
          title: String(s.title || `ด่านอัปเดต #${idx + 1}`),
          subtitle: 'อัปเดตสดจาก Google Sheet โดยผู้สร้าง',
          language: lang,
          sourceKind: 'custom',
          difficulty: 'senior',
          category: String(s.category || 'ด่านอัปเดตจาก Google Sheet'),
          sourceUrl: String(s.youtubeUrl || '') || undefined,
          lines,
        };
      })
      .filter((d: CaseDossier | null): d is CaseDossier => d !== null);
  } catch {
    clearTimeout(t);
    return [];
  }
}
