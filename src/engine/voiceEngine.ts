import type { Language, SpeakerRole } from '../types/game';
import { tokenizeIntoAtomicWords } from './typingEngine';

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
    badgeTh: 'เสียงผู้พิพากษา · สุขุมชัดเจน',
    badgeEn: 'Judge Voice · Calm & Authoritative',
    ttsPitch: 0.84,
    ttsRateMul: 0.96,
    preferredEn: /ryan|george|daniel|christopher|guy|male/i,
    preferredTh: /niwat|male/i,
  },
  prosecutor: {
    badgeTh: 'เสียงอัยการ · เฉียบคมมั่นใจ',
    badgeEn: 'Prosecutor Voice · Crisp & Confident',
    ttsPitch: 0.95,
    ttsRateMul: 1.03,
    preferredEn: /christopher|david|mark|guy|male/i,
    preferredTh: /niwat|male/i,
  },
  defense: {
    badgeTh: 'เสียงทนาย · นุ่มนวลเป็นธรรมชาติ',
    badgeEn: 'Defense Voice · Steady & Articulate',
    ttsPitch: 1.03,
    ttsRateMul: 0.99,
    preferredEn: /andrew|brian|alex|google us english/i,
    preferredTh: /niwat|premwadee/i,
  },
  witness: {
    badgeTh: 'เสียงพยาน · ชัดเจนเป็นกันเอง',
    badgeEn: 'Witness Voice · Natural & Clear',
    ttsPitch: 1.09,
    ttsRateMul: 1.01,
    preferredEn: /brian|eric|aria|jenny|samantha/i,
    preferredTh: /premwadee|niwat/i,
  },
};

export interface RawTimingEntry {
  t: string; // spoken word text
  s: number; // start sec
  e: number; // end sec
  a: number; // cpStart
  b: number; // cpEnd
}

export interface SpokenWordSegment {
  index: number;
  text: string;
  cpStart: number;
  cpEnd: number;
  startSec?: number;
  endSec?: number;
}

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

export interface WordVoicePlayOptions extends VoicePlayOptions {
  word: SpokenWordSegment;
}

class CourtVoiceEngine {
  private audio: HTMLAudioElement | null = null;
  private ctx: AudioContext | null = null;
  private activeSource: AudioBufferSourceNode | null = null;
  private activeGain: GainNode | null = null;
  private activeToken = 0;

  private timingsMap: Record<string, RawTimingEntry[]> | null = null;
  private timingsPromise: Promise<Record<string, RawTimingEntry[]>> | null = null;
  private bufferCache = new Map<string, AudioBuffer>();
  private loadingBuffers = new Map<string, Promise<AudioBuffer | null>>();
  private missingIds = new Set<string>();

  private ensureAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return null;
      this.ctx = new Ctx();
    }
    return this.ctx;
  }

  public stop(): void {
    this.activeToken += 1;
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.audio.onended = null;
      this.audio.onerror = null;
      this.audio = null;
    }
    if (this.activeSource) {
      try {
        if (this.activeGain && this.ctx) {
          const now = this.ctx.currentTime;
          this.activeGain.gain.cancelScheduledValues(now);
          this.activeGain.gain.setTargetAtTime(0.0001, now, 0.008);
        }
        this.activeSource.onended = null;
        this.activeSource.stop(this.ctx ? this.ctx.currentTime + 0.025 : 0);
      } catch {
        // already stopped
      }
      this.activeSource = null;
      this.activeGain = null;
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
   * Load the compact timings.json map once (only ~25KB) for sample-accurate word-by-word neural playback.
   */
  public async loadTimings(): Promise<Record<string, RawTimingEntry[]>> {
    if (this.timingsMap) return this.timingsMap;
    if (typeof window === 'undefined' || window.location.protocol === 'file:') {
      this.timingsMap = {};
      return this.timingsMap;
    }
    if (!this.timingsPromise) {
      this.timingsPromise = fetch('./voices/timings.json')
        .then((res) => (res.ok ? res.json() : {}))
        .then((data: unknown) => {
          this.timingsMap =
            data && typeof data === 'object' ? (data as Record<string, RawTimingEntry[]>) : {};
          return this.timingsMap;
        })
        .catch(() => {
          this.timingsMap = {};
          return this.timingsMap;
        });
    }
    return this.timingsPromise;
  }

  /**
   * Preload and decode a built-in line's MP3 into an AudioBuffer so word-by-word slicing has 0ms latency!
   */
  public async preloadLineBuffer(lineId: string): Promise<AudioBuffer | null> {
    if (
      typeof window === 'undefined' ||
      window.location.protocol === 'file:' ||
      this.missingIds.has(lineId) ||
      !/^[a-z0-9-]+$/i.test(lineId)
    ) {
      return null;
    }
    if (this.bufferCache.has(lineId)) {
      return this.bufferCache.get(lineId)!;
    }
    if (this.loadingBuffers.has(lineId)) {
      return this.loadingBuffers.get(lineId)!;
    }

    const p = (async () => {
      try {
        const res = await fetch(`./voices/${encodeURIComponent(lineId)}.mp3`);
        if (!res.ok) {
          this.missingIds.add(lineId);
          return null;
        }
        const arr = await res.arrayBuffer();
        const ctx = this.ensureAudioContext();
        if (!ctx) return null;
        const decoded = await ctx.decodeAudioData(arr);
        this.bufferCache.set(lineId, decoded);
        return decoded;
      } catch {
        this.missingIds.add(lineId);
        return null;
      } finally {
        this.loadingBuffers.delete(lineId);
      }
    })();

    this.loadingBuffers.set(lineId, p);
    return p;
  }

  /**
   * Return natural 3-4 word dictation phrase chunks for any line:
   * - Uses exact neural WordBoundary timestamps for built-in cases (continuous smooth phrase slice!)
   * - Breaks naturally at punctuation / audio pauses / 3-4 word rhythm without leaving 1-word orphans
   * - Works identically for dynamic Wikipedia / Random / Custom passages!
   */
  public getWordSegments(lineId: string, text: string, lang: Language): SpokenWordSegment[] {
    const rawUnits = this.getRawWordUnits(lineId, text, lang);
    return this.groupIntoDictationPhrases(rawUnits, text, lang);
  }

  private getRawWordUnits(lineId: string, text: string, lang: Language): SpokenWordSegment[] {
    const timed = this.timingsMap?.[lineId];
    if (timed && timed.length > 0) {
      return timed.map((entry, idx) => ({
        index: idx,
        text: entry.t,
        cpStart: entry.a,
        cpEnd: entry.b,
        startSec: entry.s,
        endSec: entry.e,
      }));
    }

    const tokens = tokenizeIntoAtomicWords(text, lang);
    const segments: SpokenWordSegment[] = [];

    if (lang === 'th') {
      let group: typeof tokens = [];
      const flushGroup = () => {
        if (group.length === 0) return;
        const cpStart = group[0].cpStart;
        const cpEnd = group[group.length - 1].cpEnd;
        const combinedText = group.map((g) => g.text).join('');
        if (cpEnd - cpStart <= 12) {
          segments.push({
            index: segments.length,
            text: combinedText,
            cpStart,
            cpEnd,
          });
        } else {
          for (const tok of group) {
            segments.push({
              index: segments.length,
              text: tok.text,
              cpStart: tok.cpStart,
              cpEnd: tok.cpEnd,
            });
          }
        }
        group = [];
      };

      for (const tok of tokens) {
        if (tok.isSpace) {
          flushGroup();
        } else {
          group.push(tok);
        }
      }
      flushGroup();
      return segments;
    }

    for (const tok of tokens) {
      if (tok.isSpace) continue;
      segments.push({
        index: segments.length,
        text: tok.text,
        cpStart: tok.cpStart,
        cpEnd: tok.cpEnd,
      });
    }
    return segments;
  }

  /**
   * Group word units into natural human breath/space clauses:
   * - Thai: primarily follows natural space pauses (เว้นวรรค), merging tiny <=7-char connectors
   *   and cleanly balancing extra-long unspaced clauses (>32 chars) at word boundaries!
   * - English: follows natural punctuation/breath clauses of ~4-6 words without leaving tiny orphans.
   */
  private groupIntoDictationPhrases(
    units: SpokenWordSegment[],
    fullText: string,
    lang: Language
  ): SpokenWordSegment[] {
    if (units.length === 0) return [];
    const cpArr = Array.from(fullText);

    const makePhrase = (bucket: SpokenWordSegment[], index: number): SpokenWordSegment => {
      const first = bucket[0];
      const last = bucket[bucket.length - 1];
      return {
        index,
        text: cpArr.slice(first.cpStart, last.cpEnd).join('').trim(),
        cpStart: first.cpStart,
        cpEnd: last.cpEnd,
        startSec: first.startSec,
        endSec: last.endSec,
      };
    };

    if (lang === 'th') {
      // Step 1: Split units by actual spaces (เว้นวรรค) first!
      const spaceClauses: SpokenWordSegment[][] = [];
      let cur: SpokenWordSegment[] = [];
      for (let i = 0; i < units.length; i++) {
        const u = units[i];
        const prev = units[i - 1];
        const hasSpaceBefore =
          prev !== undefined &&
          u.cpStart > prev.cpEnd &&
          cpArr.slice(prev.cpEnd, u.cpStart).join('').includes(' ');

        if (hasSpaceBefore && cur.length > 0) {
          spaceClauses.push(cur);
          cur = [u];
        } else {
          cur.push(u);
        }
      }
      if (cur.length > 0) spaceClauses.push(cur);

      // Step 2: Merge ultra-short space clauses (e.g. "ณ" + "บัดนี้", or "ไช่" + "หรือ" + "ฉั่ว")
      // into natural ~10-32 char clauses so it never sounds choppy!
      const mergedClauses: SpokenWordSegment[][] = [];
      for (const cl of spaceClauses) {
        const clLen = cl[cl.length - 1].cpEnd - cl[0].cpStart;
        const prev = mergedClauses[mergedClauses.length - 1];
        if (prev) {
          const prevLen = prev[prev.length - 1].cpEnd - prev[0].cpStart;
          if (
            (prevLen <= 9 && prevLen + clLen + 1 <= 28) ||
            (clLen <= 8 && prevLen + clLen + 1 <= 28)
          ) {
            prev.push(...cl);
            continue;
          }
        }
        mergedClauses.push([...cl]);
      }

      // Step 3: Split any unusually long unspaced Thai clause (>34 chars) cleanly at word midpoint
      const finalPhrases: SpokenWordSegment[] = [];
      for (const cl of mergedClauses) {
        const totalLen = cl[cl.length - 1].cpEnd - cl[0].cpStart;
        if (totalLen <= 34 || cl.length <= 4) {
          finalPhrases.push(makePhrase(cl, finalPhrases.length));
        } else {
          const targetChunks = Math.ceil(totalLen / 25);
          const targetLen = totalLen / targetChunks;
          let sub: SpokenWordSegment[] = [];
          for (let i = 0; i < cl.length; i++) {
            sub.push(cl[i]);
            const subLen = cl[i].cpEnd - sub[0].cpStart;
            const remaining = cl.length - 1 - i;
            if (subLen >= targetLen && remaining >= 2) {
              finalPhrases.push(makePhrase(sub, finalPhrases.length));
              sub = [];
            }
          }
          if (sub.length > 0) {
            finalPhrases.push(makePhrase(sub, finalPhrases.length));
          }
        }
      }
      return finalPhrases;
    }

    // English: natural conversational 4-6 word clauses aligned to punctuation & pauses
    if (units.length <= 5) {
      return [makePhrase(units, 0)];
    }

    const phrases: SpokenWordSegment[] = [];
    let bucket: SpokenWordSegment[] = [];

    for (let i = 0; i < units.length; i++) {
      const u = units[i];
      const next = units[i + 1];
      const remainingAfter = units.length - 1 - i;

      bucket.push(u);

      const count = bucket.length;
      const phraseLen = u.cpEnd - bucket[0].cpStart;
      const sliceText = cpArr.slice(u.cpStart, u.cpEnd).join('');

      const endsWithHardPunct = /[.!?;:]$/.test(sliceText);
      const endsWithComma = /[,]$/.test(sliceText);
      const hasAudioPauseAfter =
        next !== undefined &&
        u.endSec !== undefined &&
        next.startSec !== undefined &&
        next.startSec - u.endSec >= 0.22;

      const shouldBreak =
        (count >= 2 && endsWithHardPunct) ||
        (count >= 3 && (endsWithComma || hasAudioPauseAfter)) ||
        (count >= 4 && phraseLen >= 28) ||
        count >= 6;

      if (shouldBreak) {
        if (remainingAfter <= 2 && count <= 4) {
          continue;
        }
        phrases.push(makePhrase(bucket, phrases.length));
        bucket = [];
      }
    }

    if (bucket.length > 0) {
      phrases.push(makePhrase(bucket, phrases.length));
    }
    return phrases;
  }

  /**
   * Speak ONE specific word cleanly:
   * 1) If pre-generated neural MP3 + word timestamp exists -> sample-accurate Web Audio slice with soft fade!
   * 2) Otherwise (Wikipedia / Custom / Dynamic) -> Character-tuned Web Speech API for that single word!
   */
  public async playWord(opts: WordVoicePlayOptions): Promise<'mp3-word' | 'tts-word' | 'blocked'> {
    this.stop();
    const token = this.activeToken;

    if (!opts.word.text.trim() || opts.volume <= 0) {
      opts.onEnd?.();
      return 'tts-word';
    }

    // Path 1: Sample-accurate Neural MP3 word slice (0ms latency once preloaded!)
    if (
      opts.word.startSec !== undefined &&
      opts.word.endSec !== undefined &&
      window.location.protocol !== 'file:'
    ) {
      const buf = await this.preloadLineBuffer(opts.lineId);
      if (token !== this.activeToken) return 'mp3-word';

      if (buf) {
        const ctx = this.ensureAudioContext();
        if (ctx) {
          if (ctx.state === 'suspended') {
            try {
              await ctx.resume();
            } catch {
              // ignore
            }
          }
          if (token !== this.activeToken) return 'mp3-word';

          if (ctx.state === 'suspended') {
            opts.onAutoplayBlocked?.();
            opts.onEnd?.();
            return 'blocked';
          }

          const padBefore = 0.018;
          const padAfter = 0.055;
          const offset = Math.max(0, opts.word.startSec - padBefore);
          const endPos = Math.min(buf.duration, opts.word.endSec + padAfter);
          const sliceDur = Math.max(0.11, endPos - offset);
          const rate = Math.min(1.35, Math.max(0.7, opts.rate));
          const realDur = sliceDur / rate;

          const source = ctx.createBufferSource();
          source.buffer = buf;
          source.playbackRate.value = rate;

          const gain = ctx.createGain();
          const now = ctx.currentTime;
          const targetVol = Math.min(1, Math.max(0.15, opts.volume));
          const fadeIn = Math.min(0.012, realDur * 0.2);
          const fadeOut = Math.min(0.028, realDur * 0.25);

          gain.gain.setValueAtTime(0.001, now);
          gain.gain.linearRampToValueAtTime(targetVol, now + fadeIn);
          gain.gain.setValueAtTime(targetVol, now + Math.max(fadeIn, realDur - fadeOut));
          gain.gain.linearRampToValueAtTime(0.001, now + realDur);

          source.connect(gain);
          gain.connect(ctx.destination);

          this.activeSource = source;
          this.activeGain = gain;

          source.onended = () => {
            if (token === this.activeToken) {
              this.activeSource = null;
              this.activeGain = null;
              opts.onEnd?.();
            }
          };

          opts.onStart?.();
          source.start(now, offset, sliceDur);
          return 'mp3-word';
        }
      }
    }

    // Path 2: Clean single-word Character-Tuned Web Speech API (for Wikipedia / Random / Custom / Fallback!)
    const cleanWord = opts.word.text
      .replace(/^["'([{\s.,!?;:\-]+|["')\]}\s.,!?;:\-]+$/g, '')
      .trim();

    if (!cleanWord) {
      opts.onEnd?.();
      return 'tts-word';
    }

    this.playWebSpeech({ ...opts, text: cleanWord }, token);
    return 'tts-word';
  }

  /**
   * Plays full sentence character-matched studio neural MP3 when in Sentence Mode.
   */
  public async playLine(opts: VoicePlayOptions): Promise<'mp3' | 'tts' | 'blocked'> {
    this.stop();
    const token = this.activeToken;

    if (!opts.text.trim() || opts.volume <= 0) {
      opts.onEnd?.();
      return 'tts';
    }

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
      this.missingIds.add(opts.lineId);
    }

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
