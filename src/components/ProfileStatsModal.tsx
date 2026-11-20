import type { ChangeEvent } from 'react';
import {
  X,
  Medal,
  DownloadSimple,
  UploadSimple,
  ClockCounterClockwise,
} from '@phosphor-icons/react';
import type { UserProfile } from '../types/game';
import { getRankForXp } from '../engine/storage';
import sealImg from '../assets/court-seal.jpg';

interface Props {
  open: boolean;
  onClose: () => void;
  profile: UserProfile;
  onImportProfile: (next: UserProfile) => void;
}

export function ProfileStatsModal({
  open,
  onClose,
  profile,
  onImportProfile,
}: Props) {
  if (!open) return null;

  const rank = getRankForXp(profile.xp);
  const progressPct = rank.nextXp
    ? Math.min(100, Math.round(((profile.xp - rank.minXp) / (rank.nextXp - rank.minXp)) * 100))
    : 100;

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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="ทำเนียบประวัติเสมียนศาล"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-5"
      onClick={onClose}
    >
      <div
        className="brass-panel flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl"
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
                CAREER RECORD · ทำเนียบประวัติเสมียนศาล
              </h2>
              <p className="text-xs text-[#bba88e]">
                บันทึกความก้าวหน้าในเครื่องของคุณโดยตรง (สำรอง/ย้ายเซฟเป็นไฟล์ JSON ได้ตลอดเวลา)
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

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {/* Rank Card */}
          <div className="rounded-2xl border border-[#d4af37]/40 bg-gradient-to-br from-[#2a1f13] to-[#15100c] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#f2d583]">
                  <Medal weight="fill" className="h-4 w-4" />
                  ยศระดับที่ {rank.level} · {rank.titleEn}
                </div>
                <div className="mt-1 text-xl font-extrabold text-white">{rank.titleTh}</div>
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

          {/* Lifetime Stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MiniStat label="สถิติสูงสุด (ไทย)" value={`${profile.bestWpmTh} WPM`} />
            <MiniStat label="สถิติสูงสุด (อังกฤษ)" value={`${profile.bestWpmEn} WPM`} />
            <MiniStat label="สำนวนที่บันทึกแล้ว" value={`${profile.totalSessions}`} />
            <MiniStat
              label="ตัวอักษรสะสม"
              value={profile.totalCharsTyped.toLocaleString()}
            />
          </div>

          {/* Recent History */}
          <div>
            <div className="mb-2 flex items-center gap-1.5 text-xs font-bold text-[#f2d583]">
              <ClockCounterClockwise weight="bold" className="h-4 w-4" />
              ประวัติการพิจารณาคดีล่าสุด
            </div>
            {profile.history.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-black/30 p-4 text-center text-xs text-[#9e8c73]">
                ยังไม่มีประวัติ — ลองบันทึกสำนวนคดีแรกของคุณให้จบเพื่อรับตราประทับและเก็บสถิติ!
              </div>
            ) : (
              <div className="space-y-2">
                {profile.history.slice(0, 10).map((h) => (
                  <div
                    key={h.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-bold text-[#f5efe6]">{h.caseTitle}</div>
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

          {/* Portable JSON Save Export / Import */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-4">
            <span className="text-xs text-[#a8957c]">
              พกพาความก้าวหน้าไปเครื่องอื่นได้ง่ายๆ ไม่ต้องสมัครสมาชิก
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
