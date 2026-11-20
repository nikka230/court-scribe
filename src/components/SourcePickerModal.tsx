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
  CheckCircle,
  WarningCircle,
  Play,
  BookOpen,
} from '@phosphor-icons/react';
import type { CaseDossier, Language } from '../types/game';
import { BUILT_IN_CASES, OFFLINE_RANDOM_GEMS } from '../data/builtInCases';
import {
  detectTextLanguage,
  extractYouTubeId,
  fetchYouTubeMetadata,
  loadRandomWikipediaCase,
  loadWikipediaCase,
  parseSubtitleOrTranscript,
  searchWikipedia,
  tryAutoFetchYouTubeCaptions,
  type WikiSearchItem,
  type YouTubeMetadata,
} from '../engine/contentLoaders';

type TabId = 'cases' | 'youtube' | 'wikipedia' | 'random' | 'custom';

interface Props {
  open: boolean;
  onClose: () => void;
  onSelectDossier: (dossier: CaseDossier) => void;
  initialTab?: TabId;
}

export function SourcePickerModal({
  open,
  onClose,
  onSelectDossier,
  initialTab = 'cases',
}: Props) {
  const [tab, setTab] = useState<TabId>(initialTab);
  const [caseFilterLang, setCaseFilterLang] = useState<'all' | Language>('all');

  useEffect(() => {
    if (open) setTab(initialTab);
  }, [open, initialTab]);

  // YouTube state
  const [ytInput, setYtInput] = useState('');
  const [ytLang, setYtLang] = useState<Language>('en');
  const [ytLoading, setYtLoading] = useState(false);
  const [ytMeta, setYtMeta] = useState<YouTubeMetadata | null>(null);
  const [ytNotice, setYtNotice] = useState<string | null>(null);
  const [ytManualTranscript, setYtManualTranscript] = useState('');

  // Wikipedia state
  const [wikiInput, setWikiInput] = useState('');
  const [wikiLang, setWikiLang] = useState<Language>('th');
  const [wikiLength, setWikiLength] = useState<number>(6);
  const [wikiLoading, setWikiLoading] = useState(false);
  const [wikiResults, setWikiResults] = useState<WikiSearchItem[]>([]);
  const [wikiError, setWikiError] = useState<string | null>(null);

  // Random state
  const [randLoading, setRandLoading] = useState<string | null>(null);
  const [randError, setRandError] = useState<string | null>(null);

  // Custom paste/file state
  const [customTitle, setCustomTitle] = useState('');
  const [customText, setCustomText] = useState('');
  const [customLang, setCustomLang] = useState<'auto' | Language>('auto');

  if (!open) return null;

  const filteredCases = BUILT_IN_CASES.filter(
    (c) => caseFilterLang === 'all' || c.language === caseFilterLang
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
          subtitle: `คำบรรยายจากคลิปโดย ${meta.author} (ซิงก์เวลาอัตโนมัติ)`,
          language: autoResult.detectedLang,
          sourceKind: 'youtube',
          difficulty: 'senior',
          category: 'YouTube ซิงก์คำบรรยาย',
          youtubeId: id,
          sourceUrl: `https://www.youtube.com/watch?v=${id}`,
          lines: autoResult.lines,
        };
        onSelectDossier(dossier);
        onClose();
        return;
      }

      setYtNotice(
        'โหลดข้อมูลวิดีโอสำเร็จแล้ว! แต่เนื่องจากเกมนี้รันบนเว็บโดยไม่ต้องมีเซิร์ฟเวอร์ด้านหลัง และ YouTube บล็อกการดึงคำบรรยายข้ามโดเมนในคลิปนี้ — เพียงกด "Show transcript" ใต้คลิป YouTube แล้วก๊อปวาง (หรือโยนไฟล์ .SRT/.VTT) ลงช่องด้านล่าง ระบบจะซิงก์เวลากับวิดีโอให้ทันที!'
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

    onSelectDossier({
      id: `yt-custom-${id || Date.now()}-${Date.now()}`,
      caseCode: 'EXHIBIT YT',
      title: ytMeta?.title || 'YouTube Transcript Session',
      subtitle: id
        ? `วิดีโอ YouTube ซิงก์คำบรรยาย (${detected === 'en' ? 'พร้อมฝึกแปลไทย' : 'ภาษาไทย'})`
        : 'คำบรรยายวิดีโอที่นำเข้า',
      language: detected,
      sourceKind: 'youtube',
      difficulty: 'senior',
      category: 'YouTube ซิงก์คำบรรยาย',
      youtubeId: id || undefined,
      sourceUrl: id ? `https://www.youtube.com/watch?v=${id}` : undefined,
      lines,
    });
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
      // If it looks like a Wikipedia URL, load directly!
      if (/wikipedia\.org\/wiki\//i.test(trimmed)) {
        const dossier = await loadWikipediaCase(trimmed, wikiLang, wikiLength);
        onSelectDossier(dossier);
        onClose();
        return;
      }

      // Otherwise search Wikipedia and show results
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
    const pool = [...BUILT_IN_CASES, ...OFFLINE_RANDOM_GEMS].filter(
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

    onSelectDossier({
      id: `custom-${Date.now()}`,
      caseCode: 'EXHIBIT CUSTOM',
      title: customTitle.trim() || (lang === 'th' ? 'เอกสารสำนวนที่นำเข้าเอง' : 'Custom Imported Transcript'),
      subtitle:
        lang === 'en'
          ? 'ข้อความนำเข้าเอง — รองรับแปลไทยอัตโนมัติและพจนานุกรมคลิกคำ'
          : 'ข้อความภาษาไทยที่นำเข้าเอง',
      language: lang,
      sourceKind: 'custom',
      difficulty: 'senior',
      category: 'เอกสารนำเข้าเอง',
      lines,
    });
    onClose();
  };

  const tabs: Array<{ id: TabId; label: string; icon: typeof Scales }> = [
    { id: 'cases', label: 'แฟ้มคดี & ฝึกนิ้ว', icon: Scales },
    { id: 'youtube', label: 'YouTube คำบรรยาย', icon: YoutubeLogo },
    { id: 'wikipedia', label: 'Wikipedia สด', icon: GlobeHemisphereWest },
    { id: 'random', label: 'สุ่มอัจฉริยะ', icon: Shuffle },
    { id: 'custom', label: 'วางข้อความ / ไฟล์', icon: FileText },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="เลือกคดีและแหล่งข้อความสำหรับฝึกพิมพ์"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-5"
      onClick={onClose}
    >
      <div
        className="brass-panel flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#d4af37]/25 bg-[#1b140f] px-5 py-4">
          <div>
            <h2 className="font-display text-lg font-bold tracking-wider text-[#f2d583] sm:text-xl">
              COURT ARCHIVE · เลือกสำนวนและแหล่งข้อความ
            </h2>
            <p className="mt-0.5 text-xs text-[#bba88e]">
              ทุกแหล่งข้อมูลทำงานบนเบราว์เซอร์โดยตรง 100% — ไม่ต้องรันเซิร์ฟเวอร์ด้านหลัง
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
                className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition cursor-pointer sm:text-sm ${
                  active
                    ? 'bg-gradient-to-b from-[#e4c25e] to-[#b88f28] text-[#140e07] shadow-[0_0_16px_rgba(212,175,55,0.4)]'
                    : 'border border-white/10 bg-white/5 text-[#d7c6ae] hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon weight={active ? 'fill' : 'duotone'} className="h-4 w-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* ================= TAB 1: BUILT-IN CASES & DRILLS ================= */}
          {tab === 'cases' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-[#cbb89d]">
                  เลือกคดีจำลองในศาล แบบฝึกหัดวางนิ้ว หรือตัวอย่าง YouTube พร้อมเล่นทันที (รองรับออฟไลน์ 100%)
                </span>
                <div className="inline-flex overflow-hidden rounded-lg border border-[#d4af37]/30 bg-black/40 text-xs font-semibold">
                  {(
                    [
                      ['all', 'ทั้งหมด'],
                      ['th', 'ภาษาไทย'],
                      ['en', 'English (ฝึกอ่าน-แปล)'],
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
                            {c.lines.length} บรรทัด
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
                        เริ่มบันทึกคดี
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ================= TAB 2: YOUTUBE LINK ================= */}
          {tab === 'youtube' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-[#d94141]/35 bg-[#261212]/70 p-4">
                <div className="flex items-center gap-2 text-sm font-bold text-[#ffbdbd]">
                  <YoutubeLogo weight="fill" className="h-5 w-5 text-[#ff5252]" />
                  แปะลิงก์ YouTube เพื่อพิมพ์ตามคำบรรยายคลิปพร้อมจอวิดีโอซิงก์เวลา
                </div>

                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <input
                    type="url"
                    value={ytInput}
                    onChange={(e) => setYtInput(e.target.value)}
                    placeholder="วางลิงก์ YouTube เช่น https://www.youtube.com/watch?v=5MgBikgcWnY"
                    className="flex-1 rounded-xl border border-[#d4af37]/30 bg-black/50 px-3.5 py-2.5 text-sm text-white placeholder-[#8c7a64] focus:border-[#f2d583] focus:outline-none"
                  />
                  <select
                    value={ytLang}
                    onChange={(e) => setYtLang(e.target.value as Language)}
                    className="rounded-xl border border-[#d4af37]/30 bg-[#1a130e] px-3 py-2.5 text-sm text-[#f5efe6] focus:border-[#f2d583] focus:outline-none"
                  >
                    <option value="en">ซับอังกฤษ (+ แปลไทย)</option>
                    <option value="th">ซับภาษาไทย</option>
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

                {/* Quick 1-click showcase button */}
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[#cbb89d]">
                  <span>อยากลองทันที?</span>
                  <button
                    type="button"
                    onClick={() => {
                      const preset = BUILT_IN_CASES.find((c) => c.sourceKind === 'youtube');
                      if (preset) {
                        onSelectDossier(preset);
                        onClose();
                      }
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-[#d4af37]/40 bg-[#d4af37]/15 px-2.5 py-1 font-semibold text-[#f2d583] hover:bg-[#d4af37]/25 cursor-pointer"
                  >
                    <Play weight="fill" className="h-3 w-3" />
                    เล่นตัวอย่าง TEDx (ซิงก์เวลาพร้อมคำแปลไทย)
                  </button>
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

              {/* Zero-Backend Guaranteed Transcript Paste / SRT Upload Box */}
              <div className="rounded-xl border border-[#d4af37]/25 bg-black/35 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-bold text-[#f2d583]">
                      วางคำบรรยาย YouTube (รองรับ Timestamp อัตโนมัติ) หรืออัปโหลดไฟล์ .SRT / .VTT
                    </div>
                    <p className="mt-0.5 text-[11px] text-[#b09d84]">
                      วิธีดึงซับจากคลิป YouTube ใดก็ได้ใน 3 วินาที: เปิดคลิป YouTube → กดปุ่ม &quot;เพิ่มเติม / More&quot; ใต้คลิป → กด &quot;แสดงข้อความถอดเสียง / Show transcript&quot; → คัดลอกมาวางที่นี่!
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
                  placeholder={`ตัวอย่างรูปแบบที่รองรับทันที:\n0:00\nWelcome back to the courtroom archive.\n0:05\nToday we examine the key testimony...`}
                  className="mt-3 w-full rounded-xl border border-white/15 bg-black/50 p-3 font-mono-num text-xs text-[#f5efe6] placeholder-[#7d6c57] focus:border-[#f2d583] focus:outline-none"
                />

                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    disabled={!ytManualTranscript.trim()}
                    onClick={handleStartYoutubeWithPastedTranscript}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#2ea673] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[#38bd84] disabled:opacity-40 cursor-pointer"
                  >
                    <Play weight="fill" className="h-4 w-4" />
                    เริ่มฝึกพิมพ์พร้อมวิดีโอซิงก์เวลา
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 3: WIKIPEDIA LIVE ================= */}
          {tab === 'wikipedia' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-[#d4af37]/30 bg-black/35 p-4">
                <div className="flex items-center gap-2 text-sm font-bold text-[#f2d583]">
                  <GlobeHemisphereWest weight="duotone" className="h-5 w-5" />
                  วางลิงก์วิกิพีเดีย (TH / EN) หรือพิมพ์หัวข้อที่อยากค้นหา
                </div>
                <p className="mt-1 text-xs text-[#b5a38b]">
                  ดึงเนื้อหาจาก Wikipedia API โดยตรง 100% — ถ้าเป็นภาษาอังกฤษ เกมจะช่วยแปลภาษาไทยและเปิดพจนานุกรมคลิกคำให้อัตโนมัติ!
                </p>

                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <input
                    type="text"
                    value={wikiInput}
                    onChange={(e) => setWikiInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleWikiSubmit()}
                    placeholder="วางลิงก์ https://th.wikipedia.org/wiki/... หรือพิมพ์คำค้น เช่น กฎหมาย, SpaceX, Quantum"
                    className="flex-1 rounded-xl border border-[#d4af37]/30 bg-black/50 px-3.5 py-2.5 text-sm text-white placeholder-[#8c7a64] focus:border-[#f2d583] focus:outline-none"
                  />
                  <select
                    value={wikiLang}
                    onChange={(e) => setWikiLang(e.target.value as Language)}
                    className="rounded-xl border border-[#d4af37]/30 bg-[#1a130e] px-3 py-2.5 text-sm text-[#f5efe6]"
                  >
                    <option value="th">วิกิไทย (TH)</option>
                    <option value="en">วิกิอังกฤษ (EN + แปลไทย)</option>
                  </select>
                  <select
                    value={wikiLength}
                    onChange={(e) => setWikiLength(Number(e.target.value))}
                    className="rounded-xl border border-[#d4af37]/30 bg-[#1a130e] px-3 py-2.5 text-sm text-[#f5efe6]"
                  >
                    <option value={4}>สั้น (4 บรรทัด)</option>
                    <option value={6}>กลาง (6 บรรทัด)</option>
                    <option value={10}>ยาว (10 บรรทัด)</option>
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

                {/* Suggested quick topics */}
                <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-[#9e8c73]">หัวข้อแนะนำ:</span>
                  {(wikiLang === 'th'
                    ? ['ศาลฎีกา', 'ปัญญาประดิษฐ์', 'อยุธยา', 'ดาราศาสตร์', 'กาแฟ']
                    : ['Supreme Court', 'Artificial intelligence', 'Sherlock Holmes', 'Stoicism', 'Voyager 1']
                  ).map((topic) => (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => handlePickWikiTitle(topic)}
                      className="rounded-full border border-[#d4af37]/30 bg-[#d4af37]/10 px-2.5 py-0.5 text-[#f2d583] hover:bg-[#d4af37]/25 cursor-pointer"
                    >
                      {topic}
                    </button>
                  ))}
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
                    ผลการค้นหา — คลิกเพื่อนำเข้าสู่สำนวนศาลทันที:
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
                เบื่อเลือกเองใช่ไหม? ให้ศาลสุ่มบทความน่าสนใจสดๆ จากวิกิพีเดียทั่วโลก หรือคลังความรู้คัดสรรมาให้คุณฝึกพิมพ์และฝึกแปลได้ไม่รู้จบ!
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
                      สุ่มสดจาก Wikipedia ภาษาไทย
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-[#c6d4e6]">
                      สุ่มบทความคุณภาพจากสารานุกรมไทยจริงแบบเรียลไทม์ ตัดคำพร้อมพิมพ์สัมผัสทันที
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
                      สุ่มบทความอังกฤษสดๆ พร้อมระบบแปลไทยอัตโนมัติ พจนานุกรมคลิกคำ และเสียงอ่านออกเสียง!
                    </p>
                  </div>
                  <div className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[#f2d583]">
                    <Shuffle weight="bold" className="h-4 w-4" /> สุ่มเลยตอนนี้
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
                      สุ่มคลังคดี &amp; ความรู้ภาษาอังกฤษ (ออฟไลน์)
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-[#cbb89d]">
                      สุ่มเรื่องราวประวัติศาสตร์ อวกาศ กฎหมาย และบทสนทนาทำงาน พร้อมคำแปลไทยที่เกลาอย่างสละสลวยและศัพท์สำคัญ
                    </p>
                  </div>
                  <div className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[#f2d583]">
                    <Shuffle weight="bold" className="h-4 w-4" /> สุ่มคลังอังกฤษ
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
                      สุ่มคลังคดี &amp; เกร็ดความรู้ภาษาไทย (ออฟไลน์)
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-[#cbb89d]">
                      สุ่มสำนวนคดีศาลจำลองและบทความภาษาไทยคัดพิเศษ ทำงานได้ทันทีแม้ไม่มีอินเทอร์เน็ต
                    </p>
                  </div>
                  <div className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[#f2d583]">
                    <Shuffle weight="bold" className="h-4 w-4" /> สุ่มคลังไทย
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* ================= TAB 5: CUSTOM PASTE / FILE ================= */}
          {tab === 'custom' && (
            <div className="space-y-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-[#cbb89d]">
                  วางบทความ ข่าว เนื้อเพลง สคริปต์ หรืออัปโหลดไฟล์ .TXT / .SRT / .VTT เพื่อแปลงเป็นสำนวนศาลทันที
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
                  placeholder="ตั้งชื่อสำนวน (ไม่บังคับ)"
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
                placeholder="วางข้อความภาษาไทยหรือภาษาอังกฤษที่ต้องการฝึกพิมพ์ที่นี่..."
                className="w-full rounded-xl border border-[#d4af37]/30 bg-black/45 p-3.5 text-sm text-[#f5efe6] placeholder-[#8c7a64] focus:border-[#f2d583] focus:outline-none"
              />

              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={!customText.trim()}
                  onClick={handleStartCustom}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-[#e4c25e] to-[#b88f28] px-6 py-2.5 text-sm font-bold text-[#140e07] transition hover:brightness-110 disabled:opacity-40 cursor-pointer"
                >
                  <Play weight="fill" className="h-4 w-4" />
                  เปิดพิจารณาคดีด้วยข้อความนี้
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
