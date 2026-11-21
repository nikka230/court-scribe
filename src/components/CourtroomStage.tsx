import { useState } from 'react';
import {
  Gavel,
  Flame,
  Gauge,
  Target,
  YoutubeLogo,
  ArrowsClockwise,
  Eye,
  EyeSlash,
  Scales,
  Sparkle,
  SpeakerHigh,
  StopCircle,
  Waveform,
  Sword,
  Trophy,
} from '@phosphor-icons/react';
import type {
  ActiveChallenge,
  CaseDossier,
  GameMode,
  PassageLine,
  SpeakerRole,
} from '../types/game';
import { CHARACTER_VOICE_META } from '../engine/voiceEngine';
import judgeImg from '../assets/char-judge.jpg';
import prosecutorImg from '../assets/char-prosecutor.jpg';
import defenseImg from '../assets/char-defense.jpg';
import witnessImg from '../assets/char-witness.jpg';

const PORTRAIT_MAP: Record<
  SpeakerRole,
  { img: string; titleTh: string; titleEn: string; accent: string; ring: string }
> = {
  judge: {
    img: judgeImg,
    titleTh: 'ท่านผู้พิพากษา',
    titleEn: 'Presiding Judge',
    accent: 'text-[#f2d583]',
    ring: 'border-[#d4af37]',
  },
  prosecutor: {
    img: prosecutorImg,
    titleTh: 'พนักงานอัยการ',
    titleEn: 'Prosecutor',
    accent: 'text-[#f28b8b]',
    ring: 'border-[#c43b3b]',
  },
  defense: {
    img: defenseImg,
    titleTh: 'ทนายฝ่ายจำเลย',
    titleEn: 'Defense Counsel',
    accent: 'text-[#8cbcf2]',
    ring: 'border-[#4a80c4]',
  },
  witness: {
    img: witnessImg,
    titleTh: 'พยานเบิกความ',
    titleEn: 'Key Witness',
    accent: 'text-[#7fd9ad]',
    ring: 'border-[#3aa374]',
  },
};

interface Props {
  dossier: CaseDossier;
  currentLine: PassageLine | undefined;
  currentLineIdx: number;
  wpm: number;
  accuracy: number;
  combo: number;
  patience: number;
  gameMode: GameMode;
  lastHitState: 'idle' | 'hit' | 'miss';
  progressPct: number;
  isSpeaking: boolean;
  autoplayBlocked: boolean;
  autoVoiceEnabled: boolean;
  voiceRate: number;
  onPlayVoice: () => void;
  onStopVoice: () => void;
  onToggleAutoVoice: () => void;
  onChangeVoiceRate: (rate: number) => void;
  activeChallenge: ActiveChallenge | null;
  personalBestWpm: number;
}

export function CourtroomStage({
  dossier,
  currentLine,
  currentLineIdx,
  wpm,
  accuracy,
  combo,
  patience,
  gameMode,
  lastHitState,
  progressPct,
  isSpeaking,
  autoplayBlocked,
  autoVoiceEnabled,
  voiceRate,
  onPlayVoice,
  onStopVoice,
  onToggleAutoVoice,
  onChangeVoiceRate,
  activeChallenge,
  personalBestWpm,
}: Props) {
  const [showYoutubeVideo, setShowYoutubeVideo] = useState(true);
  const [ytSeekNonce, setYtSeekNonce] = useState(0);

  const role: SpeakerRole = currentLine?.speaker || 'witness';
  const portrait = PORTRAIT_MAP[role];
  const voiceMeta = CHARACTER_VOICE_META[role];

  const hasYoutube = Boolean(dossier.youtubeId);
  const activeStartSec = currentLine?.startSec ?? 0;

  let moodNote =
    dossier.language === 'th'
      ? 'กำลังเบิกความ — ฟังเสียงตัวละครและจดบันทึกตามได้เลย'
      : 'Live Testimony — Listen & transcribe with clarity';
  if (combo >= 40) {
    moodNote =
      dossier.language === 'th'
        ? 'สุดยอด! จังหวะการบันทึกแม่นยำระดับศาลฎีกา!'
        : 'Remarkable cadence! Supreme Court stenographer pace!';
  } else if (combo >= 18) {
    moodNote =
      dossier.language === 'th'
        ? 'ยอดเยี่ยม! รักษาจังหวะคอมโบต่อเนื่องไว้'
        : 'Excellent flow! Keep your fingers centered on home row.';
  } else if (lastHitState === 'miss') {
    moodNote =
      dossier.language === 'th'
        ? 'ใจเย็นๆ! กด Backspace แก้ตัวสีแดง หรือพิมพ์ต่อไปได้เลย'
        : 'Steady now — Backspace fixes red typos or keep flowing.';
  }

  const youtubeEmbedSrc = dossier.youtubeId
    ? `https://www.youtube-nocookie.com/embed/${dossier.youtubeId}?start=${activeStartSec}&rel=0&modestbranding=1&_sync=${ytSeekNonce}`
    : '';

  return (
    <section className="brass-panel-glass relative overflow-hidden rounded-2xl p-3.5 sm:p-4">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#f2d583]/60 to-transparent"
      />

      {/* Active Friend Challenge Duel Banner */}
      {activeChallenge && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#f2d583]/50 bg-gradient-to-r from-[#4a1212]/90 via-[#381d0c]/90 to-[#4a1212]/90 px-3.5 py-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-[#fff3cc]">
            <Sword weight="fill" className="h-4 w-4 text-[#f2d583]" />
            <span>
              คำท้าดวลจาก <span className="text-[#ffe07d]">{activeChallenge.challengerName}</span>!
            </span>
          </div>
          <div className="flex items-center gap-3 font-mono-num text-xs font-bold">
            <span className="text-[#ffd27d]">เป้าที่ต้องทำลาย: {activeChallenge.targetWpm} WPM</span>
            <span className="text-[#88ebb9]">แม่นยำ {activeChallenge.targetAcc}%</span>
            <span className="rounded bg-[#d4af37]/25 px-2 py-0.5 text-[#ffe699]">
              เกรด {activeChallenge.targetGrade}
            </span>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Left: Character Portrait + Active Case & Speaker Voice Bar */}
        <div className="flex min-w-0 items-center gap-3.5">
          <div className="relative shrink-0">
            <div
              className={`relative h-16 w-16 overflow-hidden rounded-xl border-2 bg-[#16110d] transition-all duration-200 sm:h-20 sm:w-20 ${
                portrait.ring
              } ${
                isSpeaking
                  ? 'shadow-[0_0_26px_rgba(242,213,131,0.72)] ring-2 ring-[#f2d583]/70'
                  : combo >= 20
                  ? 'shadow-[0_0_24px_rgba(212,175,55,0.55)]'
                  : lastHitState === 'miss'
                  ? 'shadow-[0_0_22px_rgba(217,65,65,0.55)]'
                  : 'shadow-[0_6px_18px_rgba(0,0,0,0.65)]'
              }`}
            >
              <img
                src={portrait.img}
                alt={currentLine?.speakerName || portrait.titleEn}
                className="h-full w-full object-cover"
              />
              {/* Animated speaking waveform badge on portrait */}
              {isSpeaking && (
                <div
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-0 flex items-end justify-center gap-0.5 bg-gradient-to-t from-black/85 to-transparent pb-1 pt-2"
                >
                  <span className="h-2.5 w-1 animate-pulse rounded-full bg-[#f2d583]" />
                  <span className="h-4 w-1 animate-bounce rounded-full bg-[#ffe89e]" />
                  <span className="h-3 w-1 animate-pulse rounded-full bg-[#f2d583]" />
                  <span className="h-4 w-1 animate-bounce rounded-full bg-[#ffe89e]" />
                </div>
              )}
              <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-white/10" />
            </div>

            {combo >= 10 && (
              <div className="absolute -right-1.5 -bottom-1.5 flex items-center gap-0.5 rounded-full border border-[#fff1c2] bg-gradient-to-r from-[#b8860b] to-[#e0b844] px-1.5 py-0.5 text-[10px] font-bold text-[#140e07] shadow-lg">
                <Flame weight="fill" className="h-3 w-3" />
                <span className="font-mono-num">{combo}</span>
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded border border-[#d4af37]/40 bg-[#d4af37]/12 px-2 py-0.5 font-mono-num text-[11px] font-semibold tracking-wider text-[#f2d583]">
                <Scales weight="duotone" className="h-3.5 w-3.5" aria-hidden="true" />
                {dossier.caseCode}
              </span>
              <span className="rounded bg-white/8 px-2 py-0.5 text-[11px] font-semibold text-[#e6d7be]">
                {dossier.language === 'th' ? 'ภาษาไทย · เกษมณี' : 'ENGLISH · อ่าน-แปล'}
              </span>
              <span className={`text-xs font-semibold ${portrait.accent}`}>
                {currentLine?.speakerName ||
                  (dossier.language === 'th' ? portrait.titleTh : portrait.titleEn)}
              </span>
              {personalBestWpm > 0 && (
                <span className="inline-flex items-center gap-1 rounded bg-[#2ea673]/20 px-2 py-0.5 font-mono-num text-[10px] font-bold text-[#88ebb9]">
                  <Trophy weight="fill" className="h-3 w-3" />
                  สถิติเดิม {personalBestWpm} WPM
                </span>
              )}
            </div>

            <h2 className="mt-1 truncate text-base font-bold text-[#fff8eb] sm:text-lg">
              {dossier.title}
            </h2>

            {/* Character Voice Playback Controls Bar */}
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={isSpeaking ? onStopVoice : onPlayVoice}
                title="เล่น/หยุดเสียงพากย์ตัวละคร (กด F2)"
                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-bold transition cursor-pointer ${
                  isSpeaking
                    ? 'border-[#f2d583] bg-[#d4af37] text-[#140e07] shadow-[0_0_12px_rgba(242,213,131,0.5)]'
                    : autoplayBlocked
                    ? 'animate-pulse border-[#f2d583] bg-[#d4af37]/25 text-[#fff1c2]'
                    : 'border-[#d4af37]/40 bg-[#d4af37]/14 text-[#f5d87e] hover:bg-[#d4af37]/25'
                }`}
              >
                {isSpeaking ? (
                  <>
                    <StopCircle weight="fill" className="h-3.5 w-3.5" />
                    กำลังอ่านเสียง ({voiceMeta.badgeTh.split('·')[0].trim()})
                  </>
                ) : (
                  <>
                    <SpeakerHigh weight="fill" className="h-3.5 w-3.5" />
                    {autoplayBlocked ? 'กดเพื่อเริ่มเสียงพากย์ (F2)' : 'เล่นเสียงพากย์ (F2)'}
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onToggleAutoVoice}
                className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-semibold transition cursor-pointer ${
                  autoVoiceEnabled
                    ? 'border-[#2ea673]/50 bg-[#2ea673]/18 text-[#88ebb9]'
                    : 'border-white/15 bg-white/5 text-[#a8957c]'
                }`}
                title="เปิด/ปิด การเล่นเสียงตัวละครอัตโนมัติทุกประโยค"
              >
                <Waveform weight="bold" className="h-3 w-3" />
                {autoVoiceEnabled ? 'เสียงอัตโนมัติ: เปิด' : 'เสียงอัตโนมัติ: ปิด'}
              </button>

              <div className="inline-flex overflow-hidden rounded-lg border border-white/12 bg-black/40 text-[10px] font-semibold">
                {[0.85, 1.0, 1.15].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => onChangeVoiceRate(r)}
                    className={`px-1.5 py-1 transition cursor-pointer ${
                      Math.abs(voiceRate - r) < 0.03
                        ? 'bg-[#d4af37]/80 text-[#140e07]'
                        : 'text-[#bba88e] hover:bg-white/10'
                    }`}
                  >
                    {r}x
                  </button>
                ))}
              </div>

              <span className="hidden text-[11px] text-[#baa78d] xl:inline">· {moodNote}</span>
            </div>

            {/* Case Progress Bar */}
            <div className="mt-2 flex items-center gap-2.5">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/50 ring-1 ring-[#d4af37]/20">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#9d7a2c] via-[#d4af37] to-[#f7de93] transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(2, progressPct))}%` }}
                />
              </div>
              <span className="font-mono-num text-[11px] font-medium text-[#d4c2a6]">
                ประโยค {Math.min(currentLineIdx + 1, dossier.lines.length)}/{dossier.lines.length}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Live Courtroom Telemetry Gauges */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 lg:shrink-0">
          <div className="flex min-w-[82px] flex-col rounded-xl border border-[#d4af37]/25 bg-black/35 px-3 py-1.5">
            <div className="flex items-center gap-1 text-[10px] font-semibold tracking-wider text-[#bda98c] uppercase">
              <Gauge weight="duotone" className="h-3.5 w-3.5 text-[#f2d583]" aria-hidden="true" />
              WPM
            </div>
            <div className="font-mono-num text-xl font-bold leading-tight text-[#fff5df]">
              {wpm}
            </div>
          </div>

          <div className="flex min-w-[86px] flex-col rounded-xl border border-[#d4af37]/25 bg-black/35 px-3 py-1.5">
            <div className="flex items-center gap-1 text-[10px] font-semibold tracking-wider text-[#bda98c] uppercase">
              <Target weight="duotone" className="h-3.5 w-3.5 text-[#52c994]" aria-hidden="true" />
              แม่นยำ
            </div>
            <div
              className={`font-mono-num text-xl font-bold leading-tight ${
                accuracy >= 95
                  ? 'text-[#66dfa6]'
                  : accuracy >= 85
                  ? 'text-[#f2d583]'
                  : 'text-[#f27979]'
              }`}
            >
              {accuracy}%
            </div>
          </div>

          <div className="flex min-w-[82px] flex-col rounded-xl border border-[#d4af37]/25 bg-black/35 px-3 py-1.5">
            <div className="flex items-center gap-1 text-[10px] font-semibold tracking-wider text-[#bda98c] uppercase">
              <Flame weight="duotone" className="h-3.5 w-3.5 text-[#f29b4b]" aria-hidden="true" />
              คอมโบ
            </div>
            <div className="font-mono-num text-xl font-bold leading-tight text-[#ffd773]">
              {combo}x
            </div>
          </div>

          <div className="flex min-w-[122px] flex-col rounded-xl border border-[#d4af37]/25 bg-black/35 px-3 py-1.5">
            <div className="flex items-center justify-between gap-1 text-[10px] font-semibold tracking-wider text-[#bda98c] uppercase">
              <span className="inline-flex items-center gap-1">
                {gameMode === 'trial' ? (
                  <Gavel weight="duotone" className="h-3.5 w-3.5 text-[#e87a7a]" aria-hidden="true" />
                ) : (
                  <Sparkle weight="duotone" className="h-3.5 w-3.5 text-[#66dfa6]" aria-hidden="true" />
                )}
                {gameMode === 'trial' ? 'ความนิ่งศาล' : 'โหมดฝึกอิสระ'}
              </span>
              {gameMode === 'trial' && (
                <span className="font-mono-num text-[#f2d583]">{Math.round(patience)}%</span>
              )}
            </div>
            {gameMode === 'trial' ? (
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    patience > 60
                      ? 'bg-gradient-to-r from-[#2ea673] to-[#68e0a8]'
                      : patience > 30
                      ? 'bg-gradient-to-r from-[#c98b24] to-[#f2d583]'
                      : 'bg-gradient-to-r from-[#9c2323] to-[#f25c5c]'
                  }`}
                  style={{ width: `${Math.max(4, Math.min(100, patience))}%` }}
                />
              </div>
            ) : (
              <div className="mt-0.5 text-xs font-semibold text-[#7ee0b4]">ZEN PRACTICE</div>
            )}
          </div>

          {hasYoutube && (
            <button
              type="button"
              onClick={() => setShowYoutubeVideo((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#d94141]/45 bg-[#d94141]/15 px-3 py-2 text-xs font-semibold text-[#ffbdbd] transition hover:bg-[#d94141]/25 cursor-pointer"
              title="เปิด/ซ่อนจอวิดีโอพยาน YouTube"
            >
              <YoutubeLogo weight="fill" className="h-4 w-4 text-[#ff5c5c]" />
              {showYoutubeVideo ? <EyeSlash className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>
      </div>

      {hasYoutube && showYoutubeVideo && (
        <div className="mt-3 flex flex-col gap-3 rounded-xl border border-[#d4af37]/30 bg-[#0d0907]/90 p-2.5 sm:flex-row sm:items-center">
          <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-[#d4af37]/40 bg-black sm:w-64 sm:shrink-0">
            <iframe
              key={`${dossier.youtubeId}-${ytSeekNonce}`}
              src={youtubeEmbedSrc}
              title="YouTube Witness Feed"
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <div className="flex flex-1 flex-col justify-between gap-2 text-xs">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-[#f2d583] uppercase">
                <YoutubeLogo weight="fill" className="h-4 w-4 text-[#ff5c5c]" />
                LIVE WITNESS VIDEO FEED · หลักฐานวิดีโอ
              </div>
              <p className="mt-1 text-[#d7c6ae]">
                เปิดฟังเสียงจากคลิป YouTube ควบคู่ไปกับการพิมพ์ตามคำบรรยายได้เลย!
                {currentLine?.startSec !== undefined && (
                  <span className="ml-1.5 text-[#f2d583]">
                    (ช่วงเวลาประโยคนี้: {Math.floor(currentLine.startSec / 60)}:
                    {(currentLine.startSec % 60).toString().padStart(2, '0')})
                  </span>
                )}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {currentLine?.startSec !== undefined && (
                <button
                  type="button"
                  onClick={() => setYtSeekNonce((n) => n + 1)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#d4af37]/45 bg-[#d4af37]/15 px-3 py-1.5 text-xs font-semibold text-[#f7de93] transition hover:bg-[#d4af37]/25 cursor-pointer"
                >
                  <ArrowsClockwise weight="bold" className="h-3.5 w-3.5" />
                  เลื่อนคลิปไปเวลาประโยคปัจจุบัน ({Math.floor(activeStartSec / 60)}:
                  {(activeStartSec % 60).toString().padStart(2, '0')})
                </button>
              )}
              {dossier.sourceUrl && (
                <a
                  href={dossier.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs text-[#d6c7b2] hover:bg-white/10"
                >
                  เปิดต้นฉบับบน YouTube
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
