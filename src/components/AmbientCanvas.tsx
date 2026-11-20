import { useEffect, useImperativeHandle, useRef, forwardRef } from 'react';

export interface AmbientCanvasHandle {
  burst: (color?: string, count?: number) => void;
}

interface DustMote {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  alpha: number;
  phase: number;
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

export const AmbientCanvas = forwardRef<AmbientCanvasHandle, { disabled?: boolean }>(
  function AmbientCanvas({ disabled }, ref) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const sparksRef = useRef<Spark[]>([]);

    useImperativeHandle(ref, () => ({
      burst(color = '#F2D583', count = 22) {
        if (disabled) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const cx = canvas.width * 0.5;
        const cy = canvas.height * 0.42;
        for (let i = 0; i < count; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 1.6 + Math.random() * 5.2;
          sparksRef.current.push({
            x: cx + (Math.random() - 0.5) * 180,
            y: cy + (Math.random() - 0.5) * 40,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 1.5,
            life: 0,
            maxLife: 28 + Math.random() * 26,
            size: 1.5 + Math.random() * 2.8,
            color,
          });
        }
      },
    }));

    useEffect(() => {
      if (disabled) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let animId = 0;
      const motes: DustMote[] = [];

      const resize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      };
      resize();
      window.addEventListener('resize', resize);

      for (let i = 0; i < 42; i++) {
        motes.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.35) * 0.28,
          vy: -0.08 - Math.random() * 0.22,
          r: 0.8 + Math.random() * 2.1,
          alpha: 0.1 + Math.random() * 0.32,
          phase: Math.random() * Math.PI * 2,
        });
      }

      const tick = (time: number) => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Soft drifting golden dust motes in courtroom light shafts
        for (const m of motes) {
          m.x += m.vx + Math.sin(time * 0.0005 + m.phase) * 0.12;
          m.y += m.vy;
          if (m.y < -10) {
            m.y = canvas.height + 10;
            m.x = Math.random() * canvas.width;
          }
          if (m.x > canvas.width + 10) m.x = -10;
          if (m.x < -10) m.x = canvas.width + 10;

          const twinkle = 0.65 + 0.35 * Math.sin(time * 0.0015 + m.phase);
          ctx.beginPath();
          ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(242, 213, 131, ${m.alpha * twinkle})`;
          ctx.fill();
        }

        // Milestone / Combo brass sparks
        const sparks = sparksRef.current;
        for (let i = sparks.length - 1; i >= 0; i--) {
          const s = sparks[i];
          s.life += 1;
          s.x += s.vx;
          s.y += s.vy;
          s.vy += 0.12; // subtle gravity
          s.vx *= 0.985;
          const progress = s.life / s.maxLife;
          if (progress >= 1) {
            sparks.splice(i, 1);
            continue;
          }
          ctx.save();
          ctx.globalAlpha = 1 - progress;
          ctx.fillStyle = s.color;
          ctx.shadowBlur = 8;
          ctx.shadowColor = s.color;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.size * (1 - progress * 0.4), 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        animId = requestAnimationFrame(tick);
      };

      animId = requestAnimationFrame(tick);
      return () => {
        cancelAnimationFrame(animId);
        window.removeEventListener('resize', resize);
      };
    }, [disabled]);

    if (disabled) return null;

    return (
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-20"
      />
    );
  }
);
