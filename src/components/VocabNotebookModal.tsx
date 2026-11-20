import { useState } from 'react';
import {
  X,
  SpeakerHigh,
  Trash,
  Cards,
  ListBullets,
  Star,
  ArrowRight,
  Eye,
} from '@phosphor-icons/react';
import type { SavedVocabItem } from '../types/game';
import { speakText } from '../engine/translationService';

interface Props {
  open: boolean;
  onClose: () => void;
  items: SavedVocabItem[];
  onDeleteWord: (word: string) => void;
  onRateMastery: (word: string, delta: number) => void;
}

export function VocabNotebookModal({
  open,
  onClose,
  items,
  onDeleteWord,
  onRateMastery,
}: Props) {
  const [mode, setMode] = useState<'list' | 'flashcard'>('list');
  const [search, setSearch] = useState('');
  const [cardIdx, setCardIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  if (!open) return null;

  const filtered = items.filter(
    (v) =>
      v.word.toLowerCase().includes(search.toLowerCase()) ||
      v.th.toLowerCase().includes(search.toLowerCase())
  );

  const activeCard = items[cardIdx % Math.max(1, items.length)];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="สมุดคำศัพท์ภาษาอังกฤษส่วนตัว"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-5"
      onClick={onClose}
    >
      <div
        className="brass-panel flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#d4af37]/25 bg-[#1b140f] px-5 py-4">
          <div>
            <h2 className="font-display text-lg font-bold tracking-wider text-[#f2d583]">
              VOCABULARY LEDGER · สมุดคำศัพท์อังกฤษ-ไทย ({items.length})
            </h2>
            <p className="text-xs text-[#bba88e]">
              ทบทวนคำศัพท์ที่บันทึกไว้ระหว่างการฝึกพิมพ์และอ่านแปล พร้อมโหมดแฟลชการ์ด
            </p>
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

        {/* Mode bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-[#140e0a] px-5 py-2.5">
          <div className="inline-flex gap-1.5">
            <button
              type="button"
              onClick={() => setMode('list')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer ${
                mode === 'list'
                  ? 'bg-[#d4af37] text-[#140e07]'
                  : 'bg-white/5 text-[#d7c6ae] hover:bg-white/10'
              }`}
            >
              <ListBullets weight="bold" className="h-4 w-4" />
              รายการคำศัพท์
            </button>
            <button
              type="button"
              disabled={items.length === 0}
              onClick={() => {
                setMode('flashcard');
                setFlipped(false);
              }}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold disabled:opacity-40 cursor-pointer ${
                mode === 'flashcard'
                  ? 'bg-[#d4af37] text-[#140e07]'
                  : 'bg-white/5 text-[#d7c6ae] hover:bg-white/10'
              }`}
            >
              <Cards weight="bold" className="h-4 w-4" />
              ฝึกทบทวนแฟลชการ์ด
            </button>
          </div>

          {mode === 'list' && (
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาคำศัพท์..."
              className="rounded-lg border border-[#d4af37]/30 bg-black/50 px-3 py-1.5 text-xs text-white placeholder-[#8c7a64] focus:border-[#f2d583] focus:outline-none"
            />
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {items.length === 0 ? (
            <div className="py-12 text-center text-sm text-[#bba88e]">
              ยังไม่มีคำศัพท์ที่บันทึกไว้ — ลองเล่นโหมดภาษาอังกฤษแล้วคลิกคำศัพท์บนเอกสารศาลเพื่อบันทึกเก็บไว้ทบทวน!
            </div>
          ) : mode === 'list' ? (
            <div className="space-y-2.5">
              {filtered.map((item) => (
                <div
                  key={item.word}
                  className="flex items-start justify-between gap-3 rounded-xl border border-[#d4af37]/20 bg-black/35 p-3.5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-transcript-en text-base font-bold text-[#f2d583]">
                        {item.word}
                      </span>
                      {item.ipa && (
                        <span className="font-mono-num text-xs text-[#bba88e]">{item.ipa}</span>
                      )}
                      {item.pos && (
                        <span className="rounded bg-[#d4af37]/15 px-1.5 py-0.5 text-[10px] text-[#f2d583]">
                          {item.pos}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => speakText(item.word, 'en', 0.9)}
                        className="rounded bg-white/10 p-1 text-[#f2d583] hover:bg-white/20 cursor-pointer"
                        title="ฟังเสียงอ่าน"
                      >
                        <SpeakerHigh className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="mt-1 text-sm font-semibold text-[#79e3b1]">{item.th}</div>
                    {item.definition && (
                      <p className="mt-0.5 text-xs text-[#b5a38b]">{item.definition}</p>
                    )}
                    <div className="mt-1.5 flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          weight={i < item.mastery ? 'fill' : 'regular'}
                          className={`h-3.5 w-3.5 ${
                            i < item.mastery ? 'text-[#f2d583]' : 'text-white/20'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteWord(item.word)}
                    aria-label={`ลบคำว่า ${item.word}`}
                    className="rounded-lg p-2 text-[#a88e74] hover:bg-[#d94141]/20 hover:text-[#ff9999] cursor-pointer"
                  >
                    <Trash className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            activeCard && (
              <div className="flex flex-col items-center py-4">
                <div className="text-xs font-semibold text-[#bba88e]">
                  ใบที่ {(cardIdx % items.length) + 1} / {items.length}
                </div>

                <div
                  onClick={() => setFlipped((f) => !f)}
                  className="mt-4 flex min-h-[220px] w-full max-w-md cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-[#d4af37]/50 bg-gradient-to-b from-[#291e16] to-[#17110c] p-6 text-center shadow-2xl transition hover:border-[#f2d583]"
                >
                  <div className="font-transcript-en text-3xl font-extrabold text-[#f2d583]">
                    {activeCard.word}
                  </div>
                  {activeCard.ipa && (
                    <div className="mt-1 font-mono-num text-sm text-[#cbb89d]">
                      {activeCard.ipa}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      speakText(activeCard.word, 'en', 0.88);
                    }}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[#d4af37]/35 bg-[#d4af37]/15 px-3 py-1 text-xs font-semibold text-[#f2d583] hover:bg-[#d4af37]/25 cursor-pointer"
                  >
                    <SpeakerHigh weight="fill" className="h-3.5 w-3.5" />
                    ฟังเสียงออกเสียง
                  </button>

                  {flipped ? (
                    <div className="mt-5 border-t border-white/15 pt-4">
                      <div className="text-xl font-bold text-[#79e3b1]">{activeCard.th}</div>
                      {activeCard.definition && (
                        <p className="mt-1.5 text-xs text-[#cbb89d]">{activeCard.definition}</p>
                      )}
                    </div>
                  ) : (
                    <div className="mt-6 inline-flex items-center gap-1.5 text-xs text-[#9e8c73]">
                      <Eye className="h-4 w-4" />
                      คลิกที่การ์ดเพื่อเปิดดูคำแปลภาษาไทย
                    </div>
                  )}
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      onRateMastery(activeCard.word, -1);
                      setFlipped(false);
                      setCardIdx((i) => i + 1);
                    }}
                    className="rounded-xl border border-[#d94141]/45 bg-[#d94141]/15 px-4 py-2 text-xs font-bold text-[#ffb8b8] hover:bg-[#d94141]/25 cursor-pointer"
                  >
                    ยังไม่แม่น (ทวนอีก)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onRateMastery(activeCard.word, 1);
                      setFlipped(false);
                      setCardIdx((i) => i + 1);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#2ea673] px-5 py-2 text-xs font-bold text-white hover:bg-[#38bd84] cursor-pointer"
                  >
                    จำได้แม่นแล้ว!
                    <ArrowRight weight="bold" className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
