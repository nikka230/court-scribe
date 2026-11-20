import type { SavedVocabItem, SessionResult, UserProfile, UserSettings } from '../types/game';

const PROFILE_KEY = 'court_scribe_profile_v1';
const SETTINGS_KEY = 'court_scribe_settings_v1';

export interface RankInfo {
  level: number;
  titleTh: string;
  titleEn: string;
  minXp: number;
  nextXp: number | null;
}

export const COURT_RANKS: RankInfo[] = [
  { level: 1, titleTh: 'เสมียนฝึกหัดหน้าบัลลังก์', titleEn: 'Apprentice Clerk', minXp: 0, nextXp: 250 },
  { level: 2, titleTh: 'เจ้าหน้าที่บันทึกสำนวน', titleEn: 'Court Stenographer', minXp: 250, nextXp: 700 },
  { level: 3, titleTh: 'ผู้ช่วยอาลักษณ์อาวุโส', titleEn: 'Senior Legal Scribe', minXp: 700, nextXp: 1500 },
  { level: 4, titleTh: 'หัวหน้าคณะบันทึกศาลอุทธรณ์', titleEn: 'Appellate Chief Scribe', minXp: 1500, nextXp: 3000 },
  { level: 5, titleTh: 'ราชบัณฑิตแห่งบัลลังก์ฎีกา', titleEn: 'Supreme Court Grand Master', minXp: 3000, nextXp: null },
];

export function getRankForXp(xp: number): RankInfo {
  let current = COURT_RANKS[0];
  for (const r of COURT_RANKS) {
    if (xp >= r.minXp) current = r;
  }
  return current;
}

export function getDefaultProfile(): UserProfile {
  return {
    xp: 0,
    totalCharsTyped: 0,
    totalSessions: 0,
    bestWpmTh: 0,
    bestWpmEn: 0,
    streakDays: 1,
    lastPlayedDate: new Date().toISOString().slice(0, 10),
    keyStatsTh: {},
    keyStatsEn: {},
    history: [],
    vocabNotebook: [
      {
        word: 'verdict',
        ipa: '/ˈvɜːr.dɪkt/',
        pos: 'n.',
        th: 'คำพิพากษา, คำตัดสิน',
        definition: 'A formal decision on a disputed issue in a court of law.',
        addedAt: Date.now(),
        mastery: 1,
        sourceTitle: 'Starter Court Glossary',
      },
      {
        word: 'testimony',
        ipa: '/ˈtes.tɪ.mə.ni/',
        pos: 'n.',
        th: 'คำให้การ, คำเบิกความ',
        definition: 'A formal spoken or written statement given in court.',
        addedAt: Date.now(),
        mastery: 1,
        sourceTitle: 'Starter Court Glossary',
      },
    ],
  };
}

export function getDefaultSettings(): UserSettings {
  return {
    soundProfile: 'brass-typewriter',
    volume: 0.72,
    showKeyboard: true,
    showFingerHands: true,
    autoLayoutMapping: false,
    translationMode: 'visible',
    autoReadAloudEn: false,
    ttsRate: 0.95,
    gameMode: 'trial',
    reducedMotion: false,
    fontSize: 'lg',
  };
}

export function loadProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return getDefaultProfile();
    const parsed = JSON.parse(raw) as Partial<UserProfile>;
    return { ...getDefaultProfile(), ...parsed };
  } catch {
    return getDefaultProfile();
  }
}

export function saveProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // ignore storage limits
  }
}

export function loadSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return getDefaultSettings();
    return { ...getDefaultSettings(), ...JSON.parse(raw) };
  } catch {
    return getDefaultSettings();
  }
}

export function saveSettings(settings: UserSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // ignore storage limits
  }
}

export function recordSessionToProfile(
  profile: UserProfile,
  result: SessionResult,
  sessionKeyStats: Record<string, { hits: number; misses: number }>
): UserProfile {
  const today = new Date().toISOString().slice(0, 10);
  let streakDays = profile.streakDays || 1;
  if (profile.lastPlayedDate && profile.lastPlayedDate !== today) {
    const diffMs = new Date(today).getTime() - new Date(profile.lastPlayedDate).getTime();
    const diffDays = Math.round(diffMs / 86400000);
    streakDays = diffDays === 1 ? streakDays + 1 : 1;
  }

  const targetKeyMap = result.language === 'th' ? { ...profile.keyStatsTh } : { ...profile.keyStatsEn };
  Object.entries(sessionKeyStats).forEach(([k, v]) => {
    const prev = targetKeyMap[k] || { key: k, hits: 0, misses: 0, totalTimeMs: 0 };
    targetKeyMap[k] = {
      key: k,
      hits: prev.hits + v.hits,
      misses: prev.misses + v.misses,
      totalTimeMs: prev.totalTimeMs,
    };
  });

  const updated: UserProfile = {
    ...profile,
    xp: profile.xp + result.xpEarned,
    totalCharsTyped: profile.totalCharsTyped + result.correctChars,
    totalSessions: profile.totalSessions + 1,
    bestWpmTh:
      result.language === 'th' ? Math.max(profile.bestWpmTh, result.wpm) : profile.bestWpmTh,
    bestWpmEn:
      result.language === 'en' ? Math.max(profile.bestWpmEn, result.wpm) : profile.bestWpmEn,
    streakDays,
    lastPlayedDate: today,
    keyStatsTh: result.language === 'th' ? targetKeyMap : profile.keyStatsTh,
    keyStatsEn: result.language === 'en' ? targetKeyMap : profile.keyStatsEn,
    history: [result, ...profile.history].slice(0, 40),
  };

  saveProfile(updated);
  return updated;
}

export function upsertVocabInProfile(
  profile: UserProfile,
  item: Omit<SavedVocabItem, 'addedAt' | 'mastery'>
): UserProfile {
  const exists = profile.vocabNotebook.find(
    (v) => v.word.toLowerCase() === item.word.toLowerCase()
  );
  let nextNotebook: SavedVocabItem[];
  if (exists) {
    nextNotebook = profile.vocabNotebook.map((v) =>
      v.word.toLowerCase() === item.word.toLowerCase()
        ? { ...v, ...item, mastery: Math.min(5, v.mastery + 1) }
        : v
    );
  } else {
    nextNotebook = [
      { ...item, addedAt: Date.now(), mastery: 1 },
      ...profile.vocabNotebook,
    ];
  }
  const updated = { ...profile, vocabNotebook: nextNotebook };
  saveProfile(updated);
  return updated;
}
