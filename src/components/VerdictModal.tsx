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
} from '@phosphor-icons/react';
import type { SessionResult, VocabHint } from '../types/game';
import { OFFLINE_DICTIONARY } from '../data/dictionary';
import { speakText } from '../engine/translationService';
import sealImg from '../assets/court-seal.jpg';

interface Props {
  result: SessionResult | null;
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
  onReplay,
  onOpenSources,
  onStartTargetedDrill,
  onRandomNext,
  onSaveVocab,
  isSavedWord,
}: Props) {
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    setQuizAnswers({});
  }, [result?.id]);

  // Build interactive English->Thai mini quiz from session vocabulary
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
            <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-[#d4af37]/35 bg-[#d4af37]/12 px-3 py-1 text-xs font-bold text-[#f2d583]">
              <Sparkle weight="fill" className="h-3.5 w-3.5" />+{result.xpEarned} XP ชื่อเสียงเสมียนศาล
            </div>
          </div>

          {/* Animated Wax Seal Stamp with Grade */}
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

        {/* WPM Pace Chart & Weak Keys Heatmap */}
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {/* WPM Pace Sparkline */}
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

          {/* Weakest Keys + Targeted Drill Button */}
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
            พิมพ์สำนวนนี้อีกครั้ง
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
