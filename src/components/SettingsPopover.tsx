import {
  X,
  SpeakerHigh,
  Keyboard,
  Hand,
  Gavel,
  Sparkle,
  TextAa,
  Waveform,
} from '@phosphor-icons/react';
import type { SoundProfile, UserSettings } from '../types/game';

interface Props {
  open: boolean;
  onClose: () => void;
  settings: UserSettings;
  onChange: (patch: Partial<UserSettings>) => void;
}

export function SettingsModal({ open, onClose, settings, onChange }: Props) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="ตั้งค่าห้องพิจารณาคดีและแป้นพิมพ์"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="brass-panel max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-2xl p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#d4af37]/25 pb-3.5">
          <div>
            <h2 className="font-display text-lg font-bold tracking-wider text-[#f2d583]">
              CHAMBER SETTINGS · ตั้งค่าเกม
            </h2>
            <p className="text-xs text-[#bba88e]">ปรับแต่งเสียงพากย์ตัวละคร เสียงพิมพ์ดีด และแป้นพิมพ์</p>
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

        <div className="mt-4 space-y-4 text-sm">
          {/* Character Voice Settings */}
          <div className="space-y-3 rounded-xl border border-[#d4af37]/30 bg-black/35 p-3.5">
            <div className="flex items-center gap-2 text-xs font-bold text-[#f2d583]">
              <Waveform weight="duotone" className="h-4 w-4" />
              เสียงพากย์ตัวละครศาล (ผู้พิพากษา / อัยการ / ทนาย / พยาน)
            </div>

            <ToggleRow
              icon={<SpeakerHigh className="h-4 w-4 text-[#f2d583]" />}
              label="เล่นเสียงตัวละครอัตโนมัติทุกประโยค"
              desc="เปิดเสียงพากย์ตรงตามคาแรคเตอร์ทั้งไทยและอังกฤษให้พิมพ์ตามเสียงได้ทันที (กด F2 เล่นซ้ำ)"
              checked={settings.autoVoiceEnabled}
              onToggle={(v) => onChange({ autoVoiceEnabled: v })}
            />

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-[#d7c6ae]">ความเร็วเสียงพากย์ตัวละคร</span>
              <div className="inline-flex overflow-hidden rounded-lg border border-white/15 bg-black/40 text-xs">
                {[0.75, 0.85, 1.0, 1.15].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => onChange({ voiceRate: r, ttsRate: r })}
                    className={`px-2.5 py-1 font-semibold cursor-pointer ${
                      Math.abs(settings.voiceRate - r) < 0.03
                        ? 'bg-[#d4af37] text-[#140e07]'
                        : 'text-[#cbb89d] hover:bg-white/10'
                    }`}
                  >
                    {r}x
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Game Mode */}
          <div className="rounded-xl border border-white/10 bg-black/30 p-3.5">
            <div className="flex items-center gap-2 text-xs font-bold text-[#f2d583]">
              <Gavel weight="duotone" className="h-4 w-4" />
              โหมดการเล่น (Courtroom Mode)
            </div>
            <div className="mt-2.5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onChange({ gameMode: 'trial' })}
                className={`rounded-xl border p-2.5 text-left text-xs transition cursor-pointer ${
                  settings.gameMode === 'trial'
                    ? 'border-[#f2d583] bg-[#d4af37]/20 text-white'
                    : 'border-white/10 bg-white/5 text-[#cbb89d]'
                }`}
              >
                <div className="font-bold">โหมดไต่สวน (Trial)</div>
                <div className="mt-0.5 text-[11px] opacity-80">มีเกจความนิ่งศาล เสียงค้อน และคอมโบสุดเดือด</div>
              </button>
              <button
                type="button"
                onClick={() => onChange({ gameMode: 'zen' })}
                className={`rounded-xl border p-2.5 text-left text-xs transition cursor-pointer ${
                  settings.gameMode === 'zen'
                    ? 'border-[#66dfa6] bg-[#2ea673]/20 text-white'
                    : 'border-white/10 bg-white/5 text-[#cbb89d]'
                }`}
              >
                <div className="font-bold">โหมดฝึกอิสระ (Zen)</div>
                <div className="mt-0.5 text-[11px] opacity-80">สบายๆ ไม่กดดัน เน้นความแม่นยำและฝึกแปล</div>
              </button>
            </div>
          </div>

          {/* Sound Profile & Volume */}
          <div className="rounded-xl border border-white/10 bg-black/30 p-3.5">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 text-xs font-bold text-[#f2d583]">
                <SpeakerHigh weight="duotone" className="h-4 w-4" />
                เสียงเอฟเฟกต์พิมพ์ดีด &amp; ระดับเสียงรวม
              </span>
              <span className="font-mono-num text-xs text-[#cbb89d]">
                {Math.round(settings.volume * 100)}%
              </span>
            </div>

            <div className="mt-2.5 grid grid-cols-3 gap-1.5">
              {(
                [
                  ['brass-typewriter', 'เครื่องพิมพ์ดีด'],
                  ['mechanical-thock', 'คีย์บอร์ด Thock'],
                  ['silent', 'ปิดเสียงพิมพ์'],
                ] as Array<[SoundProfile, string]>
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => onChange({ soundProfile: id })}
                  className={`rounded-lg border px-2 py-2 text-xs font-semibold transition cursor-pointer ${
                    settings.soundProfile === id
                      ? 'border-[#f2d583] bg-[#d4af37]/20 text-[#fff3cc]'
                      : 'border-white/10 bg-white/5 text-[#baa78d]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.volume}
              onChange={(e) => onChange({ volume: parseFloat(e.target.value) })}
              aria-label="ระดับเสียง"
              className="mt-3 w-full accent-[#d4af37]"
            />
          </div>

          {/* Keyboard & Finger Guides */}
          <div className="space-y-2.5 rounded-xl border border-white/10 bg-black/30 p-3.5">
            <div className="flex items-center gap-2 text-xs font-bold text-[#f2d583]">
              <Keyboard weight="duotone" className="h-4 w-4" />
              ระบบช่วยเหลือแป้นพิมพ์สัมผัส
            </div>

            <ToggleRow
              icon={<Keyboard className="h-4 w-4 text-[#f2d583]" />}
              label="แสดงแป้นพิมพ์จำลอง 3 มิติ"
              desc="โชว์ตำแหน่งปุ่มถัดไปและปุ่ม Shift สีทอง"
              checked={settings.showKeyboard}
              onToggle={(v) => onChange({ showKeyboard: v })}
            />
            <ToggleRow
              icon={<Hand className="h-4 w-4 text-[#f2d583]" />}
              label="แสดงแผนภาพนิ้วมือ 10 นิ้ว"
              desc="ช่วยจำว่านิ้วไหนต้องกดปุ่มไหนอย่างถูกหลัก"
              checked={settings.showFingerHands}
              onToggle={(v) => onChange({ showFingerHands: v })}
            />
            <ToggleRow
              icon={<Sparkle className="h-4 w-4 text-[#68e0a8]" />}
              label="พิมพ์ได้เลยไม่ต้องสลับภาษา OS (Auto-Layout)"
              desc="แปลงปุ่มกดทางกายภาพเป็นไทย/อังกฤษให้อัตโนมัติตามสำนวน"
              checked={settings.autoLayoutMapping}
              onToggle={(v) => onChange({ autoLayoutMapping: v })}
            />
          </div>

          {/* Font Size & Motion */}
          <div className="space-y-3 rounded-xl border border-white/10 bg-black/30 p-3.5">
            <div className="flex items-center justify-between pt-1">
              <span className="inline-flex items-center gap-1.5 text-xs text-[#d7c6ae]">
                <TextAa className="h-4 w-4 text-[#f2d583]" />
                ขนาดตัวอักษรบนกระดาษสำนวน
              </span>
              <div className="inline-flex overflow-hidden rounded-lg border border-white/15 bg-black/40 text-xs">
                {(
                  [
                    ['md', 'กลาง'],
                    ['lg', 'ใหญ่'],
                    ['xl', 'ใหญ่มาก'],
                  ] as const
                ).map(([sz, label]) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => onChange({ fontSize: sz })}
                    className={`px-3 py-1 font-semibold cursor-pointer ${
                      settings.fontSize === sz
                        ? 'bg-[#d4af37] text-[#140e07]'
                        : 'text-[#cbb89d] hover:bg-white/10'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <ToggleRow
              icon={<Sparkle className="h-4 w-4 text-[#cbb89d]" />}
              label="ลดเอฟเฟกต์การเคลื่อนไหว (Reduced Motion)"
              desc="ปิดละอองแสงพื้นหลังและแรงสั่นสะเทือนค้อนศาล"
              checked={settings.reducedMotion}
              onToggle={(v) => onChange({ reducedMotion: v })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ToggleRow({
  icon,
  label,
  desc,
  checked,
  onToggle,
}: {
  icon: React.ReactNode;
  label: string;
  desc: string;
  checked: boolean;
  onToggle: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 py-1">
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 shrink-0">{icon}</span>
        <div>
          <div className="text-xs font-semibold text-[#f5efe6]">{label}</div>
          <div className="text-[11px] text-[#9e8c73]">{desc}</div>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onToggle(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition cursor-pointer ${
          checked ? 'bg-[#d4af37]' : 'bg-white/15'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-[#15100b] shadow transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </label>
  );
}
