// Shared domain types. Mirrors the Dexie schema (src/lib/db.ts) and the
// hosted app's backup format so exports stay import-compatible.

export type Strength = 'weak' | 'medium' | 'strong' | 'veryStrong';
export type MemStatus = 'learning' | 'memorized' | 'mastered';
export type Rating = 'again' | 'good' | 'easy';
export type Palette = 'sage' | 'ocean' | 'desert' | 'rose' | 'night';
export type ColorMode = 'light' | 'dark' | 'system';

export interface ProgressEntry {
  id: string;
  surah: number;
  fromAyah: number;
  toAyah: number;
  status: MemStatus;
  strength: Strength;
  /** Index into INTERVALS[strength]; 0..len-1. 6 stages for weak. */
  srStage: number;
  /** Next spaced-repetition review, yyyy-mm-dd, or null. */
  srDue: string | null;
  easyStreak: number;
  /** ISO date the entry stabilized (weak -> medium via completed SR cycle). */
  stabilizedAt: string | null;
  createdAt: string;
}

export interface RevisionHistoryItem {
  id: string;
  progressId: string;
  surah: number;
  fromAyah: number;
  toAyah: number;
  rating: Rating;
  reviewedAt: string; // ISO datetime
  mistakesCount: number;
}

export interface RevisionSessionItem {
  id: string;
  taskId: string;
  startedAt: string;
  endedAt: string;
  durationSec: number;
  selfRating: Rating | null;
}

export interface RevisionPlan {
  id: string;
  name: string;
  surahScope: string;
  dailyTarget: number;
  createdAt: string;
}

export interface RevisionTask {
  id: string;
  planId: string;
  surah: number;
  fromAyah: number;
  toAyah: number;
  dueDate: string; // yyyy-mm-dd
  status: 'pending' | 'done';
  priority: number;
}

export interface Mistake {
  id: string;
  surah: number;
  ayah: number;
  type: 'tajweed' | 'word' | 'order' | 'forgetting';
  note: string;
  count: number;
  lastSeen: string; // ISO
  resolved: boolean;
}

export interface Bookmark {
  id: string;
  surah: number;
  ayah: number;
  note: string;
  createdAt: string;
}

export interface FocusSession {
  id: string;
  startedAt: string;
  endedAt: string;
  durationSec: number;
  mode: 'hifz' | 'revision' | 'reading';
  linkedSurah: number | null;
}

export interface Distraction {
  id: string;
  sessionId: string | null;
  at: string; // ISO
  kind: string;
  note: string;
}

export interface DailyTask {
  id: string;
  date: string; // yyyy-mm-dd
  title: string;
  done: boolean;
  priority: number;
  linkedSurah: number | null;
  kind: 'general' | 'fixation' | 'revision';
  refId: string | null;
}

export interface RecurringTask {
  id: string;
  title: string;
  frequency: 'daily' | 'weekly';
  days: number[]; // 0=Sun..6=Sat for weekly; [] = every day for daily
  active: boolean;
}

export interface WirdCompletion {
  id: string;
  cycleStart: string; // yyyy-mm-dd of the cycle's first day
  day: number; // 1-based day in the cycle
  doneAt: string; // ISO
}

export interface FixRates {
  weak: number;
  medium: number;
  strong: number;
}

export interface Preferences {
  key: string; // always 'settings'
  palette: Palette;
  mode: ColorMode;
  rates: FixRates;
  /** Post-fixation review cycle for stabilized surahs: 15 or 10 days. */
  fixationReviewCycle: 15 | 10;
  wirdCycleDays: number;
  /** yyyy-mm-dd of the current rotating-wird cycle's first day (null = not started). */
  wirdCycleStart: string | null;
  dailyMinutes: number;
  sampleLoaded: boolean;
}

export const STRENGTH_LABEL: Record<Strength, string> = {
  weak: 'ضعيف',
  medium: 'متوسط',
  strong: 'قوي',
  veryStrong: 'متقن جداً',
};

export const STATUS_LABEL: Record<MemStatus, string> = {
  learning: 'قيد الحفظ',
  memorized: 'محفوظ',
  mastered: 'متقن',
};

export const MISTAKE_LABEL: Record<Mistake['type'], string> = {
  tajweed: 'تجويد',
  word: 'كلمة',
  order: 'ترتيب',
  forgetting: 'نسيان',
};

export const STRENGTH_ORDER: Strength[] = ['weak', 'medium', 'strong', 'veryStrong'];
