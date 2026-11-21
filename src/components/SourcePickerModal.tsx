import { useEffect, useState, type ChangeEvent } from 'react';
import {
  X,
  Scales,
  YoutubeLogo,
  GlobeHemisphereWest,
  Shuffle,
  FileText,
  MagnifyingGlass,
  SpinnerGap,
  UploadSimple,
  DownloadSimple,
  CheckCircle,
  WarningCircle,
  Play,
  BookOpen,
  FolderStar,
  Trash,
  TrendUp,
  Table,
  FloppyDisk,
} from '@phosphor-icons/react';
import type { CaseDossier, Language } from '../types/game';
import { BUILT_IN_CASES, OFFLINE_RANDOM_GEMS } from '../data/builtInCases';
import {
  detectTextLanguage,
  extractYouTubeId,
  fetchTrendingWikipediaTitles,
  fetchYouTubeMetadata,
  loadRandomWikipediaCase,
  loadWikipediaCase,
  parseSubtitleOrTranscript,
  searchWikipedia,
  tryAutoFetchYouTubeCaptions,
  type TrendingTopicItem,
  type WikiSearchItem,
  type YouTubeMetadata,
} from '../engine/contentLoaders';
import { fetchStagesFromGoogleSheet, isValidSheetUrl } from '../engine/sheetsService';

export type SourceTabId = 'cases' | 'youtube' | 'wikipedia' | 'random' | 'custom' | 'mystages';

interface Props {
  open: boolean;
  onClose: () => void;
  onSelectDossier: (dossier: CaseDossier) => void;
  initialTab?: SourceTabId;
  customStages: CaseDossier[];
  onSaveCustomStage: (stage: CaseDossier) => void;
  onDeleteCustomStage: (stageId: string) => void;
  onImportCustomStages: (stages: CaseDossier[]) => void;
  googleSheetUrl: string;
}

export function SourcePickerModal({
  open,
  onClose,
  onSelectDossier,
  initialTab = 'cases',
  customStages,
  onSaveCustomStage,
  onDeleteCustomStage,
  onImportCustomStages,
  googleSheetUrl,
}: Props) {
  const [tab, setTab] = useState<SourceTabId>(initialTab);
  const [caseFilterLang, setCaseFilterLang] = useState<'all' | Language>('all');
  const [caseFilterCat, setCaseFilterCat] = useState<string>('all');

  // YouTube state
  const [ytInput, setYtInput] = useState('');
  const [ytLang, setYtLang] = useState<Language>('th');
  const [ytLoading, setYtLoading] = useState(false);
  const [ytMeta, setYtMeta] = useState<YouTubeMetadata | null>(null);
  const [ytNotice, setYtNotice] = useState<string | null>(null);
  const [ytManualTranscript, setYtManualTranscript] = useState('');
  const [ytSaveToMyStages, setYtSaveToMyStages] = useState(true);

  // Wikipedia state
  const [wikiInput, setWikiInput] = useState('');
  const [wikiLang, setWikiLang] = useState<Language>('th');
  const [wikiLength, setWikiLength] = useState<number>(6);
  const [wikiLoading, setWikiLoading] = useState(false);
  const [wikiResults, setWikiResults] = useState<WikiSearchItem[]>([]);
  const [wikiError, setWikiError] = useState<string | null>(null);
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopicItem[]>([]);
  const [loadingTrending, setLoadingTrending] = useState(false);

  // Random state
  const [randLoading, setRandLoading] = useState<string | null>(null);
  const [randError, setRandError] = useState<string | null>(null);

  // Custom paste/file state
  const [customTitle, setCustomTitle] = useState('');
  const [customText, setCustomText] = useState('');
  const [customLang, setCustomLang] = useState<'auto' | Language>('auto');
  const [customSaveStage, setCustomSaveStage] = useState(true);

  // Community Google Sheet stages
  const [sheetStages, setSheetStages] = useState<CaseDossier[]>([]);
  const [loadingSheetStages, setLoadingSheetStages] = useState(false);
  const [sheetStageMsg, setSheetStageMsg] = useState<string | null>(null);

  useEffect(() => {
    if (open) setTab(initialTab);
  }, [open, initialTab]);

  // Load real-time Trending Wikipedia topics when opening Wikipedia tab
  useEffect(() => {
    if (!open || tab !== 'wikipedia') return;
    let cancelled = false;
    setLoadingTrending(true);
    fetchTrendingWikipediaTitles(wikiLang)
      .then((list) => {
        if (!cancelled) setTrendingTopics(list);
      })
      .finally(() => {
        if (!cancelled) setLoadingTrending(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, tab, wikiLang]);

  if (!open) return null;

  const categories = Array.from(new Set(BUILT_IN_CASES.map((c) => c.category)));

  const filteredCases = BUILT_IN_CASES.filter(
    (c) =>
      (caseFilterLang === 'all' || c.language === caseFilterLang) &&
      (caseFilterCat === 'all' || c.category === caseFilterCat)
  );

  // === YOUTUBE HANDLERS ===
  const handleLoadYoutubeUrl = async () => {
    setYtNotice(null);
    const id = extractYouTubeId(ytInput);
    if (!id) {
      setYtNotice('ไม่พบรหัสวิดีโอ YouTube ที่ถูกต้อง กรุณาวางลิงก์เช่น https://www.youtube.com/watch?v=...');
      return;
    }

    setYtLoading(true);
    try {
      const meta = await fetchYouTubeMetadata(id);
      setYtMeta(meta);

      const autoResult = await tryAutoFetchYouTubeCaptions(id, ytLang);
      if (autoResult && autoResult.lines.length > 0) {
        const dossier: CaseDossier = {
          id: `yt-${id}-${Date.now()}`,
          caseCode: 'EXHIBIT YT',
          title: meta.title,
          subtitle: `คำบรรยายจากคลิปโดย ${meta.author} (อ่านเสียงตามวรรคตอนอัตโนมัติ)`,
          language: autoResult.detectedLang,
          sourceKind: 'youtube',
          difficulty: 'senior',
          category: 'YouTube ซิงก์คำบรรยาย',
          youtubeId: id,
          sourceUrl: `https://www.youtube.com/watch?v=${id}`,
          lines: autoResult.lines,
        };
        if (ytSaveToMyStages) onSaveCustomStage(dossier);
        onSelectDossier(dossier);
        onClose();
        return;
      }

      setYtNotice(
        'โหลดข้อมูลวิดีโอสำเร็จแล้ว! แต่คลิปนี้ YouTube ปิดการดึงคำบรรยายข้ามโดเมนจากเบราว์เซอร์โดยตรง — เพียงกด "Show transcript" ใต้คลิป YouTube แล้วก๊อปวาง (หรือเลือกไฟล์ .SRT/.VTT) ลงช่องด้านล่าง เกมจะอ่านเสียงพากย์ตามคำบรรยายให้คุณพิมพ์ตามทันที!'
      );
    } catch {
      setYtNotice('เกิดข้อผิดพลาดขณะโหลดข้อมูลคลิป กรุณาลองใหม่หรือวางคำบรรยายด้านล่างได้เลย');
    } finally {
      setYtLoading(false);
    }
  };

  const handleStartYoutubeWithPastedTranscript = () => {
    const id = ytMeta?.videoId || extractYouTubeId(ytInput);
    if (!ytManualTranscript.trim()) {
      setYtNotice('กรุณาวางข้อความคำบรรยายจาก YouTube หรืออัปโหลดไฟล์ .SRT / .VTT ก่อนเริ่ม');
      return;
    }
    const detected = detectTextLanguage(ytManualTranscript);
    const lines = parseSubtitleOrTranscript(
      ytManualTranscript,
      detected,
      ytMeta?.author || 'YouTube Witness'
    );
    if (lines.length === 0) {
      setYtNotice('ไม่พบข้อความที่พิมพ์ได้จากคำบรรยายที่วาง กรุณาตรวจสอบข้อความอีกครั้ง');
      return;
    }

    const dossier: CaseDossier = {
      id: `yt-custom-${id || Date.now()}-${Date.now()}`,
      caseCode: 'EXHIBIT YT',
      title: ytMeta?.title || 'YouTube Transcript Session',
      subtitle: id
        ? `คำบรรยาย YouTube พร้อมเสียงพากย์ตามวรรคตอน (${detected === 'en' ? 'EN + แปลไทย' : 'ภาษาไทย'})`
        : 'คำบรรยายวิดีโอที่นำเข้า',
      language: detected,
      sourceKind: 'youtube',
      difficulty: 'senior',
      category: 'YouTube ซิงก์คำบรรยาย',
      youtubeId: id || undefined,
      sourceUrl: id ? `https://www.youtube.com/watch?v=${id}` : undefined,
      lines,
    };

    if (ytSaveToMyStages) onSaveCustomStage(dossier);
    onSelectDossier(dossier);
    onClose();
  };

  const handleSubtitleFileUpload = (
    e: ChangeEvent<HTMLInputElement>,
    target: 'youtube' | 'custom'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = String(reader.result || '');
      if (target === 'youtube') {
        setYtManualTranscript(content);
      } else {
        setCustomText(content);
        if (!customTitle) setCustomTitle(file.name.replace(/\.[^.]+$/, ''));
      }
    };
    reader.readAsText(file, 'utf-8');
  };

  // === WIKIPEDIA HANDLERS ===
  const handleWikiSubmit = async () => {
    setWikiError(null);
    const trimmed = wikiInput.trim();
    if (!trimmed) {
      setWikiError('กรุณาวางลิงก์ Wikipedia หรือพิมพ์คำค้นหา');
      return;
    }

    setWikiLoading(true);
    try {
      if (/wikipedia\.org\/wiki\//i.test(trimmed)) {
        const dossier = await loadWikipediaCase(trimmed, wikiLang, wikiLength);
        onSelectDossier(dossier);
        onClose();
        return;
      }

      const hits = await searchWikipedia(trimmed, wikiLang);
      setWikiResults(hits);
      if (hits.length === 0) {
        setWikiError(`ไม่พบบทความที่ตรงกับ "${trimmed}" ใน Wikipedia (${wikiLang.toUpperCase()})`);
      }
    } catch (err) {
      setWikiError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการเชื่อมต่อ Wikipedia');
    } finally {
      setWikiLoading(false);
    }
  };

  const handlePickWikiTitle = async (title: string) => {
    setWikiError(null);
    setWikiLoading(true);
    try {
      const dossier = await loadWikipediaCase(title, wikiLang, wikiLength);
      onSelectDossier(dossier);
      onClose();
    } catch (err) {
      setWikiError(err instanceof Error ? err.message : 'โหลดบทความไม่สำเร็จ');
    } finally {
      setWikiLoading(false);
    }
  };

  // === RANDOM HANDLERS ===
  const handleRandomWiki = async (lang: Language) => {
    setRandError(null);
    setRandLoading(`wiki-${lang}`);
    try {
      const dossier = await loadRandomWikipediaCase(lang, 6);
      onSelectDossier(dossier);
      onClose();
    } catch (err) {
      setRandError(
        err instanceof Error
          ? `${err.message} (คุณยังสามารถใช้ปุ่มสุ่มออฟไลน์ด้านล่างได้ทันที)`
          : 'ไม่สามารถเชื่อมต่อ Wikipedia ได้'
      );
    } finally {
      setRandLoading(null);
    }
  };

  const handleRandomOffline = (lang: Language | 'any') => {
    const pool = [...BUILT_IN_CASES, ...OFFLINE_RANDOM_GEMS, ...customStages].filter(
      (c) => (lang === 'any' || c.language === lang) && c.sourceKind !== 'drill'
    );
    const pick = pool[Math.floor(Math.random() * pool.length)];
    if (pick) {
      onSelectDossier(pick);
      onClose();
    }
  };

  // === CUSTOM TEXT HANDLER ===
  const handleStartCustom = () => {
    if (!customText.trim()) return;
    const lang = customLang === 'auto' ? detectTextLanguage(customText) : customLang;
    const lines = parseSubtitleOrTranscript(customText, lang, 'Custom Document');
    if (lines.length === 0) return;

    const dossier: CaseDossier = {
      id: `user-stage-${Date.now()}`,
      caseCode: 'MY STAGE',
      title: customTitle.trim() || (lang === 'th' ? 'ด่านข้อความที่นำเข้าเอง' : 'Custom Imported Stage'),
      subtitle:
        lang === 'en'
          ? 'ข้อความนำเข้าเอง — อ่านเสียงตามวรรคตอน + แปลไทยอัตโนมัติ'
          : 'ข้อความภาษาไทยที่นำเข้าเอง — อ่านเสียงตามวรรคตอนอัตโนมัติ',
      language: lang,
      sourceKind: 'custom',
      difficulty: 'senior',
      category: 'ด่านของผู้ใช้',
      lines,
    };

    if (customSaveStage) onSaveCustomStage(dossier);
    onSelectDossier(dossier);
    onClose();
  };

  // === GOOGLE SHEET COMMUNITY STAGES & STAGE PACK EXPORT/IMPORT ===
  const handleFetchSheetStages = async () => {
    setSheetStageMsg(null);
    if (!isValidSheetUrl(googleSheetUrl)) {
      setSheetStageMsg('ยังไม่ได้เชื่อมต่อ Google Sheet — กดปุ่ม "สถิติ Sheet" ด้านบนเพื่อวาง URL ของคุณก่อนครับ');
      return;
    }
    setLoadingSheetStages(true);
    try {
      const list = await fetchStagesFromGoogleSheet(googleSheetUrl);
      setSheetStages(list);
      if (list.length === 0) {
        setSheetStageMsg(
          'เชื่อมต่อสำเร็จ แต่ยังไม่มีด่านในแท็บ "CourtScribe_Stages" ของ Google Sheet (เพิ่มแถว title | language | category | youtubeUrl | text ในชีตแล้วกดดึงใหม่ได้เลย!)'
        );
      }
    } finally {
      setLoadingSheetStages(false);
    }
  };

  const handleExportStagesJson = () => {
    const blob = new Blob([JSON.stringify(customStages, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `court-scribe-stages-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportStagesJson = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || ''));
        if (Array.isArray(parsed)) {
          const valid = parsed.filter((s) => s && s.title && Array.isArray(s.lines) && s.lines.length > 0);
          if (valid.length > 0) onImportCustomStages(valid);
        }
      } catch {
        // invalid json
      }
    };
    reader.readAsText(file, 'utf-8');
  };

  const tabs: Array<{ id: SourceTabId; label: string; icon: typeof Scales; badge?: number }> = [
    { id: 'cases', label: `ด่านทั้งหมด (${BUILT_IN_CASES.length})`, icon: Scales },
    { id: 'youtube', label: 'YouTube คำบรรยาย', icon: YoutubeLogo },
    { id: 'wikipedia', label: 'Wikipedia & ฮิตวันนี้', icon: GlobeHemisphereWest },
    { id: 'random', label: 'สุ่มอัจฉริยะ', icon: Shuffle },
    { id: 'custom', label: 'สร้างด่านเอง / ไฟล์', icon: FileText },
    { id: 'mystages', label: 'ด่านของฉัน', icon: FolderStar, badge: customStages.length },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="เลือกด่านและแหล่งข้อความสำหรับฝึกพิมพ์"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-5"
      onClick={onClose}
    >
      <div
        className="brass-panel flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#d4af37]/25 bg-[#1b140f] px-5 py-4">
          <div>
            <h2 className="font-display text-lg font-bold tracking-wider text-[#f2d583] sm:text-xl">
              COURT ARCHIVE · คลังด่านพิมพ์ตามเสียง &amp; แหล่งข้อความ
            </h2>
            <p className="mt-0.5 text-xs text-[#bba88e]">
              ทุกด่านและข้อความนำเข้า (รวม YouTube / วิกิพีเดีย) จะมีเสียงพากย์อ่านตามวรรคตอนให้พิมพ์ตามได้ทันที
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดหน้าต่าง"
            className="rounded-lg border border-white/10 p-2 text-[#cbb89d] transition hover:bg-white/10 hover:text-white cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-1.5 overflow-x-auto border-b border-[#d4af37]/20 bg-[#140e0a] px-4 py-2.5">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition cursor-pointer ${
                  active
                    ? 'bg-gradient-to-b from-[#e4c25e] to-[#b88f28] text-[#140e07] shadow-[0_0_16px_rgba(212,175,55,0.4)]'
                    : 'border border-white/10 bg-white/5 text-[#d7c6ae] hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon weight={active ? 'fill' : 'duotone'} className="h-4 w-4" />
                {t.label}
                {typeof t.badge === 'number' && t.badge > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 font-mono-num text-[10px] ${
                      active ? 'bg-black/20 text-[#140e07]' : 'bg-[#d4af37]/25 text-[#f2d583]'
                    }`}
                  >
                    {t.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* ================= TAB 1: BUILT-IN STAGES (18+ REAL-WORLD & COURTROOM) ================= */}
          {tab === 'cases' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="inline-flex overflow-hidden rounded-lg border border-[#d4af37]/30 bg-black/40 text-xs font-semibold">
                  {(
                    [
                      ['all', 'ทุกภาษา'],
                      ['th', 'ภาษาไทย'],
                      ['en', 'English + แปลไทย'],
                    ] as const
                  ).map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setCaseFilterLang(val)}
                      className={`px-3 py-1.5 transition cursor-pointer ${
                        caseFilterLang === val
                          ? 'bg-[#d4af37] text-[#140e07]'
                          : 'text-[#d7c6ae] hover:bg-white/10'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <select
                  value={caseFilterCat}
                  onChange={(e) => setCaseFilterCat(e.target.value)}
                  className="rounded-lg border border-[#d4af37]/30 bg-[#1a130e] px-3 py-1.5 text-xs font-semibold text-[#f5efe6]"
                >
                  <option value="all">หมวดหมู่: ทั้งหมด ({BUILT_IN_CASES.length} ด่าน)</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {filteredCases.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      onSelectDossier(c);
                      onClose();
                    }}
                    className="group flex flex-col justify-between rounded-xl border border-[#d4af37]/25 bg-[#1b140f]/90 p-4 text-left transition hover:border-[#f2d583] hover:bg-[#251b14] cursor-pointer"
                  >
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-mono-num rounded border border-[#d4af37]/35 bg-[#d4af37]/10 px-2 py-0.5 text-[10px] font-bold text-[#f2d583]">
                          {c.caseCode}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                              c.language === 'th'
                                ? 'bg-[#3d75b5]/25 text-[#9bc6f7]'
                                : 'bg-[#2ea673]/25 text-[#88ebb9]'
                            }`}
                          >
                            {c.language === 'th' ? 'ไทย' : 'EN + แปลไทย'}
                          </span>
                          <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] text-[#cbb89d]">
                            {c.lines.length} ประโยค
                          </span>
                        </div>
                      </div>

                      <h3 className="mt-2.5 text-sm font-bold text-[#fff8eb] group-hover:text-[#f2d583] sm:text-base">
                        {c.title}
                      </h3>
                      {c.subtitle && (
                        <p className="mt-1 text-xs leading-relaxed text-[#baa78d]">{c.subtitle}</p>
                      )}
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2.5 text-xs">
                      <span className="text-[#9e8c73]">{c.category}</span>
                      <span className="inline-flex items-center gap-1 font-bold text-[#f2d583]">
                        <Play weight="fill" className="h-3.5 w-3.5" />
                        เริ่มพิมพ์ตามเสียง
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ================= TAB 2: YOUTUBE LINK -> VOICE DICTATION ================= */}
          {tab === 'youtube' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-[#d94141]/35 bg-[#261212]/70 p-4">
                <div className="flex items-center gap-2 text-sm font-bold text-[#ffbdbd]">
                  <YoutubeLogo weight="fill" className="h-5 w-5 text-[#ff5252]" />
                  แปะลิงก์ YouTube — ดึงคำบรรยายคลิปมาอ่านออกเสียงให้พิมพ์ตามได้เลย!
                </div>
                <p className="mt-1 text-xs text-[#e0c7c7]">
                  ฝึกพิมพ์คำพูดจริงที่ไม่แน่นอนจากคลิป YouTube ใดก็ได้ พร้อมเสียงพากย์อ่านตามวรรคตอนและจอวิดีโอซิงก์เวลา
                </p>

                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <input
                    type="url"
                    value={ytInput}
                    onChange={(e) => setYtInput(e.target.value)}
                    placeholder="วางลิงก์ YouTube เช่น https://www.youtube.com/watch?v=..."
                    className="flex-1 rounded-xl border border-[#d4af37]/30 bg-black/50 px-3.5 py-2.5 text-sm text-white placeholder-[#8c7a64] focus:border-[#f2d583] focus:outline-none"
                  />
                  <select
                    value={ytLang}
                    onChange={(e) => setYtLang(e.target.value as Language)}
                    className="rounded-xl border border-[#d4af37]/30 bg-[#1a130e] px-3 py-2.5 text-sm text-[#f5efe6] focus:border-[#f2d583] focus:outline-none"
                  >
                    <option value="th">ซับภาษาไทย</option>
                    <option value="en">ซับอังกฤษ (+ แปลไทย)</option>
                  </select>
                  <button
                    type="button"
                    disabled={ytLoading}
                    onClick={handleLoadYoutubeUrl}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#e4c25e] to-[#b88f28] px-5 py-2.5 text-sm font-bold text-[#140e07] transition hover:brightness-110 disabled:opacity-60 cursor-pointer"
                  >
                    {ytLoading ? (
                      <SpinnerGap className="h-4 w-4 animate-spin" />
                    ) : (
                      <MagnifyingGlass weight="bold" className="h-4 w-4" />
                    )}
                    ดึงคำบรรยาย
                  </button>
                </div>

                {/* Quick 1-click showcase buttons (TH + EN) */}
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[#cbb89d]">
                  <span>ลองเล่นทันที:</span>
                  {BUILT_IN_CASES.filter((c) => c.sourceKind === 'youtube').map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        onSelectDossier(preset);
                        onClose();
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#d4af37]/40 bg-[#d4af37]/15 px-2.5 py-1 font-semibold text-[#f2d583] hover:bg-[#d4af37]/25 cursor-pointer"
                    >
                      <Play weight="fill" className="h-3 w-3" />
                      {preset.language === 'th' ? 'ตัวอย่าง YouTube ไทย' : 'ตัวอย่าง TEDx อังกฤษ (+แปล)'}
                    </button>
                  ))}
                </div>
              </div>

              {ytNotice && (
                <div className="flex items-start gap-2.5 rounded-xl border border-[#d4af37]/40 bg-[#2a1f12] p-3.5 text-xs leading-relaxed text-[#f2dfb8]">
                  <WarningCircle weight="fill" className="mt-0.5 h-4 w-4 shrink-0 text-[#f2d583]" />
                  <span>{ytNotice}</span>
                </div>
              )}

              {ytMeta && (
                <div className="flex items-center gap-3 rounded-xl border border-white/15 bg-black/35 p-3">
                  <img
                    src={ytMeta.thumbnailUrl}
                    alt={ytMeta.title}
                    className="h-16 w-28 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="inline-flex items-center gap-1 text-[11px] font-bold text-[#68e0a8]">
                      <CheckCircle weight="fill" className="h-3.5 w-3.5" />
                      เชื่อมต่อวิดีโอ YouTube สำเร็จ
                    </div>
                    <div className="truncate text-sm font-bold text-white">{ytMeta.title}</div>
                    <div className="text-xs text-[#b5a38b]">{ytMeta.author}</div>
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-[#d4af37]/25 bg-black/35 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-bold text-[#f2d583]">
                      วางคำบรรยายจาก YouTube (รองรับ Timestamp อัตโนมัติ) หรืออัปโหลดไฟล์ .SRT / .VTT
                    </div>
                    <p className="mt-0.5 text-[11px] text-[#b09d84]">
                      วิธีดึงซับจากคลิปใดก็ได้ใน 3 วิ: เปิดคลิป YouTube → กด &quot;เพิ่มเติม&quot; ใต้คลิป → &quot;แสดงข้อความถอดเสียง / Show transcript&quot; → ก๊อปมาวางที่นี่ เกมจะอ่านเสียงพากย์ให้คุณพิมพ์ตามทันที!
                    </p>
                  </div>
                  <label className="inline-flex items-center gap-1.5 rounded-lg border border-[#d4af37]/40 bg-[#d4af37]/15 px-3 py-1.5 text-xs font-semibold text-[#f2d583] hover:bg-[#d4af37]/25 cursor-pointer">
                    <UploadSimple weight="bold" className="h-3.5 w-3.5" />
                    เลือกไฟล์ .SRT / .VTT
                    <input
                      type="file"
                      accept=".srt,.vtt,.txt"
                      onChange={(e) => handleSubtitleFileUpload(e, 'youtube')}
                      className="hidden"
                    />
                  </label>
                </div>

                <textarea
                  rows={5}
                  value={ytManualTranscript}
                  onChange={(e) => setYtManualTranscript(e.target.value)}
                  placeholder={`ตัวอย่างรูปแบบที่รองรับทันที:\n0:00\nสวัสดีทุกคน วันนี้เราจะมาพูดเรื่องการฝึกพิมพ์สัมผัส\n0:05\nลองพิมพ์ตามเสียงพากย์ไปพร้อมกันเลยครับ`}
                  className="mt-3 w-full rounded-xl border border-white/15 bg-black/50 p-3 font-mono-num text-xs text-[#f5efe6] placeholder-[#7d6c57] focus:border-[#f2d583] focus:outline-none"
                />

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-[#d7c6ae]">
                    <input
                      type="checkbox"
                      checked={ytSaveToMyStages}
                      onChange={(e) => setYtSaveToMyStages(e.target.checked)}
                      className="accent-[#d4af37]"
                    />
                    บันทึกเก็บไว้เป็นด่านถาวรใน &quot;ด่านของฉัน&quot;
                  </label>

                  <button
                    type="button"
                    disabled={!ytManualTranscript.trim()}
                    onClick={handleStartYoutubeWithPastedTranscript}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#2ea673] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[#38bd84] disabled:opacity-40 cursor-pointer"
                  >
                    <Play weight="fill" className="h-4 w-4" />
                    เริ่มพิมพ์ตามเสียงคำบรรยายคลิปนี้
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 3: WIKIPEDIA LIVE + TRENDING TODAY ================= */}
          {tab === 'wikipedia' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-[#d4af37]/30 bg-black/35 p-4">
                <div className="flex items-center gap-2 text-sm font-bold text-[#f2d583]">
                  <GlobeHemisphereWest weight="duotone" className="h-5 w-5" />
                  วางลิงก์วิกิพีเดีย (TH / EN) หรือค้นหาหัวข้อสดๆ
                </div>
                <p className="mt-1 text-xs text-[#b5a38b]">
                  คัดกรองเฉพาะภาษาที่พิมพ์ได้ 100% — เลือกหัวข้อฮิตประจำวันด้านล่างเพื่อเจอคำศัพท์จริงไม่ซ้ำทุกวัน!
                </p>

                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <input
                    type="text"
                    value={wikiInput}
                    onChange={(e) => setWikiInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleWikiSubmit()}
                    placeholder="วางลิงก์ https://th.wikipedia.org/wiki/... หรือพิมพ์คำค้น เช่น กฎหมาย, SpaceX"
                    className="flex-1 rounded-xl border border-[#d4af37]/30 bg-black/50 px-3.5 py-2.5 text-sm text-white placeholder-[#8c7a64] focus:border-[#f2d583] focus:outline-none"
                  />
                  <select
                    value={wikiLang}
                    onChange={(e) => setWikiLang(e.target.value as Language)}
                    className="rounded-xl border border-[#d4af37]/30 bg-[#1a130e] px-3 py-2.5 text-sm text-[#f5efe6]"
                  >
                    <option value="th">วิกิไทย (TH เท่านั้น)</option>
                    <option value="en">วิกิอังกฤษ (EN + แปลไทย)</option>
                  </select>
                  <select
                    value={wikiLength}
                    onChange={(e) => setWikiLength(Number(e.target.value))}
                    className="rounded-xl border border-[#d4af37]/30 bg-[#1a130e] px-3 py-2.5 text-sm text-[#f5efe6]"
                  >
                    <option value={4}>สั้น (4 ประโยค)</option>
                    <option value={6}>กลาง (6 ประโยค)</option>
                    <option value={10}>ยาว (10 ประโยค)</option>
                  </select>
                  <button
                    type="button"
                    disabled={wikiLoading}
                    onClick={handleWikiSubmit}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#e4c25e] to-[#b88f28] px-5 py-2.5 text-sm font-bold text-[#140e07] transition hover:brightness-110 disabled:opacity-60 cursor-pointer"
                  >
                    {wikiLoading ? (
                      <SpinnerGap className="h-4 w-4 animate-spin" />
                    ) : (
                      <MagnifyingGlass weight="bold" className="h-4 w-4" />
                    )}
                    ค้นหา / โหลด
                  </button>
                </div>

                {/* Live Trending Topics Today */}
                <div className="mt-3.5 border-t border-white/10 pt-3">
                  <div className="mb-2 flex items-center gap-1.5 text-xs font-bold text-[#88ebb9]">
                    <TrendUp weight="bold" className="h-4 w-4" />
                    หัวข้อฮิตสดใหม่ประจำวัน ({wikiLang === 'th' ? 'วิกิพีเดียไทย' : 'English Wikipedia'}):
                    {loadingTrending && <SpinnerGap className="h-3.5 w-3.5 animate-spin" />}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(trendingTopics.length > 0
                      ? trendingTopics.map((t) => t.title)
                      : wikiLang === 'th'
                      ? ['ศาลฎีกา', 'ปัญญาประดิษฐ์', 'อยุธยา', 'ดาราศาสตร์', 'กาแฟ', 'รถไฟความเร็วสูง']
                      : ['Supreme Court', 'Artificial intelligence', 'Sherlock Holmes', 'Stoicism', 'Voyager 1']
                    ).map((topic) => (
                      <button
                        key={topic}
                        type="button"
                        onClick={() => handlePickWikiTitle(topic)}
                        className="rounded-full border border-[#d4af37]/30 bg-[#d4af37]/10 px-2.5 py-1 text-xs font-medium text-[#f2d583] transition hover:bg-[#d4af37]/25 cursor-pointer"
                      >
                        {topic}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {wikiError && (
                <div className="rounded-xl border border-[#d94141]/45 bg-[#3b1212] p-3 text-xs text-[#ffd0d0]">
                  {wikiError}
                </div>
              )}

              {wikiResults.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-[#cbb89d]">
                    ผลการค้นหา — คลิกเพื่อนำเข้าสู่สำนวนทันที:
                  </div>
                  {wikiResults.map((item) => (
                    <button
                      key={item.pageid}
                      type="button"
                      onClick={() => handlePickWikiTitle(item.title)}
                      className="flex w-full items-start justify-between gap-3 rounded-xl border border-white/10 bg-[#1c1510] p-3.5 text-left transition hover:border-[#f2d583] hover:bg-[#261c15] cursor-pointer"
                    >
                      <div>
                        <div className="text-sm font-bold text-[#f2d583]">{item.title}</div>
                        <p className="mt-1 line-clamp-2 text-xs text-[#baa78d]">{item.snippet}...</p>
                      </div>
                      <Play weight="fill" className="mt-1 h-4 w-4 shrink-0 text-[#f2d583]" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ================= TAB 4: SMART RANDOM GENERATOR ================= */}
          {tab === 'random' && (
            <div className="space-y-4">
              <p className="text-xs text-[#cbb89d]">
                สุ่มเนื้อหาคาดเดาไม่ได้แบบเรียลไทม์จากวิกิพีเดียทั่วโลก (กรองเฉพาะภาษาที่พิมพ์ได้ 100%) หรือคลังเรื่องจริงที่อัปเดตไว้!
              </p>

              {randError && (
                <div className="rounded-xl border border-[#d94141]/45 bg-[#3b1212] p-3 text-xs text-[#ffd0d0]">
                  {randError}
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={Boolean(randLoading)}
                  onClick={() => handleRandomWiki('th')}
                  className="group flex flex-col justify-between rounded-2xl border border-[#3d75b5]/45 bg-gradient-to-br from-[#132236] to-[#16110d] p-5 text-left transition hover:border-[#78b4f5] cursor-pointer"
                >
                  <div>
                    <div className="inline-flex items-center gap-2 text-sm font-bold text-[#9bc6f7]">
                      {randLoading === 'wiki-th' ? (
                        <SpinnerGap className="h-5 w-5 animate-spin" />
                      ) : (
                        <GlobeHemisphereWest weight="duotone" className="h-5 w-5" />
                      )}
                      สุ่มสดจาก Wikipedia ภาษาไทย (ไทยล้วน)
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-[#c6d4e6]">
                      สุ่มคำศัพท์จริงไม่ซ้ำทุกครั้ง กรองภาษาอื่นออกหมด พร้อมเสียงอ่านตามวรรคตอนอัตโนมัติ
                    </p>
                  </div>
                  <div className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[#f2d583]">
                    <Shuffle weight="bold" className="h-4 w-4" /> สุ่มเลยตอนนี้
                  </div>
                </button>

                <button
                  type="button"
                  disabled={Boolean(randLoading)}
                  onClick={() => handleRandomWiki('en')}
                  className="group flex flex-col justify-between rounded-2xl border border-[#2ea673]/45 bg-gradient-to-br from-[#102b20] to-[#16110d] p-5 text-left transition hover:border-[#6ce6b1] cursor-pointer"
                >
                  <div>
                    <div className="inline-flex items-center gap-2 text-sm font-bold text-[#88ebb9]">
                      {randLoading === 'wiki-en' ? (
                        <SpinnerGap className="h-5 w-5 animate-spin" />
                      ) : (
                        <GlobeHemisphereWest weight="duotone" className="h-5 w-5" />
                      )}
                      สุ่มสด Wikipedia อังกฤษ + แปลไทย
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-[#c2e0d2]">
                      สุ่มบทความอังกฤษสดๆ พร้อมเสียงอ่าน แปลไทยอัตโนมัติ และพจนานุกรมคลิกคำ!
                    </p>
                  </div>
                  <div className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[#f2d583]">
                    <Shuffle weight="bold" className="h-4 w-4" /> สุ่มเลยตอนนี้
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleRandomOffline('th')}
                  className="flex flex-col justify-between rounded-2xl border border-[#d4af37]/35 bg-[#1d150f] p-5 text-left transition hover:border-[#f2d583] cursor-pointer"
                >
                  <div>
                    <div className="inline-flex items-center gap-2 text-sm font-bold text-[#f2d583]">
                      <Scales weight="duotone" className="h-5 w-5" />
                      สุ่มด่านคดี / ข่าว / ประชุม / พอดแคสต์ (ภาษาไทย)
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-[#cbb89d]">
                      สุ่มจากคลังด่านพากย์เสียง Neural จริง ทั้งคดีศาล ข่าวด่วน ประชุมงาน พอดแคสต์ และด่านที่คุณบันทึกไว้
                    </p>
                  </div>
                  <div className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[#f2d583]">
                    <Shuffle weight="bold" className="h-4 w-4" /> สุ่มด่านไทย
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleRandomOffline('en')}
                  className="flex flex-col justify-between rounded-2xl border border-[#d4af37]/35 bg-[#1d150f] p-5 text-left transition hover:border-[#f2d583] cursor-pointer"
                >
                  <div>
                    <div className="inline-flex items-center gap-2 text-sm font-bold text-[#f2d583]">
                      <BookOpen weight="duotone" className="h-5 w-5" />
                      สุ่มด่านคดี / ประชุม / พอดแคสต์ (English + แปลไทย)
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-[#cbb89d]">
                      สุ่มด่านภาษาอังกฤษพากย์เสียง Neural พร้อมคำแปลไทยและแบบทดสอบคำศัพท์ท้ายด่าน
                    </p>
                  </div>
                  <div className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[#f2d583]">
                    <Shuffle weight="bold" className="h-4 w-4" /> สุ่มด่านอังกฤษ
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* ================= TAB 5: CUSTOM CREATE STAGE / FILE IMPORT ================= */}
          {tab === 'custom' && (
            <div className="space-y-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-[#cbb89d]">
                  สร้างด่านใหม่ของคุณเองจากข่าว บทความ บทพูด สคริปต์เรียน หรืออัปโหลดไฟล์ .TXT / .SRT / .VTT
                </span>
                <label className="inline-flex items-center gap-1.5 rounded-lg border border-[#d4af37]/40 bg-[#d4af37]/15 px-3 py-1.5 text-xs font-semibold text-[#f2d583] hover:bg-[#d4af37]/25 cursor-pointer">
                  <UploadSimple weight="bold" className="h-3.5 w-3.5" />
                  นำเข้าไฟล์ .TXT / .SRT / .VTT
                  <input
                    type="file"
                    accept=".txt,.srt,.vtt"
                    onChange={(e) => handleSubtitleFileUpload(e, 'custom')}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="ตั้งชื่อด่าน (เช่น สคริปต์ข่าววันนี้, คำศัพท์สอบ IELTS)"
                  className="flex-1 rounded-xl border border-[#d4af37]/30 bg-black/45 px-3.5 py-2 text-sm text-white placeholder-[#8c7a64] focus:border-[#f2d583] focus:outline-none"
                />
                <select
                  value={customLang}
                  onChange={(e) => setCustomLang(e.target.value as 'auto' | Language)}
                  className="rounded-xl border border-[#d4af37]/30 bg-[#1a130e] px-3 py-2 text-sm text-[#f5efe6]"
                >
                  <option value="auto">ตรวจจับภาษาอัตโนมัติ</option>
                  <option value="th">บังคับเป็นภาษาไทย</option>
                  <option value="en">บังคับเป็นภาษาอังกฤษ (+ แปลไทย)</option>
                </select>
              </div>

              <textarea
                rows={7}
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="วางข้อความภาษาไทยหรือภาษาอังกฤษที่ต้องการให้เกมอ่านออกเสียงและฝึกพิมพ์ตามที่นี่..."
                className="w-full rounded-xl border border-[#d4af37]/30 bg-black/45 p-3.5 text-sm text-[#f5efe6] placeholder-[#8c7a64] focus:border-[#f2d583] focus:outline-none"
              />

              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-[#d7c6ae]">
                  <input
                    type="checkbox"
                    checked={customSaveStage}
                    onChange={(e) => setCustomSaveStage(e.target.checked)}
                    className="accent-[#d4af37]"
                  />
                  <FloppyDisk className="h-4 w-4 text-[#f2d583]" />
                  บันทึกเก็บไว้ใน &quot;ด่านของฉัน&quot; เพื่อกลับมาเล่นซ้ำหรือส่งออกให้เพื่อนได้
                </label>

                <button
                  type="button"
                  disabled={!customText.trim()}
                  onClick={handleStartCustom}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-[#e4c25e] to-[#b88f28] px-6 py-2.5 text-sm font-bold text-[#140e07] transition hover:brightness-110 disabled:opacity-40 cursor-pointer"
                >
                  <Play weight="fill" className="h-4 w-4" />
                  เริ่มพิมพ์ตามเสียงด่านนี้
                </button>
              </div>
            </div>
          )}

          {/* ================= TAB 6: MY CUSTOM STAGES & GOOGLE SHEET LIVE STAGE FEED ================= */}
          {tab === 'mystages' && (
            <div className="space-y-5">
              {/* Google Sheet Live Community Stages */}
              <div className="rounded-xl border border-[#2ea673]/35 bg-[#10241b]/70 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-bold text-[#88ebb9]">
                      <Table weight="fill" className="h-4 w-4" />
                      อัปเดตด่านใหม่สดจาก Google Sheet (แท็บ CourtScribe_Stages)
                    </div>
                    <p className="mt-0.5 text-[11px] text-[#b8dcc8]">
                      เพิ่มด่านใหม่ให้ทุกคนเล่นได้ทันทีแค่พิมพ์แถวใหม่ใน Google Sheet (คอลัมน์: title | language | category | youtubeUrl | text) ไม่ต้องแก้โค้ด!
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={loadingSheetStages}
                    onClick={handleFetchSheetStages}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#2ea673] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#38bd84] disabled:opacity-60 cursor-pointer"
                  >
                    {loadingSheetStages ? (
                      <SpinnerGap className="h-4 w-4 animate-spin" />
                    ) : (
                      <Table weight="bold" className="h-4 w-4" />
                    )}
                    ดึงด่านล่าสุดจาก Google Sheet
                  </button>
                </div>

                {sheetStageMsg && (
                  <p className="mt-2.5 rounded-lg bg-black/35 px-3 py-2 text-xs text-[#f2dfb8]">
                    {sheetStageMsg}
                  </p>
                )}

                {sheetStages.length > 0 && (
                  <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                    {sheetStages.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          onSelectDossier(s);
                          onClose();
                        }}
                        className="flex items-center justify-between gap-2 rounded-xl border border-[#2ea673]/40 bg-black/40 p-3 text-left hover:border-[#88ebb9] cursor-pointer"
                      >
                        <div className="min-w-0">
                          <div className="truncate text-xs font-bold text-white">{s.title}</div>
                          <div className="mt-0.5 text-[11px] text-[#88ebb9]">
                            {s.language === 'th' ? 'ไทย' : 'EN'} · {s.lines.length} ประโยค · {s.category}
                          </div>
                        </div>
                        <Play weight="fill" className="h-4 w-4 shrink-0 text-[#88ebb9]" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* User's Saved Custom Stages */}
              <div>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm font-bold text-[#f2d583]">
                    ด่านที่คุณสร้างและบันทึกไว้ ({customStages.length} ด่าน)
                  </div>
                  <div className="flex items-center gap-2">
                    {customStages.length > 0 && (
                      <button
                        type="button"
                        onClick={handleExportStagesJson}
                        className="inline-flex items-center gap-1 rounded-lg border border-[#d4af37]/40 bg-[#d4af37]/15 px-2.5 py-1.5 text-xs font-semibold text-[#f2d583] hover:bg-[#d4af37]/25 cursor-pointer"
                      >
                        <DownloadSimple className="h-3.5 w-3.5" />
                        ส่งออกชุดด่าน (.JSON)
                      </button>
                    )}
                    <label className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-[#e5d8c3] hover:bg-white/10 cursor-pointer">
                      <UploadSimple className="h-3.5 w-3.5" />
                      นำเข้าชุดด่านเพื่อน
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImportStagesJson}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {customStages.length === 0 ? (
                  <div className="rounded-xl border border-white/10 bg-black/30 p-8 text-center text-xs text-[#a8957c]">
                    ยังไม่มีด่านที่บันทึกไว้ — ลองนำเข้าคำบรรยายจากแท็บ <strong className="text-[#f2d583]">YouTube คำบรรยาย</strong> หรือสร้างด่านใหม่ในแท็บ <strong className="text-[#f2d583]">สร้างด่านเอง / ไฟล์</strong> หรือกดปุ่มบันทึกด่านระหว่างเล่นครับ!
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {customStages.map((s) => (
                      <div
                        key={s.id}
                        className="flex flex-col justify-between rounded-xl border border-[#d4af37]/25 bg-[#1b140f] p-3.5"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="rounded bg-[#d4af37]/15 px-2 py-0.5 text-[10px] font-bold text-[#f2d583]">
                              {s.youtubeId ? 'YOUTUBE' : s.language === 'th' ? 'ด่านไทย' : 'EN STAGE'}
                            </span>
                            <span className="text-[11px] text-[#9e8c73]">{s.lines.length} ประโยค</span>
                          </div>
                          <div className="mt-2 truncate text-sm font-bold text-white">{s.title}</div>
                          <p className="mt-1 line-clamp-2 text-xs text-[#baa78d]">
                            {s.lines[0]?.text}
                          </p>
                        </div>
                        <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2.5">
                          <button
                            type="button"
                            onClick={() => onDeleteCustomStage(s.id)}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-[#b89595] hover:bg-[#d94141]/20 hover:text-[#ff9999] cursor-pointer"
                          >
                            <Trash className="h-3.5 w-3.5" />
                            ลบ
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onSelectDossier(s);
                              onClose();
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-[#d4af37] px-3 py-1.5 text-xs font-extrabold text-[#140e07] hover:bg-[#f2d583] cursor-pointer"
                          >
                            <Play weight="fill" className="h-3.5 w-3.5" />
                            เล่นด่านนี้
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
