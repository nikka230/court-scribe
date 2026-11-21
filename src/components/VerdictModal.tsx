import { useEffect, useMemo, useState } from 'react';
import {
  ArrowsClockwise,
  Books,
  CheckCircle,
  XCircle,
  Target,
  Sparkle,
  SpeakerHigh,
  BookmarkSimple,
  Check,
  Shuffle,
  Sword,
  Copy,
  Trophy,
  CloudCheck,
  Table,
  ShareNetwork,
} from '@phosphor-icons/react';
import type {
  ActiveChallenge,
  CaseDossier,
  SessionResult,
  VocabHint,
} from '../types/game';
import { OFFLINE_DICTIONARY } from '../data/dictionary';
import { speakText } from '../engine/translationService';
import { buildChallengeUrl } from '../engine/challengeService';
import sealImg from '../assets/court-seal.jpg';

interface Props {
  result: SessionResult | null;
  dossier: CaseDossier;
  playerName: string;
  onChangePlayerName: (name: string) => void;
  googleSheetUrl: string;
  sheetSyncStatus: 'idle' | 'syncing' | 'synced' | 'error';
  activeChallenge: ActiveChallenge | null;
  onOpenGoogleSheets: () => void;
  onReplay: () => void;
  onOpenSources: () => void;
  onStartTargetedDrill: (weakChars: string[]) => void;
  onRandomNext: () => void;
  onSaveVocab: (hint: VocabHint) => void;
  isSavedWord: (word: string) => boolean;
}

const GRADE_META: Record<
  SessionResult['grade'],
  { titleTh: string; subtitle: string; color: string; ring: string }
> = {
  S: {
    titleTh: 'ยอดอาลักษณ์แห่งศาลฎีกา!',
    subtitle: 'ความเร็วและความแม่นยำสมบูรณ์แบบ ไร้ที่ติในสำนวน',
    color: 'text-[#ffe48c]',
    ring: 'border-[#f2d583] shadow-[0_0_35px_rgba(242,213,131,0.55)]',
  },
  A: {
    titleTh: 'ผู้ช่วยบันทึกสำนวนดีเด่น',
    subtitle: 'บันทึกถ้อยคำได้ฉับไว แม่นยำ และน่าเชื่อถือสูง',
    color: 'text-[#7be8b3]',
    ring: 'border-[#2ea673] shadow-[0_0_28px_rgba(46,166,115,0.45)]',
  },
  B: {
    titleTh: 'ผ่านมาตรฐานบันทึกประจำศาล',
    subtitle: 'จังหวะดีแล้ว ลองฝึกซ้ำปุ่มที่พลาดเพื่อก้าวสู่ระดับ A/S',
    color: 'text-[#9bc6f7]',
    ring: 'border-[#3d75b5]',
  },
  C: {
    titleTh: 'ต้องฝึกฝนความแม่นยำเพิ่มเติม',
    subtitle: 'ค่อยๆ เน้นวางนิ้วให้ถูกตำแหน่งก่อน แล้วความเร็วจะตามมาเอง',
    color: 'text-[#f29e9e]',
    ring: 'border-[#b83232]',
  },
};

export function VerdictModal({
  result,
  dossier,
  playerName,
  onChangePlayerName,
  googleSheetUrl,
  sheetSyncStatus,
  activeChallenge,
  onOpenGoogleSheets,
  onReplay,
  onOpenSources,
  onStartTargetedDrill,
  onRandomNext,
  onSaveVocab,
  isSavedWord,
}: Props) {
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [challengeCopied, setChallengeCopied] = useState<'none' | 'url' | 'invite'>('none');
  const [generatedUrl, setGeneratedUrl] = useState<string>('');

  useEffect(() => {
    setQuizAnswers({});
    setChallengeCopied('none');
    setGeneratedUrl('');
  }, [result?.id]);

  const quizQuestions = useMemo(() => {
    if (!result || result.language !== 'en' || result.vocabFromSession.length === 0) return [];
    const distractorPool = Object.values(OFFLINE_DICTIONARY).map((v) => v.th);

    return result.vocabFromSession.slice(0, 3).map((item, qIdx) => {
      const wrongs: string[] = [];
      for (let i = 0; i < distractorPool.length && wrongs.length < 3; i++) {
        const pick = distractorPool[(qIdx * 11 + i * 7 + item.word.length * 3) % distractorPool.length];
        if (pick !== item.th && !wrongs.includes(pick)) {
          wrongs.push(pick);
        }
      }
      const options = [item.th, ...wrongs].sort((a, b) => a.localeCompare(b));
      return { item, options };
    });
  }, [result]);

  if (!result) return null;
  const grade = GRADE_META[result.grade];

  const handleCopyChallenge = async (mode: 'url' | 'invite') => {
    const url = await buildChallengeUrl(dossier, result, playerName, googleSheetUrl);
    setGeneratedUrl(url);
    const textToCopy =
      mode === 'url'
        ? url
        : `⚖️ คำท้าดวลพิมพ์สัมผัส Court Scribe จาก "${playerName || 'เสมียนผู้ท้าชิง'}"!\n📜 สำนวน: ${dossier.title}\n⚡ สถิติที่ต้องทำลาย: ${result.wpm} WPM · แม่นยำ ${result.accuracy}% (เกรด ${result.grade})\n👉 กดลิงก์มาวัดฝีมือในสำนวนเดียวกันเลย:\n${url}`;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setChallengeCopied(mode);
      setTimeout(() => setChallengeCopied('none'), 3000);
    } catch {
      // Fallback: keep url visible in input for manual copy
      setChallengeCopied(mode);
    }
  };

  // Judge Duel Outcome if playing from a friend's Challenge Link
  const duelWon =
    activeChallenge &&
    (result.wpm > activeChallenge.targetWpm ||
      (result.wpm === activeChallenge.targetWpm && result.accuracy >= activeChallenge.targetAcc));

  // Build SVG WPM sparkline path
  const sparkline = (() => {
    const pts = result.wpmHistory;
    if (pts.length < 2) return null;
    const w = 320;
    const h = 76;
    const maxWpm = Math.max(20, ...pts.map((p) => p.wpm));
    const coords = pts.map((p, i) => {
      const x = (i / (pts.length - 1)) * (w - 16) + 8;
      const y = h - 10 - (p.wpm / maxWpm) * (h - 20);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    return {
      w,
      h,
      maxWpm,
      polyline: coords.join(' '),
      area: `8,${h - 8} ${coords.join(' ')} ${w - 8},${h - 8}`,
    };
  })();

  const weakChars = result.weakKeys.map((k) => k.char);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="ใบสรุปคำพิพากษาผลการพิมพ์"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/82 p-3 backdrop-blur-sm sm:p-5"
    >
      <div className="brass-panel max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl p-5 sm:p-7">
        {/* Top Verdict Banner + Animated Wax Seal */}
        <div className="flex flex-col items-center gap-5 border-b border-[#d4af37]/25 pb-5 sm:flex-row sm:justify-between">
          <div className="text-center sm:text-left">
            <div className="font-display text-xs font-bold tracking-[0.22em] text-[#f2d583] uppercase">
              COURT VERDICT CERTIFIED · ปิดบันทึกสำนวน
            </div>
            <h2 className={`mt-1 text-2xl font-extrabold sm:text-3xl ${grade.color}`}>
              {grade.titleTh}
            </h2>
            <p className="mt-1 text-xs text-[#cbb89d] sm:text-sm">{grade.subtitle}</p>

            <div className="mt-2.5 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d4af37]/35 bg-[#d4af37]/12 px-3 py-1 text-xs font-bold text-[#f2d583]">
                <Sparkle weight="fill" className="h-3.5 w-3.5" />+{result.xpEarned} XP
              </span>

              {result.isNewPersonalBest && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#68e0a8]/60 bg-[#2ea673]/25 px-3 py-1 text-xs font-extrabold text-[#9effce]">
                  <Trophy weight="fill" className="h-3.5 w-3.5 text-[#ffe07d]" />
                  ทำลายสถิติใหม่!
                  {result.previousBestWpm ? ` (เดิม ${result.previousBestWpm} WPM)` : ''}
                </span>
              )}

              {/* Google Sheets Auto-Sync Status Pill */}
              {googleSheetUrl ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/40 px-3 py-1 text-[11px] font-semibold text-[#cdebd9]">
                  <CloudCheck weight="fill" className="h-3.5 w-3.5 text-[#68e0a8]" />
                  {sheetSyncStatus === 'syncing'
                    ? 'กำลังบันทึกเข้า Google Sheet...'
                    : sheetSyncStatus === 'synced'
                    ? 'บันทึกเข้า Google Sheet แล้ว'
                    : sheetSyncStatus === 'error'
                    ? 'ส่งเข้า Sheet ไม่สำเร็จ (เก็บในเครื่องแล้ว)'
                    : 'เชื่อมต่อ Google Sheet แล้ว'}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={onOpenGoogleSheets}
                  className="inline-flex items-center gap-1 rounded-full border border-[#3d75b5]/45 bg-[#3d75b5]/15 px-3 py-1 text-[11px] font-bold text-[#a8d1ff] hover:bg-[#3d75b5]/25 cursor-pointer"
                >
                  <Table weight="duotone" className="h-3.5 w-3.5" />
                  เชื่อม Google Sheet เก็บสถิติออนไลน์
                </button>
              )}
            </div>
          </div>

          <div className="animate-wax-stamp relative flex h-28 w-28 shrink-0 items-center justify-center">
            <img
              src={sealImg}
              alt="ตราประทับศาล"
              className={`h-full w-full rounded-full border-2 object-cover ${grade.ring}`}
            />
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45">
              <span
                className={`font-display text-5xl font-black drop-shadow-[0_3px_10px_rgba(0,0,0,0.9)] ${grade.color}`}
              >
                {result.grade}
              </span>
            </div>
          </div>
        </div>

        {/* Friend Duel Outcome Banner */}
        {activeChallenge && (
          <div
            className={`mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 ${
              duelWon
                ? 'border-[#68e0a8]/60 bg-gradient-to-r from-[#0e3826] to-[#1a2b1c]'
                : 'border-[#d94141]/55 bg-gradient-to-r from-[#3f1414] to-[#261410]'
            }`}
          >
            <div className="flex items-center gap-3">
              <Sword
                weight="fill"
                className={`h-7 w-7 shrink-0 ${duelWon ? 'text-[#ffe07d]' : 'text-[#ff8a8a]'}`}
              />
              <div>
                <div className={`text-base font-extrabold ${duelWon ? 'text-[#9effce]' : 'text-[#ffbdbd]'}`}>
                  {duelWon
                    ? `ชนะคำท้าดวลของ "${activeChallenge.challengerName}" สำเร็จ!`
                    : `ยังไม่ผ่านคำท้าของ "${activeChallenge.challengerName}" — ลองแก้มืออีกครั้ง!`}
                </div>
                <div className="mt-0.5 text-xs text-[#dfd3c0]">
                  สถิติผู้ท้า: {activeChallenge.targetWpm} WPM ({activeChallenge.targetAcc}%) · สถิติของคุณ:{' '}
                  <span className="font-bold text-[#ffe07d]">
                    {result.wpm} WPM ({result.accuracy}%)
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Core Stats Grid */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="ความเร็ว (WPM)" value={`${result.wpm}`} sub={`${result.cpm} ตัวอักษร/นาที`} highlight />
          <StatTile label="ความแม่นยำ" value={`${result.accuracy}%`} sub={`ผิดพลาด ${result.errorCount} ครั้ง`} />
          <StatTile label="คอมโบสูงสุด" value={`${result.maxCombo}x`} sub={`รวม ${result.correctChars} อักษร`} />
          <StatTile
            label="เวลาที่ใช้"
            value={`${Math.floor(result.durationSec / 60)}:${Math.floor(result.durationSec % 60)
              .toString()
              .padStart(2, '0')}`}
            sub={result.language === 'th' ? 'โหมดภาษาไทย' : 'โหมดภาษาอังกฤษ'}
          />
        </div>

        {/* === SEND CHALLENGE LINK BOX (Item #3) === */}
        <div className="mt-5 rounded-2xl border border-[#d4af37]/45 bg-gradient-to-r from-[#291d10]/95 via-[#1f160e]/95 to-[#291d10]/95 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-bold text-[#f5d87e]">
              <Sword weight="duotone" className="h-5 w-5 text-[#f2d583]" />
              ส่งคำท้าดวล — ก๊อปลิงก์ให้เพื่อนมาพิมพ์สำนวนเดียวกันนี้!
            </div>
            <span className="text-[11px] text-[#bba88e]">
              เพื่อนกดลิงก์แล้วจะได้ข้อความเดียวกันเป๊ะ + แข่งทำลาย {result.wpm} WPM ของคุณ
            </span>
          </div>

          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              type="text"
              value={playerName}
              onChange={(e) => onChangePlayerName(e.target.value)}
              placeholder="ชื่อผู้ท้าชิง (เช่น เสมียนสายฟ้า)"
              maxLength={32}
              className="w-full rounded-xl border border-[#d4af37]/35 bg-black/50 px-3 py-2 text-xs font-semibold text-white placeholder-[#8c7a64] focus:border-[#f2d583] focus:outline-none sm:w-48"
            />
            <button
              type="button"
              onClick={() => handleCopyChallenge('url')}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#e4c25e] to-[#b88f28] px-4 py-2 text-xs font-extrabold text-[#140e07] transition hover:brightness-110 cursor-pointer"
            >
              {challengeCopied === 'url' ? (
                <>
                  <Check weight="bold" className="h-4 w-4" />
                  คัดลอกลิงก์คำท้าเรียบร้อย! ส่งให้เพื่อนได้เลย
                </>
              ) : (
                <>
                  <Copy weight="bold" className="h-4 w-4" />
                  คัดลอกลิงก์คำท้าดวล (URL)
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => handleCopyChallenge('invite')}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#d4af37]/45 bg-[#d4af37]/15 px-3.5 py-2 text-xs font-bold text-[#f2d583] transition hover:bg-[#d4af37]/25 cursor-pointer"
            >
              {challengeCopied === 'invite' ? (
                <>
                  <Check weight="bold" className="h-4 w-4" />
                  ก๊อปข้อความแล้ว!
                </>
              ) : (
                <>
                  <ShareNetwork weight="bold" className="h-4 w-4" />
                  ก๊อปข้อความชวนเพื่อน
                </>
              )}
            </button>
          </div>

          {generatedUrl && (
            <div className="mt-2.5 flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={generatedUrl}
                onFocus={(e) => e.currentTarget.select()}
                className="w-full rounded-lg border border-white/10 bg-black/55 px-2.5 py-1.5 font-mono-num text-[11px] text-[#cbb89d]"
              />
            </div>
          )}
        </div>

        {/* WPM Pace Chart & Weak Keys Heatmap */}
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-[#d4af37]/20 bg-black/35 p-4">
            <div className="flex items-center justify-between text-xs font-bold text-[#f2d583]">
              <span>กราฟจังหวะความเร็ว (WPM Pace)</span>
              {sparkline && (
                <span className="font-mono-num text-[11px] text-[#baa78d]">
                  Peak {sparkline.maxWpm} WPM
                </span>
              )}
            </div>
            {sparkline ? (
              <svg viewBox={`0 0 ${sparkline.w} ${sparkline.h}`} className="mt-2 h-20 w-full">
                <defs>
                  <linearGradient id="wpmFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#d4af37" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#d4af37" stopOpacity="0.02" />
                  </linearGradient>
                </defs>
                <polygon points={sparkline.area} fill="url(#wpmFill)" />
                <polyline
                  points={sparkline.polyline}
                  fill="none"
                  stroke="#f2d583"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <div className="mt-4 text-xs text-[#9d8b74]">
                บันทึกสั้นเกินไปสำหรับแสดงกราฟรายวินาที
              </div>
            )}
          </div>

          <div className="flex flex-col justify-between rounded-xl border border-[#d4af37]/20 bg-black/35 p-4">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#f2d583]">
                <Target weight="duotone" className="h-4 w-4" />
                วิเคราะห์ปุ่มที่พลาดบ่อย (Weak Keys)
              </div>
              {result.weakKeys.length === 0 ? (
                <p className="mt-2 text-xs text-[#7be8b3]">
                  ยอดเยี่ยมมาก! คุณพิมพ์แทบไม่มีข้อผิดพลาดเลยในสำนวนนี้
                </p>
              ) : (
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {result.weakKeys.slice(0, 6).map((wk) => (
                    <div
                      key={wk.char}
                      className="flex items-center gap-1.5 rounded-lg border border-[#d94141]/45 bg-[#3b1515]/70 px-2.5 py-1 text-xs"
                    >
                      <span className="font-mono-num font-bold text-white">
                        {wk.char === ' ' ? 'SPACE' : wk.char}
                      </span>
                      <span className="text-[11px] text-[#ffb8b8]">พลาด {wk.misses}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {result.weakKeys.length > 0 && (
              <button
                type="button"
                onClick={() => onStartTargetedDrill(weakChars)}
                className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#d4af37]/50 bg-[#d4af37]/15 px-3 py-2 text-xs font-bold text-[#f2d583] transition hover:bg-[#d4af37]/25 cursor-pointer"
              >
                <Target weight="bold" className="h-4 w-4" />
                สร้างแบบฝึกหัดซ่อมปุ่มเหล่านี้ทันที!
              </button>
            )}
          </div>
        </div>

        {/* ENGLISH TRANSLATION & VOCABULARY MINI-QUIZ */}
        {quizQuestions.length > 0 && (
          <div className="mt-5 rounded-xl border border-[#2ea673]/35 bg-[#0f241b]/80 p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-bold text-[#88ebb9]">
                แบบทดสอบทบทวนคำศัพท์และคำแปลจากสำนวนนี้ (English Comprehension Check)
              </div>
              <span className="text-[11px] text-[#a9d4be]">เลือกคำแปลภาษาไทยที่ถูกต้อง</span>
            </div>

            <div className="mt-3 space-y-3">
              {quizQuestions.map(({ item, options }) => {
                const picked = quizAnswers[item.word];
                const isCorrect = picked === item.th;
                return (
                  <div
                    key={item.word}
                    className="rounded-xl border border-white/10 bg-black/35 p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-transcript-en text-base font-bold text-[#f2d583]">
                          {item.word}
                        </span>
                        {item.ipa && (
                          <span className="font-mono-num text-xs text-[#cbb89d]">{item.ipa}</span>
                        )}
                        <button
                          type="button"
                          onClick={() => speakText(item.word, 'en', 0.9)}
                          className="rounded bg-white/10 p-1 text-[#f2d583] hover:bg-white/20 cursor-pointer"
                          title="ฟังเสียงออกเสียง"
                        >
                          <SpeakerHigh className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => onSaveVocab(item)}
                        className="inline-flex items-center gap-1 rounded-md border border-[#d4af37]/35 bg-[#d4af37]/10 px-2 py-0.5 text-[11px] font-semibold text-[#f2d583] hover:bg-[#d4af37]/20 cursor-pointer"
                      >
                        {isSavedWord(item.word) ? (
                          <>
                            <Check className="h-3 w-3" /> บันทึกแล้ว
                          </>
                        ) : (
                          <>
                            <BookmarkSimple className="h-3 w-3" /> เก็บศัพท์
                          </>
                        )}
                      </button>
                    </div>

                    <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                      {options.map((opt) => {
                        const selected = picked === opt;
                        const rightOpt = opt === item.th;
                        let btnStyle =
                          'border-white/10 bg-white/5 text-[#e5d9c5] hover:border-[#d4af37]/50';
                        if (picked) {
                          if (rightOpt) {
                            btnStyle = 'border-[#2ea673] bg-[#2ea673]/25 text-[#9effce]';
                          } else if (selected) {
                            btnStyle = 'border-[#d94141] bg-[#d94141]/25 text-[#ffb8b8]';
                          } else {
                            btnStyle = 'border-white/5 bg-white/5 text-[#7a6d5c] opacity-60';
                          }
                        }
                        return (
                          <button
                            key={opt}
                            type="button"
                            disabled={Boolean(picked)}
                            onClick={() =>
                              setQuizAnswers((prev) => ({ ...prev, [item.word]: opt }))
                            }
                            className={`flex items-center justify-between rounded-lg border px-3 py-1.5 text-left text-xs font-medium transition cursor-pointer ${btnStyle}`}
                          >
                            <span>{opt}</span>
                            {picked && rightOpt && (
                              <CheckCircle weight="fill" className="h-4 w-4 shrink-0 text-[#66dfa6]" />
                            )}
                            {picked && selected && !isCorrect && (
                              <XCircle weight="fill" className="h-4 w-4 shrink-0 text-[#f27979]" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex flex-wrap items-center justify-end gap-2.5 border-t border-[#d4af37]/20 pt-4">
          <button
            type="button"
            onClick={onReplay}
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-[#f5efe6] transition hover:bg-white/10 cursor-pointer"
          >
            <ArrowsClockwise weight="bold" className="h-4 w-4" />
            พิมพ์ทำลายสถิติอีกครั้ง
          </button>
          <button
            type="button"
            onClick={onRandomNext}
            className="inline-flex items-center gap-2 rounded-xl border border-[#d4af37]/45 bg-[#d4af37]/15 px-4 py-2.5 text-sm font-bold text-[#f2d583] transition hover:bg-[#d4af37]/25 cursor-pointer"
          >
            <Shuffle weight="bold" className="h-4 w-4" />
            สุ่มสำนวนใหม่ทันที
          </button>
          <button
            type="button"
            onClick={onOpenSources}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-[#e4c25e] to-[#b88f28] px-5 py-2.5 text-sm font-bold text-[#140e07] transition hover:brightness-110 cursor-pointer"
          >
            <Books weight="bold" className="h-4 w-4" />
            เลือกคดี / YouTube / วิกิพีเดีย
          </button>
        </div>
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-3.5 ${
        highlight
          ? 'border-[#d4af37]/50 bg-gradient-to-b from-[#2f2314] to-[#1a130c]'
          : 'border-white/10 bg-black/35'
      }`}
    >
      <div className="text-[11px] font-semibold text-[#bba88e]">{label}</div>
      <div
        className={`mt-1 font-mono-num text-2xl font-extrabold ${
          highlight ? 'text-[#f5d87e]' : 'text-white'
        }`}
      >
        {value}
      </div>
      <div className="mt-0.5 text-[11px] text-[#9e8c73]">{sub}</div>
    </div>
  );
}
