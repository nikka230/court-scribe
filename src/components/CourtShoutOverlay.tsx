import type { CourtShout } from '../types/game';

interface Props {
  shout: CourtShout | null;
}

export function CourtShoutOverlay({ shout }: Props) {
  if (!shout) return null;

  const styles = {
    gold: {
      bg: 'from-[#3f2c0b]/95 via-[#7d5a17]/95 to-[#3f2c0b]/95',
      border: 'border-[#f2d583]',
      text: 'text-[#fff3cc]',
      glow: 'shadow-[0_0_50px_rgba(212,175,55,0.65)]',
    },
    crimson: {
      bg: 'from-[#4d0f0f]/95 via-[#9c2323]/95 to-[#4d0f0f]/95',
      border: 'border-[#ff9999]',
      text: 'text-[#fff0f0]',
      glow: 'shadow-[0_0_50px_rgba(217,65,65,0.68)]',
    },
    emerald: {
      bg: 'from-[#0d3826]/95 via-[#1f7550]/95 to-[#0d3826]/95',
      border: 'border-[#7ff0be]',
      text: 'text-[#eafff5]',
      glow: 'shadow-[0_0_50px_rgba(46,166,115,0.62)]',
    },
  }[shout.variant];

  return (
    <div
      key={shout.id}
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-24 z-40 flex justify-center px-4"
    >
      <div
        className={`animate-shout-slam rounded-lg border-2 bg-gradient-to-r px-8 py-3 text-center ${styles.bg} ${styles.border} ${styles.glow}`}
      >
        <div
          className={`font-display text-2xl font-extrabold tracking-[0.22em] uppercase sm:text-3xl ${styles.text}`}
        >
          {shout.label}
        </div>
        {shout.sublabel && (
          <div className="mt-0.5 text-xs font-medium tracking-wider text-white/90 sm:text-sm">
            {shout.sublabel}
          </div>
        )}
      </div>
    </div>
  );
}
