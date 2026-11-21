export type Language = 'th' | 'en';

export type SpeakerRole = 'judge' | 'prosecutor' | 'defense' | 'witness';

export type SourceKind =
  | 'court-case'
  | 'youtube'
  | 'wikipedia'
  | 'random'
  | 'drill'
  | 'custom';

export type Difficulty = 'novice' | 'senior' | 'supreme';

export type TranslationMode = 'visible' | 'peek' | 'blind';

export type SoundProfile = 'brass-typewriter' | 'mechanical-thock' | 'silent';

export type GameMode = 'trial' | 'zen';

export interface VocabHint {
  word: string;
  ipa?: string;
  pos?: string;
  th: string;
  definition?: string;
  example?: string;
}

export interface PassageLine {
  id: string;
  text: string;
  translationTh?: string;
  speaker?: SpeakerRole;
  speakerName?: string;
  startSec?: number;
  endSec?: number;
  vocab?: VocabHint[];
}

export interface CaseDossier {
  id: string;
  caseCode: string;
  title: string;
  subtitle?: string;
  language: Language;
  sourceKind: SourceKind;
  difficulty: Difficulty;
  category: string;
  sourceUrl?: string;
  youtubeId?: string;
  summaryTh?: string;
  lines: PassageLine[];
}

export interface ActiveChallenge {
  challengerName: string;
  targetWpm: number;
  targetAcc: number;
  targetGrade: 'S' | 'A' | 'B' | 'C';
  caseTitle: string;
}

export interface SheetScoreRow {
  timestamp: string;
  playerName: string;
  caseId: string;
  caseTitle: string;
  language: Language;
  wpm: number;
  cpm: number;
  accuracy: number;
  maxCombo: number;
  grade: 'S' | 'A' | 'B' | 'C';
  durationSec: number;
}

export interface KeyStat {
  key: string;
  hits: number;
  misses: number;
  totalTimeMs: number;
}

export interface WpmSample {
  sec: number;
  wpm: number;
  accuracy: number;
}

export interface SessionResult {
  id: string;
  timestamp: number;
  caseId: string;
  caseTitle: string;
  caseCode: string;
  language: Language;
  sourceKind: SourceKind;
  wpm: number;
  rawWpm: number;
  cpm: number;
  accuracy: number;
  maxCombo: number;
  totalChars: number;
  correctChars: number;
  errorCount: number;
  durationSec: number;
  grade: 'S' | 'A' | 'B' | 'C';
  xpEarned: number;
  isNewPersonalBest?: boolean;
  previousBestWpm?: number;
  wpmHistory: WpmSample[];
  weakKeys: Array<{ char: string; misses: number; hits: number; rate: number }>;
  vocabFromSession: VocabHint[];
}

export interface SavedVocabItem {
  word: string;
  ipa?: string;
  pos?: string;
  th: string;
  definition?: string;
  example?: string;
  addedAt: number;
  mastery: number; // 0 to 5
  sourceTitle?: string;
}

export interface UserProfile {
  playerName: string;
  googleSheetUrl: string;
  xp: number;
  totalCharsTyped: number;
  totalSessions: number;
  bestWpmTh: number;
  bestWpmEn: number;
  caseBestWpm: Record<string, number>;
  streakDays: number;
  lastPlayedDate: string;
  keyStatsTh: Record<string, KeyStat>;
  keyStatsEn: Record<string, KeyStat>;
  history: SessionResult[];
  vocabNotebook: SavedVocabItem[];
}

export interface UserSettings {
  soundProfile: SoundProfile;
  volume: number;
  showKeyboard: boolean;
  showFingerHands: boolean;
  autoLayoutMapping: boolean; // Allows typing via physical key codes without switching OS IME
  translationMode: TranslationMode;
  autoVoiceEnabled: boolean; // Auto-play character voice on every new sentence (TH & EN)
  voiceRate: number; // 0.75 - 1.25
  autoReadAloudEn: boolean; // Legacy alias kept for storage compatibility
  ttsRate: number;
  gameMode: GameMode;
  reducedMotion: boolean;
  fontSize: 'md' | 'lg' | 'xl';
}

export interface CourtShout {
  id: number;
  label: string;
  sublabel: string;
  variant: 'gold' | 'crimson' | 'emerald';
}
