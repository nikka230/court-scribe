import type { SoundProfile } from '../types/game';

class CourtAudioEngine {
  private ctx: AudioContext | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    if (!this.noiseBuffer && this.ctx) {
      const sampleRate = this.ctx.sampleRate;
      const length = Math.floor(sampleRate * 0.25);
      const buf = this.ctx.createBuffer(1, length, sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < length; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      this.noiseBuffer = buf;
    }
    return this.ctx;
  }

  public playKeyHit(combo: number, profile: SoundProfile, volume: number): void {
    if (profile === 'silent' || volume <= 0) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.noiseBuffer) return;

    const now = ctx.currentTime;
    const gainMaster = Math.min(1, Math.max(0.05, volume)) * 0.35;
    const pitchBoost = Math.min(combo, 40) * 4.5;
    const jitter = (Math.random() - 0.5) * 45;

    if (profile === 'brass-typewriter') {
      // Crisp mechanical hammer strike (bandpassed noise burst)
      const noise = ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2400 + pitchBoost * 5 + jitter, now);
      filter.Q.setValueAtTime(2.6, now);

      const env = ctx.createGain();
      env.gain.setValueAtTime(0.001, now);
      env.gain.exponentialRampToValueAtTime(gainMaster * 1.15, now + 0.004);
      env.gain.exponentialRampToValueAtTime(0.001, now + 0.042);

      noise.connect(filter);
      filter.connect(env);
      env.connect(ctx.destination);
      noise.start(now);
      noise.stop(now + 0.05);

      // Subtle brass body ping
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(620 + pitchBoost + jitter * 0.4, now);
      osc.frequency.exponentialRampToValueAtTime(190, now + 0.032);

      const oscGain = ctx.createGain();
      oscGain.gain.setValueAtTime(gainMaster * 0.42, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

      osc.connect(oscGain);
      oscGain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.04);
    } else {
      // Deep warm mechanical keyboard "thock"
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(235 + pitchBoost * 0.6 + jitter * 0.3, now);
      osc.frequency.exponentialRampToValueAtTime(75, now + 0.045);

      const oscGain = ctx.createGain();
      oscGain.gain.setValueAtTime(gainMaster * 0.85, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(oscGain);
      oscGain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.055);

      const click = ctx.createBufferSource();
      click.buffer = this.noiseBuffer;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(1450 + jitter, now);

      const cg = ctx.createGain();
      cg.gain.setValueAtTime(gainMaster * 0.45, now);
      cg.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

      click.connect(lp);
      lp.connect(cg);
      cg.connect(ctx.destination);
      click.start(now);
      click.stop(now + 0.03);
    }
  }

  public playKeyError(profile: SoundProfile, volume: number): void {
    if (profile === 'silent' || volume <= 0) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const g = Math.min(1, Math.max(0.05, volume)) * 0.25;

    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(145, now);
    osc.frequency.exponentialRampToValueAtTime(88, now + 0.09);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(420, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(g, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.11);
  }

  public playLineBell(profile: SoundProfile, volume: number): void {
    if (profile === 'silent' || volume <= 0) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const g = Math.min(1, Math.max(0.05, volume)) * 0.22;

    // Authentic vintage brass typewriter carriage return bell
    const freqs = [1840, 3695];
    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(g / (idx + 1), now);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + (idx === 0 ? 0.55 : 0.28));

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.58);
    });
  }

  public playGavelStrike(profile: SoundProfile, volume: number, doubleStrike = true): void {
    if (profile === 'silent' || volume <= 0) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.noiseBuffer) return;

    const strikes = doubleStrike ? [0, 0.2] : [0];
    const g = Math.min(1, Math.max(0.05, volume)) * 0.48;

    strikes.forEach((delay) => {
      const t = ctx.currentTime + delay;
      // Resonant oak wood knock
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(165, t);
      osc.frequency.exponentialRampToValueAtTime(52, t + 0.16);

      const og = ctx.createGain();
      og.gain.setValueAtTime(g, t);
      og.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

      osc.connect(og);
      og.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.24);

      // Sharp crack impact
      const noise = ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(860, t);
      bp.Q.setValueAtTime(1.4, t);

      const ng = ctx.createGain();
      ng.gain.setValueAtTime(g * 0.8, t);
      ng.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

      noise.connect(bp);
      bp.connect(ng);
      ng.connect(ctx.destination);
      noise.start(t);
      noise.stop(t + 0.11);
    });
  }

  public playComboFanfare(profile: SoundProfile, volume: number): void {
    if (profile === 'silent' || volume <= 0) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const g = Math.min(1, Math.max(0.05, volume)) * 0.16;
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5 warm chime

    notes.forEach((freq, i) => {
      const t = now + i * 0.055;
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(g, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0008, t + 0.42);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.45);
    });
  }

  public playWaxStamp(profile: SoundProfile, volume: number): void {
    if (profile === 'silent' || volume <= 0) return;
    this.playGavelStrike(profile, volume * 0.9, false);
    setTimeout(() => this.playComboFanfare(profile, volume * 1.1), 110);
  }
}

export const audioEngine = new CourtAudioEngine();
