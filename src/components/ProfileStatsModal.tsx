import { useEffect, useState, type ChangeEvent } from 'react';
import {
  X,
  Medal,
  DownloadSimple,
  UploadSimple,
  ClockCounterClockwise,
  Table,
  Copy,
  Check,
  ArrowsClockwise,
  SpinnerGap,
  CheckCircle,
  WarningCircle,
  Trophy,
  UserCircle,
} from '@phosphor-icons/react';
import type { Language, SheetScoreRow, UserProfile } from '../types/game';
import { getRankForXp } from '../engine/storage';
import {
  GOOGLE_APPS_SCRIPT_TEMPLATE,
  fetchLeaderboardFromGoogleSheet,
  isValidSheetUrl,
  testGoogleSheetConnection,
} from '../engine/sheetsService';
import sealImg from '../assets/court-seal.jpg';

interface Props {
  open: boolean;
  initialTab?: 'career' | 'sheets';
  onClose: () => void;
  profile: UserProfile;
  onUpdateProfile: (patch: Partial<UserProfile>) => void;
  onImportProfile: (next: UserProfile) => void;
}

export function ProfileStatsModal({
  open,
  initialTab = 'career',
  onClose,
  profile,
  onUpdateProfile,
  onImportProfile,
}: Props) {
  const [tab, setTab] = useState<'career' | 'sheets'>(initialTab);
  const [sheetInput, setSheetInput] = useState(profile.googleSheetUrl || '');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [copiedScript, setCopiedScript] = useState(false);
  const [showSetupGuide, setShowSetupGuide] = useState(!profile.googleSheetUrl);

  const [rows, setRows] = useState<SheetScoreRow[]>([]);
  const [loadingRows, setLoadingRows] = useState(false);
  const [boardFilter, setBoardFilter] = useState<'all' | 'mine' | Language>('all');

  useEffect(() => {
    if (open) {
      setTab(initialTab);
      setSheetInput(profile.googleSheetUrl || '');
      if (profile.googleSheetUrl && isValidSheetUrl(profile.googleSheetUrl)) {
        loadBoard(profile.googleSheetUrl);
      }
    }
  }, [open, initialTab, profile.googleSheetUrl]);

  const loadBoard = async (url: string) => {
    if (!isValidSheetUrl(url)) return;
    setLoadingRows(true);
    try {
      const data = await fetchLeaderboardFromGoogleSheet(url);
      setRows(data);
    } finally {
      setLoadingRows(false);
    }
  };

  if (!open) return null;

  const rank = getRankForXp(profile.xp);
  const progressPct = rank.nextXp
    ? Math.min(100, Math.round(((profile.xp - rank.minXp) / (rank.nextXp - rank.minXp)) * 100))
    : 100;

  const handleSaveAndTestSheet = async () => {
    const trimmed = sheetInput.trim();
    if (!trimmed) {
      onUpdateProfile({ googleSheetUrl: '' });
      setTestResult({ ok: true, message: 'ยกเลิกการเชื่อมต่อ Google Sheet แล้ว' });
      setRows([]);
      return;
    }
    setTesting(true);
    setTestResult(null);
    const res = await testGoogleSheetConnection(trimmed);
    setTesting(false);
    setTestResult(res);
    if (res.ok) {
      onUpdateProfile({ googleSheetUrl: trimmed });
      setShowSetupGuide(false);
      loadBoard(trimmed);
    }
  };

  const handleCopyScript = async () => {
    try {
      await navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_TEMPLATE);
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2600);
    } catch {
      // ignore
    }
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(profile, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `court-scribe-save-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || '')) as UserProfile;
        if (typeof parsed.xp === 'number' && Array.isArray(parsed.history)) {
          onImportProfile(parsed);
        }
      } catch {
        // invalid json
      }
    };
    reader.readAsText(file, 'utf-8');
  };

  const filteredRows = rows.filter((r) => {
    if (boardFilter === 'mine') {
      return r.playerName.trim().toLowerCase() === (profile.playerName || '').trim().toLowerCase();
    }
    if (boardFilter === 'th' || boardFilter === 'en') {
      return r.language === boardFilter;
    }
    return true;
  });

  const mySheetBestWpm = rows
    .filter((r) => r.playerName.trim().toLowerCase() === (profile.playerName || '').trim().toLowerCase())
    .reduce((max, r) => Math.max(max, r.wpm), 0);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="ทำเนียบประวัติเสมียนศาลและตารางสถิติ Google Sheets"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-5"
      onClick={onClose}
    >
      <div
        className="brass-panel flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#d4af37]/25 bg-[#1b140f] px-5 py-4">
          <div className="flex items-center gap-3">
            <img
              src={sealImg}
              alt="ตราเสมียนศาล"
              className="h-11 w-11 rounded-full border border-[#d4af37] object-cover"
            />
            <div>
              <h2 className="font-display text-lg font-bold tracking-wider text-[#f2d583]">
                RECORDS &amp; GOOGLE SHEETS · สถิติและตารางอันดับ
              </h2>
              <p className="text-xs text-[#bba88e]">
                บันทึกความเร็วอัตโนมัติลง Google Sheet เพื่อแข่งขันและทำลายสถิติตัวเอง
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดหน้าต่าง"
            className="rounded-lg border border-white/10 p-2 text-[#cbb89d] hover:bg-white/10 hover:text-white cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex items-center justify-between gap-2 border-b border-white/10 bg-[#140e0a] px-5 py-2.5">
          <div className="inline-flex gap-1.5">
            <button
              type="button"
              onClick={() => setTab('career')}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
                tab === 'career'
                  ? 'bg-gradient-to-b from-[#e4c25e] to-[#b88f28] text-[#140e07]'
                  : 'bg-white/5 text-[#d7c6ae] hover:bg-white/10'
              }`}
            >
              <Medal weight="fill" className="h-4 w-4" />
              สถิติส่วนตัว &amp; ยศ
            </button>
            <button
              type="button"
              onClick={() => setTab('sheets')}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
                tab === 'sheets'
                  ? 'bg-gradient-to-b from-[#e4c25e] to-[#b88f28] text-[#140e07]'
                  : 'bg-white/5 text-[#d7c6ae] hover:bg-white/10'
              }`}
            >
              <Table weight="duotone" className="h-4 w-4" />
              Google Sheets ตารางสถิติ
              {profile.googleSheetUrl && (
                <span className="h-2 w-2 rounded-full bg-[#2ea673]" />
              )}
            </button>
          </div>

          {/* Quick Player Callsign Input */}
          <div className="flex items-center gap-1.5">
            <UserCircle weight="duotone" className="h-4 w-4 text-[#f2d583]" />
            <input
              type="text"
              value={profile.playerName}
              onChange={(e) => onUpdateProfile({ playerName: e.target.value })}
              placeholder="ตั้งชื่อเสมียนของคุณ"
              maxLength={32}
              className="w-36 rounded-lg border border-[#d4af37]/30 bg-black/50 px-2.5 py-1 text-xs font-semibold text-white placeholder-[#8c7a64] focus:border-[#f2d583] focus:outline-none sm:w-44"
            />
          </div>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {/* ================= TAB 1: PERSONAL CAREER STATS ================= */}
          {tab === 'career' && (
            <>
              <div className="rounded-2xl border border-[#d4af37]/40 bg-gradient-to-br from-[#2a1f13] to-[#15100c] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#f2d583]">
                      <Medal weight="fill" className="h-4 w-4" />
                      ยศระดับที่ {rank.level} · {rank.titleEn}
                    </div>
                    <div className="mt-1 text-xl font-extrabold text-white">
                      {profile.playerName || 'เสมียนนิรนาม'} — {rank.titleTh}
                    </div>
                  </div>
                  <div className="text-right font-mono-num">
                    <div className="text-xl font-bold text-[#f2d583]">{profile.xp} XP</div>
                    <div className="text-[11px] text-[#bba88e]">
                      {rank.nextXp ? `อีก ${rank.nextXp - profile.xp} XP เลื่อนยศ` : 'ระดับสูงสุดแล้ว!'}
                    </div>
                  </div>
                </div>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-black/50">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#9d7a2c] via-[#d4af37] to-[#f7de93]"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <MiniStat label="สถิติสูงสุด (ไทย)" value={`${profile.bestWpmTh} WPM`} />
                <MiniStat label="สถิติสูงสุด (อังกฤษ)" value={`${profile.bestWpmEn} WPM`} />
                <MiniStat label="สำนวนที่บันทึกแล้ว" value={`${profile.totalSessions}`} />
                <MiniStat
                  label="ตัวอักษรสะสม"
                  value={profile.totalCharsTyped.toLocaleString()}
                />
              </div>

              <div>
                <div className="mb-2 flex items-center gap-1.5 text-xs font-bold text-[#f2d583]">
                  <ClockCounterClockwise weight="bold" className="h-4 w-4" />
                  ประวัติการพิจารณาคดีล่าสุด
                </div>
                {profile.history.length === 0 ? (
                  <div className="rounded-xl border border-white/10 bg-black/30 p-4 text-center text-xs text-[#9e8c73]">
                    ยังไม่มีประวัติ — ลองบันทึกสำนวนคดีแรกของคุณให้จบเพื่อเก็บสถิติและทำลายสถิติตัวเอง!
                  </div>
                ) : (
                  <div className="space-y-2">
                    {profile.history.slice(0, 12).map((h) => (
                      <div
                        key={h.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate font-bold text-[#f5efe6]">{h.caseTitle}</span>
                            {h.isNewPersonalBest && (
                              <span className="shrink-0 rounded bg-[#2ea673]/25 px-1.5 py-0.5 text-[10px] font-bold text-[#88ebb9]">
                                NEW BEST
                              </span>
                            )}
                          </div>
                          <div className="mt-0.5 text-[11px] text-[#9e8c73]">
                            {h.language === 'th' ? 'ภาษาไทย' : 'English'} ·{' '}
                            {new Date(h.timestamp).toLocaleString('th-TH')}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 font-mono-num">
                          <span className="font-bold text-[#f2d583]">{h.wpm} WPM</span>
                          <span className="text-[#79e3b1]">{h.accuracy}%</span>
                          <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[#d4af37]/50 bg-[#2a1f13] font-display font-bold text-[#f2d583]">
                            {h.grade}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-4">
                <span className="text-xs text-[#a8957c]">
                  สำรองหรือย้ายไฟล์เซฟไปเครื่องอื่นได้ตลอดเวลา
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExport}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#d4af37]/40 bg-[#d4af37]/15 px-3 py-1.5 text-xs font-bold text-[#f2d583] hover:bg-[#d4af37]/25 cursor-pointer"
                  >
                    <DownloadSimple weight="bold" className="h-4 w-4" />
                    ส่งออกไฟล์เซฟ (.JSON)
                  </button>
                  <label className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-bold text-[#e5d8c3] hover:bg-white/10 cursor-pointer">
                    <UploadSimple weight="bold" className="h-4 w-4" />
                    นำเข้าเซฟ
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImport}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </>
          )}

          {/* ================= TAB 2: GOOGLE SHEETS SYNC & LEADERBOARD ================= */}
          {tab === 'sheets' && (
            <div className="space-y-4">
              {/* Connection Bar */}
              <div className="rounded-xl border border-[#2ea673]/35 bg-[#10241b]/70 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#88ebb9]">
                    <Table weight="fill" className="h-5 w-5 text-[#52d198]" />
                    เชื่อมต่อ Google Sheet เพื่อบันทึกสถิติความเร็วออนไลน์ฟรี
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowSetupGuide((s) => !s)}
                    className="text-xs font-semibold text-[#f2d583] underline hover:text-white cursor-pointer"
                  >
                    {showSetupGuide ? 'ซ่อนวิธีตั้งค่า' : 'ดูวิธีตั้งค่า + คัดลอกโค้ด Apps Script'}
                  </button>
                </div>

                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <input
                    type="url"
                    value={sheetInput}
                    onChange={(e) => setSheetInput(e.target.value)}
                    placeholder="วาง Google Apps Script Web App URL (https://script.google.com/macros/s/.../exec)"
                    className="flex-1 rounded-xl border border-[#d4af37]/30 bg-black/55 px-3.5 py-2 text-xs text-white placeholder-[#7f705c] focus:border-[#f2d583] focus:outline-none"
                  />
                  <button
                    type="button"
                    disabled={testing}
                    onClick={handleSaveAndTestSheet}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-b from-[#e4c25e] to-[#b88f28] px-4 py-2 text-xs font-extrabold text-[#140e07] transition hover:brightness-110 disabled:opacity-60 cursor-pointer"
                  >
                    {testing ? <SpinnerGap className="h-4 w-4 animate-spin" /> : <Check weight="bold" className="h-4 w-4" />}
                    ทดสอบและบันทึก URL
                  </button>
                </div>

                {testResult && (
                  <div
                    className={`mt-2.5 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold ${
                      testResult.ok
                        ? 'bg-[#2ea673]/20 text-[#9effce]'
                        : 'bg-[#d94141]/20 text-[#ffbdbd]'
                    }`}
                  >
                    {testResult.ok ? (
                      <CheckCircle weight="fill" className="h-4 w-4 shrink-0" />
                    ) : (
                      <WarningCircle weight="fill" className="h-4 w-4 shrink-0" />
                    )}
                    <span>{testResult.message}</span>
                  </div>
                )}
              </div>

              {/* 30-second Setup Guide + 1-click Copy Apps Script */}
              {showSetupGuide && (
                <div className="rounded-xl border border-[#d4af37]/30 bg-black/40 p-4 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-[#f2d583]">
                      วิธีเชื่อม Google Sheet ฟรีใน 30 วินาที (ไม่ต้องมีเซิร์ฟเวอร์)
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyScript}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#d4af37] px-3 py-1.5 text-xs font-extrabold text-[#140e07] hover:bg-[#f2d583] cursor-pointer"
                    >
                      {copiedScript ? (
                        <>
                          <Check weight="bold" className="h-3.5 w-3.5" />
                          คัดลอกโค้ด Apps Script แล้ว!
                        </>
                      ) : (
                        <>
                          <Copy weight="bold" className="h-3.5 w-3.5" />
                          คัดลอกโค้ด Apps Script (Code.gs)
                        </>
                      )}
                    </button>
                  </div>

                  <ol className="mt-2.5 list-decimal space-y-1 pl-5 leading-relaxed text-[#d7c6ae]">
                    <li>
                      เปิด <strong className="text-white">Google Sheets</strong> สร้างสเปรดชีตใหม่ 1 ไฟล์
                    </li>
                    <li>
                      ไปที่เมนู <strong className="text-white">ส่วนขยาย (Extensions) → Apps Script</strong>
                    </li>
                    <li>
                      ลบโค้ดเดิมออกทั้งหมด แล้วกดปุ่ม <strong className="text-[#f2d583]">คัดลอกโค้ด Apps Script</strong> ด้านบนมาวางแทนที่แล้วกด Save
                    </li>
                    <li>
                      กดปุ่ม <strong className="text-white">Deploy → New deployment → เลือกชนิด Web app</strong> ตั้งค่า <strong className="text-[#88ebb9]">Who has access: Anyone</strong> แล้วกด Deploy
                    </li>
                    <li>
                      คัดลอก <strong className="text-white">Web app URL</strong> ที่ขึ้นต้นด้วย <code>https://script.google.com/macros/s/.../exec</code> มาวางในช่องด้านบน — และเวลาส่งคำท้าดวลให้เพื่อน ลิงก์จะพก Google Sheet นี้ไปด้วยเพื่อให้เพื่อนแข่งขึ้นตารางเดียวกัน!
                    </li>
                  </ol>
                </div>
              )}

              {/* Live Google Sheets Leaderboard Table */}
              {profile.googleSheetUrl && isValidSheetUrl(profile.googleSheetUrl) && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Trophy weight="fill" className="h-4 w-4 text-[#f2d583]" />
                      <span className="text-xs font-bold text-[#f2d583]">
                        ตารางสถิติสดจาก Google Sheet ({filteredRows.length} รายการ)
                      </span>
                      {mySheetBestWpm > 0 && (
                        <span className="rounded-full bg-[#2ea673]/25 px-2 py-0.5 font-mono-num text-[11px] font-bold text-[#88ebb9]">
                          สถิติสูงสุดของคุณ: {mySheetBestWpm} WPM
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <div className="inline-flex overflow-hidden rounded-lg border border-white/15 bg-black/40 text-[11px] font-semibold">
                        {(
                          [
                            ['all', 'ทั้งหมด'],
                            ['mine', 'เฉพาะของฉัน'],
                            ['th', 'ไทย'],
                            ['en', 'EN'],
                          ] as const
                        ).map(([id, label]) => (
                          <button
                            key={id}
                            type="button"
                            onClick={() => setBoardFilter(id)}
                            className={`px-2.5 py-1 cursor-pointer ${
                              boardFilter === id
                                ? 'bg-[#d4af37] text-[#140e07]'
                                : 'text-[#cbb89d] hover:bg-white/10'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        disabled={loadingRows}
                        onClick={() => loadBoard(profile.googleSheetUrl)}
                        className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-[#f2d583] hover:bg-white/10 cursor-pointer"
                      >
                        <ArrowsClockwise className={`h-3.5 w-3.5 ${loadingRows ? 'animate-spin' : ''}`} />
                        รีเฟรช
                      </button>
                    </div>
                  </div>

                  {loadingRows ? (
                    <div className="py-8 text-center text-xs text-[#bba88e]">
                      <SpinnerGap className="mx-auto mb-2 h-6 w-6 animate-spin text-[#f2d583]" />
                      กำลังดึงตารางสถิติจาก Google Sheet...
                    </div>
                  ) : filteredRows.length === 0 ? (
                    <div className="rounded-xl border border-white/10 bg-black/30 p-6 text-center text-xs text-[#9e8c73]">
                      ยังไม่มีสถิติใน Google Sheet — ลองพิมพ์ให้จบ 1 สำนวน ระบบจะส่งสถิติขึ้นตารางนี้ให้อัตโนมัติ!
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/35">
                      <table className="w-full text-left text-xs">
                        <thead className="border-b border-white/10 bg-white/5 text-[11px] text-[#bba88e]">
                          <tr>
                            <th className="px-3 py-2">#</th>
                            <th className="px-3 py-2">ชื่อเสมียน</th>
                            <th className="px-3 py-2">สำนวนคดี</th>
                            <th className="px-3 py-2 text-right">WPM</th>
                            <th className="px-3 py-2 text-right">แม่นยำ</th>
                            <th className="px-3 py-2 text-center">เกรด</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {filteredRows.slice(0, 30).map((r, idx) => {
                            const isMe =
                              r.playerName.trim().toLowerCase() ===
                              (profile.playerName || '').trim().toLowerCase();
                            return (
                              <tr
                                key={`${r.timestamp}-${idx}`}
                                className={isMe ? 'bg-[#d4af37]/12' : 'hover:bg-white/5'}
                              >
                                <td className="px-3 py-2 font-mono-num font-bold text-[#f2d583]">
                                  {idx + 1}
                                </td>
                                <td className="px-3 py-2 font-semibold text-white">
                                  {r.playerName}
                                  {isMe && (
                                    <span className="ml-1.5 rounded bg-[#d4af37]/25 px-1.5 py-0.5 text-[9px] text-[#ffe07d]">
                                      คุณ
                                    </span>
                                  )}
                                </td>
                                <td className="max-w-[200px] truncate px-3 py-2 text-[#cbb89d]">
                                  <span className="mr-1.5 rounded bg-white/10 px-1 py-0.5 text-[9px] uppercase">
                                    {r.language}
                                  </span>
                                  {r.caseTitle}
                                </td>
                                <td className="px-3 py-2 text-right font-mono-num font-bold text-[#ffe07d]">
                                  {r.wpm}
                                </td>
                                <td className="px-3 py-2 text-right font-mono-num text-[#88ebb9]">
                                  {r.accuracy}%
                                </td>
                                <td className="px-3 py-2 text-center font-display font-bold text-[#f2d583]">
                                  {r.grade}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/35 p-3">
      <div className="text-[11px] text-[#a8957c]">{label}</div>
      <div className="mt-1 font-mono-num text-lg font-bold text-white">{value}</div>
    </div>
  );
}
