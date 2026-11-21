import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  SpeakerHigh,
  Translate,
  Eye,
  EyeSlash,
  BookmarkSimple,
  Check,
  Warning,
  Keyboard,
  BookOpenText,
  X,
  Sparkle,
} from '@phosphor-icons/react';
import type {
  CaseDossier,
  PassageLine,
  TranslationMode,
  VocabHint,
} from '../types/game';
import {
  FINGER_META,
  THAI_COMBINING_NAMES,
  isThaiCombiningMark,
  lookupKeyForChar,
} from '../data/keyboardLayouts';
import {
  buildLockedVisualRows,
  type GraphemeCluster,
} from '../engine/typingEngine';
import {
  lookupEnglishWord,
  speakText,
  translateEnToTh,
} from '../engine/translationService';
import sealImg from '../assets/court-seal.jpg';

interface Props {
  dossier: CaseDossier;
  currentLineIdx: number;
  charIndex: number;
  typedChars: string[];
  errorFlash: boolean;
  wrongLayoutWarning: boolean;
  autoLayoutEnabled: boolean;
  onEnableAutoLayout: () => void;
  translationMode: TranslationMode;
  onChangeTranslationMode: (m: TranslationMode) => void;
  ttsRate: number;
  fontSize: 'md' | 'lg' | 'xl';
  isSavedWord: (word: string) => boolean;
  onSaveVocab: (hint: VocabHint) => void;
  onFocusTyping: () => void;
  peekActive: boolean;
  onPeekToggle: (v: boolean) => void;
  onUpdateLineTranslation: (lineId: string, th: string) => void;
  onSeamSpacesChange: (seams: Set<number>) => void;
  onPlayVoice: () => void;
}

export function TranscriptPaper({
  dossier,
  currentLineIdx,
  charIndex,
  typedChars,
  errorFlash,
  wrongLayoutWarning,
  autoLayoutEnabled,
  onEnableAutoLayout,
  translationMode,
  onChangeTranslationMode,
  ttsRate,
  fontSize,
  isSavedWord,
  onSaveVocab,
  onFocusTyping,
  peekActive,
  onPeekToggle,
  onUpdateLineTranslation,
  onSeamSpacesChange,
  onPlayVoice,
}: Props) {
  const [selectedWord, setSelectedWord] = useState<VocabHint | null>(null);
  const [loadingWord, setLoadingWord] = useState(false);
  const [loadingTrans, setLoadingTrans] = useState(false);

  const lineContainerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(960);
  const [computedFont, setComputedFont] = useState('500 24px Sarabun, sans-serif');

  const currentLine: PassageLine | undefined = dossier.lines[currentLineIdx];
  const prevLine: PassageLine | undefined =
    currentLineIdx > 0 ? dossier.lines[currentLineIdx - 1] : undefined;
  const nextLine: PassageLine | undefined =
    currentLineIdx + 1 < dossier.lines.length ? dossier.lines[currentLineIdx + 1] : undefined;

  const lang = dossier.language;

  // Measure actual container width & exact computed font so word-atomic visual rows NEVER split words or wrap unevenly
  useLayoutEffect(() => {
    const el = lineContainerRef.current;
    if (!el) return;

    const measure = () => {
      const w = el.clientWidth;
      if (w > 120) setContainerWidth(w);
      const cs = window.getComputedStyle(el);
      const f = `${cs.fontWeight || '500'} ${cs.fontSize || '24px'} ${cs.fontFamily || 'Sarabun, sans-serif'}`;
      setComputedFont(f);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(measure).catch(() => {});
    }

    return () => ro.disconnect();
  }, [lang, fontSize]);

  // Auto-translate English line via zero-backend translation service if not pre-translated
  useEffect(() => {
    if (lang !== 'en' || !currentLine || currentLine.translationTh) return;
    let cancelled = false;
    setLoadingTrans(true);
    translateEnToTh(currentLine.text)
      .then((th) => {
        if (!cancelled && th) {
          onUpdateLineTranslation(currentLine.id, th);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingTrans(false);
      });
    return () => {
      cancelled = true;
    };
  }, [lang, currentLine?.id, currentLine?.text, currentLine?.translationTh, onUpdateLineTranslation]);

  // Compute LOCKED visual rows (whole words only, ZERO leading/trailing spacebars!)
  const lockedLayout = useMemo(() => {
    if (!currentLine) return { rows: [], seamSpaceIndices: new Set<number>() };
    return buildLockedVisualRows(currentLine.text, lang, containerWidth, computedFont);
  }, [currentLine, lang, containerWidth, computedFont]);

  // Report seam space indices to App.tsx so typing flows smoothly across locked rows without trailing/leading spaces
  useEffect(() => {
    onSeamSpacesChange(lockedLayout.seamSpaceIndices);
  }, [lockedLayout.seamSpaceIndices, onSeamSpacesChange]);

  const charsArray = useMemo(
    () => (currentLine ? Array.from(currentLine.text) : []),
    [currentLine]
  );

  // Determine the next non-seam typable character
  let effectiveNextIdx = charIndex;
  while (
    effectiveNextIdx < charsArray.length &&
    lockedLayout.seamSpaceIndices.has(effectiveNextIdx)
  ) {
    effectiveNextIdx += 1;
  }
  const nextChar = charsArray[effectiveNextIdx] ?? '';
  const nextKeyInfo = useMemo(
    () => (nextChar ? lookupKeyForChar(nextChar, lang) : null),
    [nextChar, lang]
  );

  // Compute English word list for quick-click vocabulary lookup pills
  const activeVocabChips = useMemo(() => {
    if (lang !== 'en' || !currentLine) return [];
    const preset = currentLine.vocab || [];
    const presetSet = new Set(preset.map((v) => v.word.toLowerCase()));
    const rawWords = currentLine.text
      .split(/\s+/)
      .map((w) => w.replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, ''))
      .filter((w) => w.length >= 5 && !presetSet.has(w.toLowerCase()));
    const extra = Array.from(new Set(rawWords.map((w) => w.toLowerCase()))).slice(0, 5);
    return { preset, extra };
  }, [lang, currentLine]);

  const handleInspectWord = async (rawWord: string, presetHint?: VocabHint) => {
    if (presetHint) {
      setSelectedWord(presetHint);
      setLoadingWord(false);
      return;
    }
    setLoadingWord(true);
    setSelectedWord({ word: rawWord, th: 'กำลังค้นหาคำแปลและคำอ่าน...' });
    const info = await lookupEnglishWord(rawWord);
    setSelectedWord(info);
    setLoadingWord(false);
  };

  const fontSizeClass = {
    md: lang === 'th' ? 'text-xl leading-[1.9]' : 'text-lg leading-[1.8]',
    lg: lang === 'th' ? 'text-2xl sm:text-[26px] leading-[1.9]' : 'text-xl sm:text-[22px] leading-[1.8]',
    xl: lang === 'th' ? 'text-3xl sm:text-[31px] leading-[1.85]' : 'text-2xl sm:text-[26px] leading-[1.8]',
  }[fontSize];

  const showTranslation =
    translationMode === 'visible' || (translationMode === 'peek' && peekActive);

  const renderCluster = (c: GraphemeCluster) => {
    const isDone = charIndex >= c.cpEnd;
    const isActive = charIndex >= c.cpStart && charIndex < c.cpEnd;
    const isPartial = isActive && charIndex > c.cpStart;

    if (isDone) {
      const typedSlice = typedChars.slice(c.cpStart, c.cpEnd);
      const isClusterCorrect =
        typedSlice.length === c.chars.length &&
        typedSlice.every((ch, i) => ch === c.chars[i]);

      if (isClusterCorrect) {
        return (
          <span key={c.cpStart} className="text-[#164f36] transition-colors duration-75">
            {c.cluster === ' ' ? '\u00A0' : c.cluster}
          </span>
        );
      }

      const rawTyped = typedSlice.join('');
      const isMistypedSpace = rawTyped === ' ';
      const displayWrong = isMistypedSpace
        ? '\u00A0'
        : isThaiCombiningMark(typedSlice[0] || '')
        ? `◌${rawTyped}`
        : rawTyped;

      return (
        <span
          key={c.cpStart}
          title={`พิมพ์ "${isMistypedSpace ? 'Space' : rawTyped}" (ที่ถูกต้องคือ "${
            c.cluster === ' ' ? 'Space' : c.cluster
          }")`}
          className={`inline-block rounded-sm font-semibold text-[#c91c1c] underline decoration-[#d94141] decoration-2 underline-offset-4 transition-colors duration-75 ${
            isMistypedSpace
              ? 'mx-0.5 min-w-[0.65em] bg-[#d94141]/30'
              : 'bg-[#d94141]/14 px-[1px]'
          }`}
        >
          {displayWrong}
        </span>
      );
    }

    if (isActive) {
      if (isPartial) {
        const typedPrefix = typedChars.slice(c.cpStart, charIndex);
        const prefixHasError = typedPrefix.some((ch, i) => ch !== c.chars[i]);
        const remainingExpected = c.chars.slice(charIndex - c.cpStart);
        const combined = [...typedPrefix, ...remainingExpected].join('');
        const displayPartial = isThaiCombiningMark(typedPrefix[0] || '')
          ? `◌${combined}`
          : combined;

        return (
          <span
            key={c.cpStart}
            className={`relative inline-block rounded px-0.5 transition-all duration-75 ${
              prefixHasError
                ? 'bg-[#d94141]/25 text-[#a81515] ring-2 ring-[#d94141]'
                : 'bg-[#e39d2b] text-[#1a1106] ring-2 ring-[#b8710b]'
            }`}
          >
            {displayPartial}
            <span
              aria-hidden="true"
              className="animate-caret absolute right-0 -bottom-0.5 left-0 h-[3px] rounded-full bg-[#7c1d1d]"
            />
          </span>
        );
      }

      return (
        <span
          key={c.cpStart}
          className="relative inline-block rounded bg-[#d4af37] px-0.5 text-[#140e07] shadow-[0_2px_10px_rgba(184,134,11,0.45)] transition-all duration-75"
        >
          {c.cluster === ' ' ? '\u00A0' : c.cluster}
          <span
            aria-hidden="true"
            className="animate-caret absolute right-0 -bottom-0.5 left-0 h-[3px] rounded-full bg-[#7c1d1d]"
          />
        </span>
      );
    }

    return (
      <span key={c.cpStart} className="text-[#2c2116]/72">
        {c.cluster === ' ' ? '\u00A0' : c.cluster}
      </span>
    );
  };

  return (
    <div
      onClick={onFocusTyping}
      className={`parchment-sheet legal-margin-rule relative overflow-hidden rounded-2xl transition-transform duration-150 ${
        errorFlash ? 'ring-2 ring-[#d94141]' : ''
      }`}
    >
      <img
        src={sealImg}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full opacity-[0.09] mix-blend-multiply select-none"
      />

      {/* Top Official Legal Record Header Bar */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 border-b border-[#c9b283]/80 bg-[#e9dcc0]/70 py-2 pr-4 pl-14 text-xs text-[#4a3926]">
        <div className="flex items-center gap-2 font-semibold">
          <span className="font-display tracking-[0.14em] uppercase text-[#7c2323]">
            OFFICIAL COURT TRANSCRIPT
          </span>
          <span className="text-[#8a7558]">•</span>
          <span>บันทึกถ้อยคำฉบับทางการ</span>
        </div>

        {/* Next Keystroke Micro-Callout */}
        {nextChar && nextKeyInfo && (
          <div className="flex items-center gap-2 rounded-full border border-[#a88321]/50 bg-[#fff8e6] px-3 py-0.5 text-[12px] font-semibold text-[#2d2011] shadow-sm">
            <span className="text-[#7d623b]">ปุ่มถัดไป:</span>
            <span className="inline-flex items-center gap-1 rounded bg-[#231911] px-2 py-0.5 font-mono-num text-[#f5d87e]">
              {nextKeyInfo.needsShift && (
                <span className="text-[10px] font-bold text-[#ff8e8e]">SHIFT +</span>
              )}
              {nextChar === ' '
                ? 'SPACE'
                : THAI_COMBINING_NAMES[nextChar]
                ? `◌${nextChar} (${THAI_COMBINING_NAMES[nextChar]})`
                : nextChar}
            </span>
            <span
              className="hidden items-center gap-1 text-[11px] font-semibold sm:inline-flex"
              style={{ color: '#5c4218' }}
            >
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: FINGER_META[nextKeyInfo.keyDef.finger].color }}
              />
              {FINGER_META[nextKeyInfo.keyDef.finger].nameTh}
            </span>
          </div>
        )}
      </div>

      {/* Wrong Keyboard Layout Smart Helper Alert */}
      {wrongLayoutWarning && !autoLayoutEnabled && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative z-20 flex flex-wrap items-center justify-between gap-2 border-b border-[#b83232]/40 bg-[#4d1414] px-4 py-2 pl-14 text-xs text-[#ffeded]"
        >
          <div className="flex items-center gap-2">
            <Warning weight="fill" className="h-4 w-4 shrink-0 text-[#f2d583]" />
            <span>
              {lang === 'th'
                ? 'ดูเหมือนแป้นพิมพ์คอมพิวเตอร์ของคุณยังเป็นภาษาอังกฤษ! กด Alt+Shift หรือ Win+Space เพื่อสลับเป็นไทย'
                : 'ดูเหมือนแป้นพิมพ์คอมพิวเตอร์ของคุณยังเป็นภาษาไทย! กด Alt+Shift หรือ Win+Space เพื่อสลับเป็นอังกฤษ'}
            </span>
          </div>
          <button
            type="button"
            onClick={onEnableAutoLayout}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#d4af37] px-3 py-1 font-bold text-[#17110a] transition hover:bg-[#f2d583] cursor-pointer"
          >
            <Keyboard weight="bold" className="h-3.5 w-3.5" />
            เปิดโหมดพิมพ์ได้เลยไม่ต้องสลับภาษา
          </button>
        </div>
      )}

      {/* Main Ruled Transcript Lines */}
      <div className="relative z-10 space-y-3 py-5 pr-5 pl-14 sm:pr-7">
        {/* Previous completed line */}
        {prevLine && (
          <div className="flex items-baseline gap-3 opacity-55">
            <span className="font-mono-num -ml-10 w-6 shrink-0 text-right text-[11px] font-semibold text-[#8c7456]">
              {String(currentLineIdx).padStart(2, '0')}
            </span>
            <p
              className={`truncate text-sm text-[#3c3022] line-through decoration-[#2ea673]/50 ${
                lang === 'th' ? 'font-transcript-th' : 'font-transcript-en'
              }`}
            >
              {prevLine.text}
            </p>
          </div>
        )}

        {/* Active Typing Sentence — LOCKED Word-Atomic Visual Rows (ZERO broken words, ZERO leading/trailing spacebar!) */}
        {currentLine && (
          <div className="relative flex items-start gap-3">
            <span className="font-mono-num -ml-10 mt-1.5 w-6 shrink-0 text-right text-xs font-bold text-[#9e2b2b]">
              {String(currentLineIdx + 1).padStart(2, '0')}
            </span>

            <div
              ref={lineContainerRef}
              className={`min-h-[3.5rem] flex-1 space-y-1.5 overflow-hidden select-none ${fontSizeClass} ${
                lang === 'th' ? 'font-transcript-th font-medium' : 'font-transcript-en font-medium'
              }`}
            >
              {lockedLayout.rows.map((rowTokens, rIdx) => (
                <div
                  key={rIdx}
                  className="flex flex-nowrap items-baseline whitespace-nowrap"
                >
                  {rowTokens.map((tok) => (
                    <span
                      key={tok.cpStart}
                      className="inline-flex flex-nowrap items-baseline whitespace-nowrap"
                    >
                      {tok.clusters.map(renderCluster)}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Next Line Preview */}
        {nextLine && (
          <div className="flex items-baseline gap-3 pt-1 opacity-45">
            <span className="font-mono-num -ml-10 w-6 shrink-0 text-right text-[11px] font-semibold text-[#8c7456]">
              {String(currentLineIdx + 2).padStart(2, '0')}
            </span>
            <p
              className={`line-clamp-1 text-sm text-[#4a3b2a] ${
                lang === 'th' ? 'font-transcript-th' : 'font-transcript-en'
              }`}
            >
              {nextLine.text}
            </p>
          </div>
        )}
      </div>

      {/* ENGLISH READING & TRANSLATION PRACTICE DOCK */}
      {lang === 'en' && currentLine && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative z-10 border-t border-[#c4aa79] bg-[#eadcc0]/85 px-4 py-3 pl-14"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-[#231911] px-2.5 py-1 text-[11px] font-bold tracking-wide text-[#f2d583]">
                <Translate weight="bold" className="h-3.5 w-3.5" />
                ฝึกอ่าน-ฝึกแปล (EN → TH)
              </span>

              <div className="inline-flex overflow-hidden rounded-lg border border-[#b39869] bg-[#f7efde] text-[11px] font-semibold">
                {(
                  [
                    { id: 'visible', label: 'เปิดคำแปล' },
                    { id: 'peek', label: 'ซ่อน (กด Tab แอบดู)' },
                    { id: 'blind', label: 'ปิดคำแปล' },
                  ] as const
                ).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => onChangeTranslationMode(m.id)}
                    className={`px-2.5 py-1 transition cursor-pointer ${
                      translationMode === m.id
                        ? 'bg-[#2a1e14] text-[#f5d87e]'
                        : 'text-[#54412c] hover:bg-[#e5d4b3]'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {translationMode === 'peek' && (
                <button
                  type="button"
                  onMouseDown={() => onPeekToggle(true)}
                  onMouseUp={() => onPeekToggle(false)}
                  onMouseLeave={() => onPeekToggle(false)}
                  onClick={() => onPeekToggle(!peekActive)}
                  className="inline-flex items-center gap-1 rounded-lg border border-[#a88321]/60 bg-[#fff8e7] px-2.5 py-1 text-xs font-semibold text-[#3b2912] hover:bg-[#f2e2be] cursor-pointer"
                >
                  {peekActive ? <EyeSlash className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  {peekActive ? 'ซ่อนคำแปล' : 'แอบดูคำแปล'}
                </button>
              )}
              <button
                type="button"
                onClick={onPlayVoice}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#3a6ea5]/45 bg-[#eef5fc] px-2.5 py-1 text-xs font-semibold text-[#1e4670] transition hover:bg-[#dcebfa] cursor-pointer"
                title="ฟังเสียงตัวละครอ่านภาษาอังกฤษประโยคนี้"
              >
                <SpeakerHigh weight="duotone" className="h-4 w-4" />
                ฟังเสียงอ่าน
              </button>
            </div>
          </div>

          <div className="mt-2.5 rounded-xl border border-[#cbb487] bg-[#fcf7eb]/90 px-3.5 py-2.5 text-sm text-[#2c2014]">
            {translationMode === 'blind' ? (
              <span className="italic text-[#7a674d]">
                โหมดท้าทายการอ่านด้วยตนเอง — ลองแปลประโยคภาษาอังกฤษในใจระหว่างพิมพ์ หรือคลิกที่คำศัพท์ด้านล่างเพื่อเช็กคำแปลเฉพาะคำ
              </span>
            ) : showTranslation ? (
              loadingTrans ? (
                <span className="inline-flex items-center gap-2 text-[#7a623c]">
                  <Sparkle className="h-4 w-4 animate-spin" />
                  กำลังแปลประโยคเป็นภาษาไทยอัตโนมัติ...
                </span>
              ) : currentLine.translationTh ? (
                <span className="font-medium leading-relaxed">{currentLine.translationTh}</span>
              ) : (
                <span className="text-[#7a674d]">
                  คลิกที่คำศัพท์ด้านล่างเพื่อดูความหมายภาษาไทยและคำอ่าน IPA
                </span>
              )
            ) : (
              <button
                type="button"
                onClick={() => onPeekToggle(true)}
                className="flex w-full items-center justify-between text-left text-[#7a623c] hover:text-[#3d2b12] cursor-pointer"
              >
                <span>ลองอ่านและแปลประโยคนี้ด้วยตัวเองก่อน — กด Tab หรือคลิกที่นี่เพื่อดูเฉลยคำแปล</span>
                <Eye weight="duotone" className="h-4 w-4 shrink-0" />
              </button>
            )}
          </div>

          {!Array.isArray(activeVocabChips) && (
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#665136]">
                <BookOpenText weight="duotone" className="h-3.5 w-3.5" />
                คลิกเจาะคำศัพท์:
              </span>
              {activeVocabChips.preset.map((v) => (
                <button
                  key={v.word}
                  type="button"
                  onClick={() => handleInspectWord(v.word, v)}
                  className="inline-flex items-center gap-1 rounded-full border border-[#b8860b]/55 bg-[#fff5d6] px-2.5 py-0.5 text-xs font-semibold text-[#3b290c] transition hover:bg-[#f2d583] cursor-pointer"
                >
                  <span>{v.word}</span>
                  <span className="text-[10px] text-[#7a5b1e]">· {v.th.split(',')[0]}</span>
                </button>
              ))}
              {activeVocabChips.extra.map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => handleInspectWord(w)}
                  className="rounded-full border border-[#cbb487] bg-[#f7efde] px-2.5 py-0.5 text-xs font-medium text-[#4a3925] transition hover:border-[#a88321] hover:bg-[#fff6dc] cursor-pointer"
                >
                  {w}
                </button>
              ))}
            </div>
          )}

          {selectedWord && (
            <div className="mt-2.5 flex flex-wrap items-start justify-between gap-3 rounded-xl border border-[#d4af37] bg-[#1a130e] p-3.5 text-[#f5efe6] shadow-xl">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-transcript-en text-base font-bold text-[#f2d583]">
                    {selectedWord.word}
                  </span>
                  {selectedWord.ipa && (
                    <span className="font-mono-num text-xs text-[#cbb89d]">{selectedWord.ipa}</span>
                  )}
                  {selectedWord.pos && (
                    <span className="rounded bg-[#d4af37]/20 px-1.5 py-0.5 text-[10px] font-semibold text-[#f2d583]">
                      {selectedWord.pos}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => speakText(selectedWord.word, 'en', Math.min(1, ttsRate))}
                    className="inline-flex items-center gap-1 rounded bg-white/10 px-2 py-0.5 text-[11px] text-[#f5efe6] hover:bg-white/20 cursor-pointer"
                  >
                    <SpeakerHigh weight="fill" className="h-3 w-3 text-[#f2d583]" />
                    ออกเสียง
                  </button>
                </div>
                <div className="mt-1 text-sm font-semibold text-[#79e3b1]">
                  {loadingWord ? 'กำลังค้นหาคำแปล...' : selectedWord.th}
                </div>
                {selectedWord.definition && (
                  <p className="mt-1 text-xs text-[#cbb89d]">{selectedWord.definition}</p>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                {!loadingWord && (
                  <button
                    type="button"
                    onClick={() => onSaveVocab(selectedWord)}
                    className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                      isSavedWord(selectedWord.word)
                        ? 'border border-[#2ea673] bg-[#2ea673]/20 text-[#79e3b1]'
                        : 'bg-[#d4af37] text-[#17110a] hover:bg-[#f2d583]'
                    }`}
                  >
                    {isSavedWord(selectedWord.word) ? (
                      <>
                        <Check weight="bold" className="h-3.5 w-3.5" />
                        บันทึกแล้ว
                      </>
                    ) : (
                      <>
                        <BookmarkSimple weight="fill" className="h-3.5 w-3.5" />
                        เก็บเข้าสมุดศัพท์
                      </>
                    )}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedWord(null)}
                  aria-label="ปิดหน้าต่างคำศัพท์"
                  className="rounded-lg p-1.5 text-[#b8a68e] hover:bg-white/10 hover:text-white cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
