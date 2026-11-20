import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Books,
  Shuffle,
  BookmarkSimple,
  Medal,
  GearSix,
  SpeakerHigh,
  SpeakerSlash,
  ArrowsClockwise,
  Keyboard,
  YoutubeLogo,
  GlobeHemisphereWest,
  SpinnerGap,
} from '@phosphor-icons/react';
import type {
  CaseDossier,
  CourtShout,
  Language,
  SessionResult,
  UserProfile,
  UserSettings,
  VocabHint,
  WpmSample,
} from './types/game';
import { BUILT_IN_CASES, OFFLINE_RANDOM_GEMS } from './data/builtInCases';
import {
  isWrongKeyboardLayout,
  mapPhysicalKeyToChar,
} from './data/keyboardLayouts';
import { lookupOfflineWord } from './data/dictionary';
import { audioEngine } from './engine/audioEngine';
import {
  buildTargetedWeakKeyDrill,
  computeSpeedMetrics,
  computeVerdictGrade,
  normalizeTypableText,
} from './engine/typingEngine';
import { loadRandomWikipediaCase } from './engine/contentLoaders';
import { speakText, stopSpeaking } from './engine/translationService';
import {
  getRankForXp,
  loadProfile,
  loadSettings,
  recordSessionToProfile,
  saveProfile,
  saveSettings,
  upsertVocabInProfile,
} from './engine/storage';
import { AmbientCanvas, type AmbientCanvasHandle } from './components/AmbientCanvas';
import { CourtShoutOverlay } from './components/CourtShoutOverlay';
import { CourtroomStage } from './components/CourtroomStage';
import { TranscriptPaper } from './components/TranscriptPaper';
import { VirtualKeyboard } from './components/VirtualKeyboard';
import { SourcePickerModal } from './components/SourcePickerModal';
import { VerdictModal } from './components/VerdictModal';
import { VocabNotebookModal } from './components/VocabNotebookModal';
import { ProfileStatsModal } from './components/ProfileStatsModal';
import { SettingsModal } from './components/SettingsPopover';

import courtroomBg from './assets/courtroom-bg.jpg';
import sealImg from './assets/court-seal.jpg';

function normalizeDossier(raw: CaseDossier): CaseDossier {
  return {
    ...raw,
    lines: raw.lines.map((l) => ({
      ...l,
      text: normalizeTypableText(l.text),
    })),
  };
}

export function App() {
  const [profile, setProfile] = useState<UserProfile>(() => loadProfile());
  const [settings, setSettings] = useState<UserSettings>(() => loadSettings());

  // Default starting dossier: flagship English Courtroom Testimony with Thai translations
  const [dossier, setDossier] = useState<CaseDossier>(() =>
    normalizeDossier(BUILT_IN_CASES[0])
  );

  // Typing session live state
  const [currentLineIdx, setCurrentLineIdx] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [correctChars, setCorrectChars] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [patience, setPatience] = useState(100);
  const [errorFlash, setErrorFlash] = useState(false);
  const [gavelShake, setGavelShake] = useState(false);
  const [wrongLayoutWarning, setWrongLayoutWarning] = useState(false);
  const [lastPressedCode, setLastPressedCode] = useState<string | null>(null);
  const [lastHitState, setLastHitState] = useState<'idle' | 'hit' | 'miss'>('idle');
  const [shiftHeld, setShiftHeld] = useState(false);
  const [peekActive, setPeekActive] = useState(false);

  // Analytics refs for current session
  const sessionKeyStatsRef = useRef<Record<string, { hits: number; misses: number }>>({});
  const wpmHistoryRef = useRef<WpmSample[]>([]);
  const lastSampleSecRef = useRef(0);
  const canvasRef = useRef<AmbientCanvasHandle | null>(null);

  // Overlays & Modals
  const [shout, setShout] = useState<CourtShout | null>(null);
  const [verdictResult, setVerdictResult] = useState<SessionResult | null>(null);
  const [sourceModalOpen, setSourceModalOpen] = useState(false);
  const [sourceModalTab, setSourceModalTab] = useState<
    'cases' | 'youtube' | 'wikipedia' | 'random' | 'custom'
  >('cases');
  const [vocabModalOpen, setVocabModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [quickRandomLoading, setQuickRandomLoading] = useState(false);

  const anyModalOpen =
    sourceModalOpen || vocabModalOpen || profileModalOpen || settingsModalOpen || Boolean(verdictResult);

  const currentLine = dossier.lines[currentLineIdx];
  const currentChars = useMemo(
    () => (currentLine ? Array.from(currentLine.text) : []),
    [currentLine]
  );
  const nextChar = currentChars[charIndex] ?? '';

  const totalDossierChars = useMemo(
    () => dossier.lines.reduce((acc, l) => acc + Array.from(l.text).length, 0),
    [dossier]
  );

  const completedCharsBeforeLine = useMemo(() => {
    let sum = 0;
    for (let i = 0; i < currentLineIdx; i++) {
      sum += Array.from(dossier.lines[i]?.text || '').length;
    }
    return sum;
  }, [dossier, currentLineIdx]);

  const progressPct =
    totalDossierChars > 0
      ? Math.round(((completedCharsBeforeLine + charIndex) / totalDossierChars) * 100)
      : 0;

  const triggerShout = useCallback(
    (label: string, sublabel: string, variant: CourtShout['variant'] = 'gold') => {
      setShout({ id: Date.now() + Math.random(), label, sublabel, variant });
    },
    []
  );

  // Clear shout after animation finishes
  useEffect(() => {
    if (!shout) return;
    const t = setTimeout(() => setShout(null), 1500);
    return () => clearTimeout(t);
  }, [shout]);

  const updateSettings = useCallback((patch: Partial<UserSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  }, []);

  const resetSession = useCallback(
    (nextDossier?: CaseDossier, playGavel = true) => {
      stopSpeaking();
      if (nextDossier) {
        setDossier(normalizeDossier(nextDossier));
      }
      setCurrentLineIdx(0);
      setCharIndex(0);
      setStartedAt(null);
      setElapsedSec(0);
      setCorrectChars(0);
      setTotalAttempts(0);
      setErrorCount(0);
      setCombo(0);
      setMaxCombo(0);
      setPatience(100);
      setErrorFlash(false);
      setWrongLayoutWarning(false);
      setLastPressedCode(null);
      setLastHitState('idle');
      setPeekActive(false);
      setVerdictResult(null);
      sessionKeyStatsRef.current = {};
      wpmHistoryRef.current = [];
      lastSampleSecRef.current = 0;

      if (playGavel) {
        audioEngine.playGavelStrike(settings.soundProfile, settings.volume, true);
        const target = nextDossier || dossier;
        triggerShout(
          target.language === 'th' ? 'เปิดศาลพิจารณาคดี!' : 'COURT IN SESSION!',
          target.title,
          'gold'
        );
      }
    },
    [dossier, settings.soundProfile, settings.volume, triggerShout]
  );

  // Auto-read aloud English line when line advances (if user enabled it)
  useEffect(() => {
    if (
      settings.autoReadAloudEn &&
      dossier.language === 'en' &&
      currentLine &&
      !anyModalOpen
    ) {
      speakText(currentLine.text, 'en', settings.ttsRate);
    }
  }, [
    settings.autoReadAloudEn,
    settings.ttsRate,
    dossier.id,
    dossier.language,
    currentLineIdx,
    anyModalOpen,
  ]);

  // Live WPM clock timer
  useEffect(() => {
    if (!startedAt || verdictResult) return;
    const interval = setInterval(() => {
      const sec = (Date.now() - startedAt) / 1000;
      setElapsedSec(sec);
      if (sec - lastSampleSecRef.current >= 2) {
        lastSampleSecRef.current = sec;
        const m = computeSpeedMetrics(correctChars, totalAttempts, sec);
        wpmHistoryRef.current.push({
          sec: Math.round(sec),
          wpm: m.wpm,
          accuracy: m.accuracy,
        });
      }
    }, 250);
    return () => clearInterval(interval);
  }, [startedAt, verdictResult, correctChars, totalAttempts]);

  const metrics = useMemo(
    () => computeSpeedMetrics(correctChars, totalAttempts, elapsedSec),
    [correctChars, totalAttempts, elapsedSec]
  );

  // Complete dossier -> compute Verdict & save to localStorage profile
  const finalizeSession = useCallback(
    (finalCorrect: number, finalAttempts: number, finalErrors: number, finalMaxCombo: number) => {
      const dur = startedAt ? Math.max(1, (Date.now() - startedAt) / 1000) : 1;
      const finalMetrics = computeSpeedMetrics(finalCorrect, finalAttempts, dur);
      const grade = computeVerdictGrade(finalMetrics.wpm, finalMetrics.accuracy, dossier.language);

      const gradeBonus = { S: 95, A: 65, B: 40, C: 22 }[grade];
      const xpEarned = Math.round(finalCorrect * 0.25 + gradeBonus);

      const weakKeys = Object.entries(sessionKeyStatsRef.current)
        .filter(([, s]) => s.misses > 0)
        .map(([char, s]) => ({
          char,
          misses: s.misses,
          hits: s.hits,
          rate: s.misses / Math.max(1, s.hits + s.misses),
        }))
        .sort((a, b) => b.misses - a.misses || b.rate - a.rate)
        .slice(0, 8);

      // Collect interesting English vocabulary from the passage for the mini-quiz
      const vocabMap = new Map<string, VocabHint>();
      if (dossier.language === 'en') {
        for (const line of dossier.lines) {
          (line.vocab || []).forEach((v) => vocabMap.set(v.word.toLowerCase(), v));
          const words = line.text.match(/[a-zA-Z]{5,}/g) || [];
          for (const w of words) {
            const found = lookupOfflineWord(w);
            if (found && !vocabMap.has(found.word.toLowerCase())) {
              vocabMap.set(found.word.toLowerCase(), found);
            }
          }
        }
      }

      const finalHistory = [
        ...wpmHistoryRef.current,
        { sec: Math.round(dur), wpm: finalMetrics.wpm, accuracy: finalMetrics.accuracy },
      ];

      const result: SessionResult = {
        id: `sess-${Date.now()}`,
        timestamp: Date.now(),
        caseId: dossier.id,
        caseTitle: dossier.title,
        caseCode: dossier.caseCode,
        language: dossier.language,
        sourceKind: dossier.sourceKind,
        wpm: finalMetrics.wpm,
        rawWpm: finalMetrics.rawWpm,
        cpm: finalMetrics.cpm,
        accuracy: finalMetrics.accuracy,
        maxCombo: finalMaxCombo,
        totalChars: finalAttempts,
        correctChars: finalCorrect,
        errorCount: finalErrors,
        durationSec: dur,
        grade,
        xpEarned,
        wpmHistory: finalHistory,
        weakKeys,
        vocabFromSession: Array.from(vocabMap.values()).slice(0, 8),
      };

      audioEngine.playWaxStamp(settings.soundProfile, settings.volume);
      canvasRef.current?.burst('#F2D583', 38);
      triggerShout(
        dossier.language === 'th' ? 'ปิดสำนวนคดีสมบูรณ์!' : 'VERDICT CERTIFIED!',
        `ระดับ ${grade} · ${finalMetrics.wpm} WPM · แม่นยำ ${finalMetrics.accuracy}%`,
        'emerald'
      );

      setProfile((prev) => recordSessionToProfile(prev, result, sessionKeyStatsRef.current));
      setVerdictResult(result);
    },
    [dossier, startedAt, settings.soundProfile, settings.volume, triggerShout]
  );

  // Main global keyboard listener
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setShiftHeld(true);

      if (anyModalOpen) return;

      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
        return;
      }

      // Allow browser shortcuts (Ctrl+C, Alt+Shift to switch keyboard layout, etc.)
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      // Tab toggles translation peek in English mode
      if (e.key === 'Tab') {
        e.preventDefault();
        if (dossier.language === 'en' && settings.translationMode === 'peek') {
          setPeekActive((p) => !p);
        }
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        resetSession(undefined, false);
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
      }

      // Determine typed character (either Auto-Layout physical mapping or native OS e.key)
      let typedChar: string | null = null;
      if (settings.autoLayoutMapping) {
        typedChar = mapPhysicalKeyToChar(e.code, e.shiftKey, dossier.language);
      } else {
        if (e.key.length === 1) {
          typedChar = e.key;
        }
      }

      if (!typedChar || !currentLine) return;

      const expected = currentChars[charIndex];
      if (!expected) return;

      if (!startedAt) {
        setStartedAt(Date.now());
      }

      setLastPressedCode(e.code);
      setTimeout(() => setLastPressedCode((prev) => (prev === e.code ? null : prev)), 150);

      // Update keystroke stats
      const stat = sessionKeyStatsRef.current[expected] || { hits: 0, misses: 0 };

      if (typedChar === expected) {
        stat.hits += 1;
        sessionKeyStatsRef.current[expected] = stat;

        const nextCorrect = correctChars + 1;
        const nextAttempts = totalAttempts + 1;
        const nextCombo = combo + 1;
        const nextMaxCombo = Math.max(maxCombo, nextCombo);

        setCorrectChars(nextCorrect);
        setTotalAttempts(nextAttempts);
        setCombo(nextCombo);
        setMaxCombo(nextMaxCombo);
        setLastHitState('hit');
        setErrorFlash(false);
        setWrongLayoutWarning(false);
        setPatience((p) => Math.min(100, p + 1.4));

        audioEngine.playKeyHit(nextCombo, settings.soundProfile, settings.volume);

        // Milestone celebrations!
        if (nextCombo === 25 || nextCombo === 50 || nextCombo === 100) {
          audioEngine.playComboFanfare(settings.soundProfile, settings.volume);
          canvasRef.current?.burst('#F2D583', 26);
          triggerShout(
            `${nextCombo}x STREAK!`,
            dossier.language === 'th' ? 'จังหวะเสมียนศาลสุดเฉียบ!' : 'Flawless courtroom cadence!',
            'gold'
          );
        }

        const nextIdx = charIndex + 1;
        if (nextIdx >= currentChars.length) {
          // Completed this line!
          audioEngine.playLineBell(settings.soundProfile, settings.volume);
          canvasRef.current?.burst('#68E0A8', 18);
          setPeekActive(false);

          if (currentLineIdx + 1 >= dossier.lines.length) {
            setCharIndex(nextIdx);
            finalizeSession(nextCorrect, nextAttempts, errorCount, nextMaxCombo);
          } else {
            setCurrentLineIdx((i) => i + 1);
            setCharIndex(0);
          }
        } else {
          setCharIndex(nextIdx);
        }
      } else {
        // Typo!
        stat.misses += 1;
        sessionKeyStatsRef.current[expected] = stat;

        setTotalAttempts((a) => a + 1);
        setErrorCount((err) => err + 1);
        setCombo(0);
        setLastHitState('miss');
        setErrorFlash(true);
        setTimeout(() => setErrorFlash(false), 260);

        audioEngine.playKeyError(settings.soundProfile, settings.volume);

        // Detect OS keyboard layout mismatch!
        if (!settings.autoLayoutMapping && isWrongKeyboardLayout(typedChar, expected, dossier.language)) {
          setWrongLayoutWarning(true);
        }

        if (settings.gameMode === 'trial') {
          setPatience((p) => {
            const nextP = Math.max(10, p - 7);
            if (p >= 45 && nextP < 45) {
              audioEngine.playGavelStrike(settings.soundProfile, settings.volume, false);
              if (!settings.reducedMotion) {
                setGavelShake(true);
                setTimeout(() => setGavelShake(false), 350);
              }
              triggerShout(
                'ORDER IN THE COURT!',
                dossier.language === 'th'
                  ? 'ใจเย็นๆ เน้นความแม่นยำก่อนความเร็ว!'
                  : 'Steady your hands, Clerk — accuracy first!',
                'crimson'
              );
            }
            return nextP;
          });
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setShiftHeld(false);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [
    anyModalOpen,
    dossier,
    currentLine,
    currentChars,
    charIndex,
    currentLineIdx,
    startedAt,
    correctChars,
    totalAttempts,
    errorCount,
    combo,
    maxCombo,
    settings,
    resetSession,
    finalizeSession,
    triggerShout,
  ]);

  const handleUpdateLineTranslation = useCallback((lineId: string, th: string) => {
    setDossier((prev) => ({
      ...prev,
      lines: prev.lines.map((l) => (l.id === lineId ? { ...l, translationTh: th } : l)),
    }));
  }, []);

  const handleSaveVocab = useCallback(
    (hint: VocabHint) => {
      setProfile((prev) =>
        upsertVocabInProfile(prev, {
          ...hint,
          sourceTitle: dossier.title,
        })
      );
    },
    [dossier.title]
  );

  const isSavedWord = useCallback(
    (word: string) =>
      profile.vocabNotebook.some((v) => v.word.toLowerCase() === word.toLowerCase()),
    [profile.vocabNotebook]
  );

  const handleDeleteVocab = useCallback((word: string) => {
    setProfile((prev) => {
      const next = {
        ...prev,
        vocabNotebook: prev.vocabNotebook.filter(
          (v) => v.word.toLowerCase() !== word.toLowerCase()
        ),
      };
      saveProfile(next);
      return next;
    });
  }, []);

  const handleRateVocabMastery = useCallback((word: string, delta: number) => {
    setProfile((prev) => {
      const next = {
        ...prev,
        vocabNotebook: prev.vocabNotebook.map((v) =>
          v.word.toLowerCase() === word.toLowerCase()
            ? { ...v, mastery: Math.max(0, Math.min(5, v.mastery + delta)) }
            : v
        ),
      };
      saveProfile(next);
      return next;
    });
  }, []);

  const handleQuickSwitchLanguage = (lang: Language) => {
    if (dossier.language === lang) return;
    const match = BUILT_IN_CASES.find(
      (c) => c.language === lang && c.sourceKind === 'court-case'
    );
    if (match) resetSession(match, true);
  };

  const handleQuickRandom = async () => {
    setQuickRandomLoading(true);
    try {
      // Try live random Wikipedia first, seamlessly falling back to curated offline gems!
      const live = await loadRandomWikipediaCase(dossier.language, 6);
      resetSession(live, true);
    } catch {
      const pool = [...BUILT_IN_CASES, ...OFFLINE_RANDOM_GEMS].filter(
        (c) => c.language === dossier.language && c.id !== dossier.id
      );
      const pick = pool[Math.floor(Math.random() * pool.length)] || BUILT_IN_CASES[0];
      resetSession(pick, true);
    } finally {
      setQuickRandomLoading(false);
    }
  };

  const rank = getRankForXp(profile.xp);

  return (
    <div
      className={`relative min-h-screen w-full overflow-x-hidden bg-[#0f0b08] text-[#f5efe6] ${
        gavelShake ? 'animate-gavel-shake' : ''
      }`}
    >
      {/* Full-bleed Painterly Courtroom Stage Background */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${courtroomBg})` }}
      />
      {/* Rich Noir Mahogany Vignette + Banker's Lamp Golden Spotlight */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 bg-gradient-to-b from-[#0e0a07]/80 via-[#120d09]/76 to-[#0c0907]/94"
      />
      <div
        aria-hidden="true"
        className="lamp-spotlight pointer-events-none fixed inset-0 z-0"
      />

      {/* Ambient Dust Motes & Combo Particle Sparks */}
      <AmbientCanvas ref={canvasRef} disabled={settings.reducedMotion} />

      {/* Dramatic Courtroom Callout Overlay */}
      <CourtShoutOverlay shout={shout} />

      {/* Main Content Container */}
      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1220px] flex-col px-3 pb-6 pt-3 sm:px-5 sm:pt-4">
        {/* ================= TOP BRASS NAVIGATION HEADER ================= */}
        <header className="brass-panel-glass flex flex-wrap items-center justify-between gap-2 rounded-2xl px-3.5 py-2 sm:px-4">
          {/* Brand Crest */}
          <div className="flex items-center gap-2.5">
            <img
              src={sealImg}
              alt="Court Scribe Crest"
              className="h-9 w-9 rounded-full border border-[#d4af37]/70 object-cover shadow-[0_0_16px_rgba(212,175,55,0.35)]"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-display text-sm font-extrabold tracking-[0.12em] text-[#f5d87e] sm:text-base">
                  COURT SCRIBE
                </h1>
                <span className="hidden rounded bg-[#d4af37]/15 px-1.5 py-0.5 text-[10px] font-bold text-[#f2d583] xl:inline">
                  บันทึกบัลลังก์
                </span>
              </div>
              <div className="text-[11px] text-[#bba88e]">
                {rank.titleTh} · Lv.{rank.level}
              </div>
            </div>
          </div>

          {/* Center: Instant Language Switcher (TH / EN+Translation) */}
          <div className="inline-flex overflow-hidden rounded-xl border border-[#d4af37]/35 bg-black/45 p-0.5 text-xs font-bold">
            <button
              type="button"
              onClick={() => handleQuickSwitchLanguage('th')}
              className={`rounded-lg px-2.5 py-1.5 transition cursor-pointer ${
                dossier.language === 'th'
                  ? 'bg-gradient-to-b from-[#e4c25e] to-[#b88f28] text-[#140e07]'
                  : 'text-[#d7c6ae] hover:text-white'
              }`}
            >
              ภาษาไทย
            </button>
            <button
              type="button"
              onClick={() => handleQuickSwitchLanguage('en')}
              className={`rounded-lg px-2.5 py-1.5 transition cursor-pointer ${
                dossier.language === 'en'
                  ? 'bg-gradient-to-b from-[#e4c25e] to-[#b88f28] text-[#140e07]'
                  : 'text-[#d7c6ae] hover:text-white'
              }`}
            >
              English + แปลไทย
            </button>
          </div>

          {/* Right Action Controls */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setSourceModalTab('cases');
                setSourceModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-b from-[#e4c25e] to-[#b88f28] px-3 py-1.5 text-xs font-extrabold text-[#140e07] shadow-[0_0_16px_rgba(212,175,55,0.3)] transition hover:brightness-110 cursor-pointer"
            >
              <Books weight="fill" className="h-4 w-4" />
              <span>เลือกคดี / แหล่งข้อมูล</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSourceModalTab('youtube');
                setSourceModalOpen(true);
              }}
              title="แปะลิงก์ YouTube"
              className="hidden items-center gap-1.5 rounded-xl border border-[#d94141]/45 bg-[#d94141]/15 px-2.5 py-2 text-xs font-bold text-[#ffbdbd] transition hover:bg-[#d94141]/25 cursor-pointer md:inline-flex"
            >
              <YoutubeLogo weight="fill" className="h-4 w-4 text-[#ff5252]" />
              YouTube
            </button>

            <button
              type="button"
              onClick={() => {
                setSourceModalTab('wikipedia');
                setSourceModalOpen(true);
              }}
              title="วางลิงก์หรือค้นหา Wikipedia"
              className="hidden items-center gap-1.5 rounded-xl border border-[#3d75b5]/45 bg-[#3d75b5]/15 px-2.5 py-2 text-xs font-bold text-[#b8d8ff] transition hover:bg-[#3d75b5]/25 cursor-pointer lg:inline-flex"
            >
              <GlobeHemisphereWest weight="duotone" className="h-4 w-4" />
              Wiki
            </button>

            <button
              type="button"
              disabled={quickRandomLoading}
              onClick={handleQuickRandom}
              title="สุ่มบทความใหม่ทันที"
              className="inline-flex items-center gap-1 rounded-xl border border-[#d4af37]/30 bg-white/5 px-2.5 py-2 text-xs font-bold text-[#f2d583] transition hover:bg-white/10 disabled:opacity-50 cursor-pointer"
            >
              {quickRandomLoading ? (
                <SpinnerGap className="h-4 w-4 animate-spin" />
              ) : (
                <Shuffle weight="bold" className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">สุ่ม</span>
            </button>

            <button
              type="button"
              onClick={() => setVocabModalOpen(true)}
              title="สมุดคำศัพท์ภาษาอังกฤษ"
              className="relative inline-flex items-center gap-1 rounded-xl border border-white/12 bg-white/5 px-2.5 py-2 text-xs font-bold text-[#e5d8c3] transition hover:bg-white/10 cursor-pointer"
            >
              <BookmarkSimple weight="duotone" className="h-4 w-4 text-[#79e3b1]" />
              <span className="hidden sm:inline">ศัพท์</span>
              <span className="rounded-full bg-[#2ea673]/30 px-1.5 py-0.2 font-mono-num text-[10px] text-[#88ebb9]">
                {profile.vocabNotebook.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setProfileModalOpen(true)}
              aria-label="สถิติและยศเสมียนศาล"
              title="สถิติและยศเสมียนศาล"
              className="rounded-xl border border-white/12 bg-white/5 p-2 text-[#f2d583] transition hover:bg-white/10 cursor-pointer"
            >
              <Medal weight="duotone" className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() =>
                updateSettings({
                  soundProfile:
                    settings.soundProfile === 'silent' ? 'brass-typewriter' : 'silent',
                })
              }
              aria-label="เปิด/ปิดเสียง"
              title="เปิด/ปิดเสียง"
              className="rounded-xl border border-white/12 bg-white/5 p-2 text-[#e5d8c3] transition hover:bg-white/10 cursor-pointer"
            >
              {settings.soundProfile === 'silent' ? (
                <SpeakerSlash className="h-4 w-4 text-[#a8957c]" />
              ) : (
                <SpeakerHigh weight="duotone" className="h-4 w-4 text-[#f2d583]" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setSettingsModalOpen(true)}
              aria-label="ตั้งค่า"
              title="ตั้งค่าเกม"
              className="rounded-xl border border-white/12 bg-white/5 p-2 text-[#e5d8c3] transition hover:bg-white/10 cursor-pointer"
            >
              <GearSix weight="duotone" className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* ================= MAIN COURTROOM GAMEPLAY AREA ================= */}
        <main className="mt-3.5 flex flex-1 flex-col gap-3.5">
          {/* 1. Courtroom Stage: Character Portrait, Case Progress, Telemetry & Live YouTube Monitor */}
          <CourtroomStage
            dossier={dossier}
            currentLine={currentLine}
            currentLineIdx={currentLineIdx}
            wpm={metrics.wpm}
            accuracy={metrics.accuracy}
            combo={combo}
            patience={patience}
            gameMode={settings.gameMode}
            lastHitState={lastHitState}
            progressPct={progressPct}
          />

          {/* 2. Centerpiece Parchment Legal Transcript + English Reading/Translation Dock */}
          <TranscriptPaper
            dossier={dossier}
            currentLineIdx={currentLineIdx}
            charIndex={charIndex}
            errorFlash={errorFlash}
            wrongLayoutWarning={wrongLayoutWarning}
            autoLayoutEnabled={settings.autoLayoutMapping}
            onEnableAutoLayout={() => {
              updateSettings({ autoLayoutMapping: true });
              setWrongLayoutWarning(false);
            }}
            translationMode={settings.translationMode}
            onChangeTranslationMode={(m) => updateSettings({ translationMode: m })}
            ttsRate={settings.ttsRate}
            fontSize={settings.fontSize}
            isSavedWord={isSavedWord}
            onSaveVocab={handleSaveVocab}
            onFocusTyping={() => {
              if (document.activeElement instanceof HTMLElement) {
                document.activeElement.blur();
              }
            }}
            peekActive={peekActive}
            onPeekToggle={setPeekActive}
            onUpdateLineTranslation={handleUpdateLineTranslation}
          />

          {/* Quick Utility Strip between Paper and Keyboard */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-[#cbb89d]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d4af37]/30 bg-black/45 px-3 py-1">
                <span className="h-2 w-2 rounded-full bg-[#2ea673] shadow-[0_0_8px_#2ea673]" />
                <span>พร้อมพิมพ์ได้ทันทีจากคีย์บอร์ด</span>
              </span>

              <button
                type="button"
                onClick={() =>
                  updateSettings({ autoLayoutMapping: !settings.autoLayoutMapping })
                }
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-semibold transition cursor-pointer ${
                  settings.autoLayoutMapping
                    ? 'border-[#68e0a8]/60 bg-[#2ea673]/20 text-[#98f2c8]'
                    : 'border-white/15 bg-black/40 text-[#cbb89d] hover:border-[#d4af37]/50'
                }`}
                title="เปิดแล้วไม่ต้องกดสลับภาษาไทย/อังกฤษที่ระบบ Windows"
              >
                <Keyboard weight="duotone" className="h-3.5 w-3.5" />
                {settings.autoLayoutMapping
                  ? 'Auto-Layout: เปิด (พิมพ์ไม่ต้องสลับภาษา)'
                  : 'Auto-Layout: ปิด (ใช้ภาษาคีย์บอร์ดเครื่อง)'}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => updateSettings({ showKeyboard: !settings.showKeyboard })}
                className="rounded-lg border border-white/15 bg-black/40 px-2.5 py-1 text-[11px] font-semibold text-[#d7c6ae] hover:bg-white/10 cursor-pointer"
              >
                {settings.showKeyboard ? 'ซ่อนแป้นพิมพ์' : 'แสดงแป้นพิมพ์'}
              </button>
              <button
                type="button"
                onClick={() => resetSession(undefined, false)}
                className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-black/40 px-2.5 py-1 text-[11px] font-semibold text-[#d7c6ae] hover:bg-white/10 cursor-pointer"
              >
                <ArrowsClockwise className="h-3.5 w-3.5" />
                เริ่มใหม่ (Esc)
              </button>
            </div>
          </div>

          {/* 3. Sculpted 3D Touch-Typing Virtual Keyboard + 10-Finger Hand Guide */}
          {settings.showKeyboard && (
            <VirtualKeyboard
              language={dossier.language}
              nextChar={nextChar}
              lastPressedCode={lastPressedCode}
              lastHitState={lastHitState}
              showFingerHands={settings.showFingerHands}
              shiftHeld={shiftHeld}
            />
          )}
        </main>
      </div>

      {/* ================= MODALS ================= */}
      <SourcePickerModal
        open={sourceModalOpen}
        onClose={() => setSourceModalOpen(false)}
        initialTab={sourceModalTab}
        onSelectDossier={(d) => resetSession(d, true)}
      />

      <VerdictModal
        result={verdictResult}
        onReplay={() => resetSession(undefined, true)}
        onOpenSources={() => {
          setVerdictResult(null);
          setSourceModalTab('cases');
          setSourceModalOpen(true);
        }}
        onStartTargetedDrill={(weakChars) => {
          const drill = buildTargetedWeakKeyDrill(weakChars, dossier.language);
          resetSession(drill, true);
        }}
        onRandomNext={() => {
          setVerdictResult(null);
          handleQuickRandom();
        }}
        onSaveVocab={handleSaveVocab}
        isSavedWord={isSavedWord}
      />

      <VocabNotebookModal
        open={vocabModalOpen}
        onClose={() => setVocabModalOpen(false)}
        items={profile.vocabNotebook}
        onDeleteWord={handleDeleteVocab}
        onRateMastery={handleRateVocabMastery}
      />

      <ProfileStatsModal
        open={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        profile={profile}
        onImportProfile={(next) => {
          saveProfile(next);
          setProfile(next);
        }}
      />

      <SettingsModal
        open={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        settings={settings}
        onChange={updateSettings}
      />
    </div>
  );
}

export default App;
