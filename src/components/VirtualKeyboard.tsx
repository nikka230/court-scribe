import { useMemo } from 'react';
import {
  FINGER_META,
  KEYBOARD_ROWS,
  isThaiCombiningMark,
  lookupKeyForChar,
  type FingerId,
} from '../data/keyboardLayouts';

function formatKeyCapGlyph(ch: string): string {
  if (!ch) return '';
  return isThaiCombiningMark(ch) ? `◌${ch}` : ch;
}
import type { Language } from '../types/game';

interface Props {
  language: Language;
  nextChar: string;
  lastPressedCode: string | null;
  lastHitState: 'idle' | 'hit' | 'miss';
  showFingerHands: boolean;
  shiftHeld: boolean;
}

export function VirtualKeyboard({
  language,
  nextChar,
  lastPressedCode,
  lastHitState,
  showFingerHands,
  shiftHeld,
}: Props) {
  const lookup = useMemo(
    () => (nextChar ? lookupKeyForChar(nextChar, language) : null),
    [nextChar, language]
  );

  const activeFinger: FingerId | null = lookup ? lookup.keyDef.finger : null;
  const shiftFinger: FingerId | null =
    lookup?.recommendedShift === 'ShiftLeft'
      ? 'L-pinky'
      : lookup?.recommendedShift === 'ShiftRight'
      ? 'R-pinky'
      : null;

  return (
    <section
      aria-label="แป้นพิมพ์จำลองช่วยฝึกพิมพ์สัมผัส"
      className="brass-panel-glass relative overflow-hidden rounded-2xl p-3 sm:p-4"
    >
      {/* Top keyboard info strip */}
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#cbb89d]">
        <div className="flex items-center gap-2">
          <span className="font-display font-bold tracking-widest text-[#f2d583] uppercase">
            {language === 'th' ? 'KEDMANEE · แป้นพิมพ์เกษมณี' : 'US QWERTY · TOUCH TYPING GUIDE'}
          </span>
          {lookup?.needsShift && (
            <span className="rounded bg-[#b83232]/85 px-2 py-0.5 text-[10px] font-bold text-white">
              กดค้าง {lookup.recommendedShift === 'ShiftLeft' ? 'Shift ซ้าย' : 'Shift ขวา'}
            </span>
          )}
        </div>

        {/* Finger legend pills (desktop) */}
        <div className="hidden flex-wrap items-center gap-2 md:flex">
          {(
            [
              ['L-pinky', 'ก้อยซ้าย'],
              ['L-ring', 'นางซ้าย'],
              ['L-middle', 'กลางซ้าย'],
              ['L-index', 'ชี้ซ้าย'],
              ['R-index', 'ชี้ขวา'],
              ['R-middle', 'กลางขวา'],
              ['R-ring', 'นางขวา'],
              ['R-pinky', 'ก้อยขวา'],
            ] as const
          ).map(([fid, label]) => {
            const isHighlighted = activeFinger === fid || shiftFinger === fid;
            return (
              <span
                key={fid}
                className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 transition ${
                  isHighlighted
                    ? 'bg-white/15 font-bold text-white ring-1 ring-[#f2d583]/60'
                    : 'opacity-70'
                }`}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: FINGER_META[fid].color }}
                />
                {label}
              </span>
            );
          })}
        </div>
      </div>

      {/* Sculpted Keyboard Grid */}
      <div className="mx-auto flex max-w-[880px] flex-col gap-1.5 select-none">
        {KEYBOARD_ROWS.map((row, rowIdx) => (
          <div key={rowIdx} className="flex justify-center gap-1 sm:gap-1.5">
            {row.map((key) => {
              const isTarget = lookup?.keyDef.code === key.code;
              const isShiftTarget = lookup?.recommendedShift === key.code;
              const isPressed = lastPressedCode === key.code;
              const fingerMeta = FINGER_META[key.finger];

              const primary =
                language === 'th'
                  ? shiftHeld || (isTarget && lookup?.needsShift)
                    ? key.thShift
                    : key.th
                  : shiftHeld || (isTarget && lookup?.needsShift)
                  ? key.enShift
                  : key.en;

              const secondary =
                language === 'th'
                  ? shiftHeld || (isTarget && lookup?.needsShift)
                    ? key.th
                    : key.thShift
                  : shiftHeld || (isTarget && lookup?.needsShift)
                  ? key.en
                  : key.enShift;

              let stateClass = '';
              if (isPressed && lastHitState === 'hit') stateClass = 'keycap-pressed-hit';
              else if (isPressed && lastHitState === 'miss') stateClass = 'keycap-pressed-miss';
              else if (isTarget) stateClass = 'keycap-active';
              else if (isShiftTarget) stateClass = 'keycap-shift-needed';

              const flexGrow = key.width ?? 1;

              return (
                <div
                  key={key.code}
                  style={{ flex: `${flexGrow} 1 0%` }}
                  className={`keycap relative flex h-10 flex-col justify-between overflow-hidden rounded-lg px-1.5 py-1 sm:h-12 ${stateClass}`}
                >
                  {/* Finger zone color strip on bottom edge */}
                  {!key.isModifier && !isTarget && (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-x-1.5 bottom-0.5 h-[2.5px] rounded-full opacity-75"
                      style={{ backgroundColor: fingerMeta.color }}
                    />
                  )}

                  {key.isModifier || key.code === 'Space' ? (
                    <div className="flex h-full items-center justify-center text-[10px] font-bold tracking-wider text-[#cbb89d] sm:text-[11px]">
                      <span className={isTarget || isShiftTarget ? 'text-current' : ''}>
                        {key.label}
                      </span>
                    </div>
                  ) : (
                    <>
                      {/* Top row: Shifted character + tiny English anchor when in Thai mode */}
                      <div className="flex items-start justify-between leading-none">
                        <span
                          className={`text-[9px] font-medium sm:text-[10px] ${
                            isTarget
                              ? 'text-[#3b2805]/80'
                              : 'text-[#a38f74]'
                          }`}
                        >
                          {formatKeyCapGlyph(secondary)}
                        </span>
                        {language === 'th' && (
                          <span
                            className={`font-mono-num text-[8px] uppercase ${
                              isTarget ? 'text-[#3b2805]/60' : 'text-[#73614c]'
                            }`}
                          >
                            {key.en}
                          </span>
                        )}
                      </div>

                      {/* Main character */}
                      <div
                        className={`text-center text-sm font-bold leading-none sm:text-base ${
                          isTarget ? 'text-[#140d05]' : 'text-[#f5ecdc]'
                        }`}
                      >
                        {formatKeyCapGlyph(primary)}
                      </div>

                      {/* Tactile Home-Row Bump (F / ด and J / ่) */}
                      {key.homeBump && (
                        <span
                          aria-hidden="true"
                          className={`mx-auto h-[2px] w-3 rounded-full ${
                            isTarget ? 'bg-[#2a1c06]' : 'bg-[#f2d583]/75'
                          }`}
                        />
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Interactive Stylized Dual-Hand Finger Guide SVG */}
      {showFingerHands && (
        <div className="mt-3 flex items-center justify-center gap-6 sm:gap-12">
          <HandSilhouette
            side="left"
            activeFinger={activeFinger}
            shiftFinger={shiftFinger}
          />
          <div className="hidden flex-col items-center text-center sm:flex">
            <span className="text-[10px] font-semibold tracking-widest text-[#9d8b74] uppercase">
              นิ้วที่ต้องกด
            </span>
            <span className="mt-0.5 text-sm font-bold text-[#f2d583]">
              {activeFinger ? FINGER_META[activeFinger].nameTh : 'พร้อมพิมพ์'}
            </span>
            {shiftFinger && (
              <span className="mt-0.5 text-[11px] font-semibold text-[#ff9999]">
                + {FINGER_META[shiftFinger].nameTh} (Shift)
              </span>
            )}
          </div>
          <HandSilhouette
            side="right"
            activeFinger={activeFinger}
            shiftFinger={shiftFinger}
          />
        </div>
      )}
    </section>
  );
}

function HandSilhouette({
  side,
  activeFinger,
  shiftFinger,
}: {
  side: 'left' | 'right';
  activeFinger: FingerId | null;
  shiftFinger: FingerId | null;
}) {
  const fingers: Array<{ id: FingerId; x: number; y: number; h: number }> =
    side === 'left'
      ? [
          { id: 'L-pinky', x: 14, y: 22, h: 30 },
          { id: 'L-ring', x: 32, y: 12, h: 38 },
          { id: 'L-middle', x: 50, y: 6, h: 43 },
          { id: 'L-index', x: 68, y: 14, h: 36 },
          { id: 'thumb', x: 88, y: 38, h: 24 },
        ]
      : [
          { id: 'thumb', x: 12, y: 38, h: 24 },
          { id: 'R-index', x: 32, y: 14, h: 36 },
          { id: 'R-middle', x: 50, y: 6, h: 43 },
          { id: 'R-ring', x: 68, y: 12, h: 38 },
          { id: 'R-pinky', x: 86, y: 22, h: 30 },
        ];

  return (
    <svg
      viewBox="0 0 112 76"
      className="h-14 w-24 opacity-95 sm:h-16 sm:w-28"
      aria-hidden="true"
    >
      {/* Palm silhouette */}
      <rect
        x={side === 'left' ? 14 : 26}
        y="44"
        width="72"
        height="28"
        rx="13"
        fill="#241b14"
        stroke="rgba(212,175,55,0.28)"
        strokeWidth="1.2"
      />
      {fingers.map((f) => {
        const isMain = activeFinger === f.id;
        const isShift = shiftFinger === f.id;
        const meta = FINGER_META[f.id];
        const fill = isMain
          ? '#f2d583'
          : isShift
          ? '#d94141'
          : '#2b2119';
        const stroke = isMain
          ? '#fff6d6'
          : isShift
          ? '#ffb3b3'
          : meta.color;

        return (
          <g key={`${side}-${f.id}`}>
            <rect
              x={f.x}
              y={f.y}
              width="13"
              height={f.h}
              rx="6.5"
              fill={fill}
              stroke={stroke}
              strokeWidth={isMain || isShift ? '2' : '1.2'}
              style={{
                filter: isMain
                  ? 'drop-shadow(0 0 6px rgba(242,213,131,0.85))'
                  : isShift
                  ? 'drop-shadow(0 0 6px rgba(217,65,65,0.85))'
                  : undefined,
                transition: 'all 120ms ease',
              }}
            />
          </g>
        );
      })}
    </svg>
  );
}
