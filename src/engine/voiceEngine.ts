import type { Language, SpeakerRole } from '../types/game';

export const CHARACTER_VOICE_META: Record<
  SpeakerRole,
  {
    badgeTh: string;
    badgeEn: string;
    ttsPitch: number;
    ttsRateMul: number;
    preferredEn: RegExp;
    preferredTh: RegExp;
  }
> = {
  judge: {
    badgeTh: 'เสียงผู้พิพากษา · ทุ้มสุขุม',
    badgeEn: 'Judge Voice · Deep Authoritative',
    ttsPitch: 0.76,
    ttsRateMul: 0.88,
    preferredEn: /ryan|george|daniel|christopher|guy|male/i,
    preferredTh: /niwat|male/i,
  },
  prosecutor: {
    badgeTh: 'เสียงอัยการ · เฉียบคมเร้าใจ',
    badgeEn: 'Prosecutor Voice · Sharp & Brisk',
    ttsPitch: 0.94,
    ttsRateMul: 1.08,
    preferredEn: /christopher|david|mark|guy|male/i,
    preferredTh: /niwat|male/i,
  },
  defense: {
    badgeTh: 'เสียงทนาย · นุ่มนวลมั่นใจ',
    badgeEn: 'Defense Voice · Calm & Crisp',
    ttsPitch: 1.06,
    ttsRateMul: 0.96,
    preferredEn: /andrew|brian|alex|google us english/i,
    preferredTh: /niwat|premwadee/i,
  },
  witness: {
    badgeTh: 'เสียงพยาน · ชัดเจนจริงจัง',
    badgeEn: 'Witness Voice · Earnest & Expressive',
    ttsPitch: 1.15,
    ttsRateMul: 1.04,
    preferredEn: /brian|eric|aria|jenny|samantha/i,
    preferredTh: /premwadee|niwat/i,
  },
};

export interface VoicePlayOptions {
  lineId: string;
  text: string;
  lang: Language;
  speaker: SpeakerRole;
  rate: number;
  volume: number;
  onStart?: () => void;
  onEnd?: () => void;
  onAutoplayBlocked?: () => void;
}

class CourtVoiceEngine {
  private audio: HTMLAudioElement | null = null;
  private activeToken = 0;
  private missingIds = new Set<string>();

  public stop(): void {
    this.activeToken += 1;
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.audio.onended = null;
      this.audio.onerror = null;
      this.audio = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
  }

  /**
   * Plays character-matched studio neural MP3 (./voices/<lineId>.mp3) when available,
   * seamlessly falling back to character-tuned Web Speech API for dynamic Wikipedia/Custom text.
   */
  public async playLine(opts: VoicePlayOptions): Promise<'mp3' | 'tts' | 'blocked'> {
    this.stop();
    const token = this.activeToken;

    if (!opts.text.trim() || opts.volume <= 0) {
      opts.onEnd?.();
      return 'tts';
    }

    // Attempt pre-generated Neural MP3 first (unless known missing or running file:// without voices)
    const canTryMp3 =
      typeof window !== 'undefined' &&
      window.location.protocol !== 'file:' &&
      !this.missingIds.has(opts.lineId) &&
      /^[a-z0-9-]+$/i.test(opts.lineId);

    if (canTryMp3) {
      const mp3Result = await this.tryPlayMp3(opts, token);
      if (token !== this.activeToken) return 'mp3';
      if (mp3Result === 'played') return 'mp3';
      if (mp3Result === 'blocked') {
        opts.onAutoplayBlocked?.();
        opts.onEnd?.();
        return 'blocked';
      }
      // 404 or decode error -> cache as missing so dynamic Wikipedia lines don't re-request
      this.missingIds.add(opts.lineId);
    }

    // Fallback: Character-tuned Web Speech API (works for ANY dynamic Wikipedia/Custom/Random sentence!)
    this.playWebSpeech(opts, token);
    return 'tts';
  }

  private tryPlayMp3(
    opts: VoicePlayOptions,
    token: number
  ): Promise<'played' | 'missing' | 'blocked'> {
    return new Promise((resolve) => {
      const url = `./voices/${encodeURIComponent(opts.lineId)}.mp3`;
      const audio = new Audio();
      audio.preload = 'auto';
      audio.src = url;
      audio.volume = Math.min(1, Math.max(0.1, opts.volume));
      audio.playbackRate = Math.min(1.4, Math.max(0.65, opts.rate));
      this.audio = audio;

      let settled = false;
      const finish = (status: 'played' | 'missing' | 'blocked') => {
        if (settled) return;
        settled = true;
        resolve(status);
      };

      audio.onended = () => {
        if (token === this.activeToken) {
          opts.onEnd?.();
        }
      };

      audio.onerror = () => {
        finish('missing');
      };

      audio
        .play()
        .then(() => {
          if (token !== this.activeToken) {
            audio.pause();
            finish('played');
            return;
          }
          opts.onStart?.();
          finish('played');
        })
        .catch((err: unknown) => {
          const name = err instanceof Error ? err.name : '';
          if (name === 'NotAllowedError') {
            finish('blocked');
          } else {
            finish('missing');
          }
        });
    });
  }

  private playWebSpeech(opts: VoicePlayOptions, token: number): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      opts.onEnd?.();
      return;
    }

    try {
      const meta = CHARACTER_VOICE_META[opts.speaker] || CHARACTER_VOICE_META.witness;
      const utter = new SpeechSynthesisUtterance(opts.text);
      utter.lang = opts.lang === 'th' ? 'th-TH' : 'en-US';
      utter.pitch = meta.ttsPitch;
      utter.rate = Math.min(1.4, Math.max(0.65, opts.rate * meta.ttsRateMul));
      utter.volume = Math.min(1, Math.max(0.1, opts.volume));

      const voices = window.speechSynthesis.getVoices();
      const prefix = opts.lang === 'th' ? 'th' : 'en';
      const matcher = opts.lang === 'th' ? meta.preferredTh : meta.preferredEn;

      const langVoices = voices.filter((v) => v.lang.toLowerCase().startsWith(prefix));
      const picked =
        langVoices.find((v) => matcher.test(v.name) && /natural|online|google|neural/i.test(v.name)) ||
        langVoices.find((v) => matcher.test(v.name)) ||
        langVoices.find((v) => /natural|online|google|neural/i.test(v.name)) ||
        langVoices[0];

      if (picked) utter.voice = picked;

      utter.onstart = () => {
        if (token === this.activeToken) opts.onStart?.();
      };
      utter.onend = () => {
        if (token === this.activeToken) opts.onEnd?.();
      };
      utter.onerror = () => {
        if (token === this.activeToken) opts.onEnd?.();
      };

      window.speechSynthesis.speak(utter);
    } catch {
      opts.onEnd?.();
    }
  }
}

export const voiceEngine = new CourtVoiceEngine();
