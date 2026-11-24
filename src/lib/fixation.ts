// Pure logic for spaced repetition + fixation ("khatmas") + rotating wird.
// No React, no Dexie here — so it can be unit-simulated from Node.
//
// SETTLED RULES (2026-11-22, confirmed by Ahmed):
// - Daily: 5 weak + 15 medium + 20 strong (1 juz) = 2 juz/day, 15-day khatm.
// - A khatma covers all memorized content once, days mixing levels in parallel.
// - NO auto-promotion after a khatma. Weak -> medium ONLY after completing its
//   spaced-repetition cycle: all 6 stages (1,2,3,5,7,10 days) with Good/Easy at
//   the final stage. Easy x2 does NOT promote weak. Again restarts the cycle.
// - Medium is covered daily in parallel so it is not forgotten. After a weak
//   surah stabilizes it joins medium and is reviewed on the post-fixation
//   cycle (15 days default, 10-day option).
import type { FixRates, ProgressEntry, Rating, Strength } from './types';
import { addDaysStr, todayStr } from './utils';
import { entryPages, rangePageUnits } from './quran';
import type { PageUnit } from './quran';

export const INTERVALS: Record<Strength, number[]> = {
  weak: [1, 2, 3, 5, 7, 10],
  medium: [1, 3, 7, 10, 20, 35],
  strong: [1, 3, 7, 14, 30, 60],
  veryStrong: [2, 7, 14, 30, 60, 90],
};

export const NEXT_STRONGER: Partial<Record<Strength, Strength>> = {
  weak: 'medium',
  medium: 'strong',
  strong: 'veryStrong',
};

/** Minutes per mushaf page (estimate used by the wird splitter). */
export const MIN_PER_PAGE = 3;

export interface RateResult {
  entry: ProgressEntry;
  /** True when a weak entry completed its SR cycle and stabilized to medium. */
  stabilized: boolean;
  /** True when a non-weak entry completed its SR cycle (stage reset). */
  cycleCompleted: boolean;
}

/**
 * Apply an Again/Good/Easy rating to a spaced-repetition entry.
 * `postFixCycle` is the review interval (15 or 10 days) for a weak surah
 * that just stabilized into medium.
 */
export function rateEntry(
  entry: ProgressEntry,
  rating: Rating,
  postFixCycle: 15 | 10 = 15,
  today: string = todayStr(),
): RateResult {
  const intervals = INTERVALS[entry.strength];
  const stage = entry.srStage;

  if (rating === 'again') {
    return {
      entry: {
        ...entry,
        strength: 'weak',
        srStage: 0,
        easyStreak: 0,
        srDue: addDaysStr(today, 1),
        stabilizedAt: null,
      },
      stabilized: false,
      cycleCompleted: false,
    };
  }

  const easyStreak = rating === 'easy' ? entry.easyStreak + 1 : 0;
  const isFinalStage = stage >= intervals.length - 1;

  // Easy twice in a row upgrades a level — EXCEPT weak (weak only promotes
  // by completing its whole SR cycle, never by the Easy shortcut).
  if (rating === 'easy' && easyStreak >= 2 && entry.strength !== 'weak' && !isFinalStage) {
    const next = NEXT_STRONGER[entry.strength];
    if (next) {
      return {
        entry: {
          ...entry,
          strength: next,
          srStage: 0,
          easyStreak: 0,
          srDue: addDaysStr(today, INTERVALS[next][0]),
        },
        stabilized: false,
        cycleCompleted: false,
      };
    }
  }

  if (isFinalStage) {
    // Cycle completed with Good/Easy at the final stage.
    if (entry.strength === 'weak') {
      return {
        entry: {
          ...entry,
          strength: 'medium',
          srStage: 0,
          easyStreak: 0,
          srDue: addDaysStr(today, postFixCycle),
          stabilizedAt: today,
        },
        stabilized: true,
        cycleCompleted: true,
      };
    }
    return {
      entry: {
        ...entry,
        srStage: 0,
        easyStreak,
        srDue: addDaysStr(today, intervals[0]),
      },
      stabilized: false,
      cycleCompleted: true,
    };
  }

  const nextStage = stage + 1;
  return {
    entry: {
      ...entry,
      srStage: nextStage,
      easyStreak,
      srDue: addDaysStr(today, intervals[nextStage]),
    },
    stabilized: false,
    cycleCompleted: false,
  };
}

/** Due date for a fresh entry of a given strength (stage 0). */
export function firstDue(strength: Strength, today: string = todayStr()): string {
  return addDaysStr(today, INTERVALS[strength][0]);
}

/** Priority score for weakest-first revision ordering. */
export function revisionPriority(
  entry: ProgressEntry,
  openMistakes: number,
  today: string = todayStr(),
): number {
  const strengthWeight: Record<Strength, number> = { weak: 100, medium: 60, strong: 30, veryStrong: 10 };
  let score = strengthWeight[entry.strength];
  if (entry.srDue) {
    const diffMs = new Date(today).getTime() - new Date(entry.srDue).getTime();
    const overdueDays = Math.max(0, Math.floor(diffMs / 86400000));
    score += overdueDays * 10;
    if (overdueDays === 0) score += 5; // due today
  }
  score += openMistakes * 15;
  return score;
}

// ---- Fixation chunking -----------------------------------------------------

/** Split `total` pages into balanced chunks of at most `perDay` pages. */
export function balancedChunks(total: number, perDay: number): number[] {
  if (total <= 0 || perDay <= 0) return [];
  const n = Math.ceil(total / perDay);
  const base = Math.floor(total / n);
  const rem = total % n;
  return Array.from({ length: n }, (_, i) => base + (i < rem ? 1 : 0));
}

export interface FixChunk {
  id: string;
  level: 'weak' | 'medium' | 'strong';
  surah: number;
  fromAyah: number;
  toAyah: number;
  /** Surah/ayah ranges inside the chunk (a chunk can span two surahs). */
  ranges: Array<{ surah: number; from: number; to: number }>;
  pages: number[];
  pageCount: number;
  /** Day (1-based) this chunk first appears in the khatma. */
  firstDay: number;
}

export interface KhatmaDay {
  day: number;
  date: string;
  chunks: FixChunk[];
  totalPages: number;
}

export interface KhatmaPlan {
  days: KhatmaDay[];
  totalPages: number;
  totalChunks: number;
  /** Target khatm length from page arithmetic (604 pages / 40 per day = 15). */
  targetDays: number;
  /** Chunks per level, first pass only (for the separate fixation tables). */
  levelChunks: Record<'weak' | 'medium' | 'strong', FixChunk[]>;
}

function levelOf(entry: ProgressEntry): 'weak' | 'medium' | 'strong' {
  if (entry.strength === 'weak') return 'weak';
  if (entry.strength === 'medium') return 'medium';
  return 'strong'; // strong + veryStrong share the strong daily portion
}

/** Build page units for one entry, in mushaf order. */
function entryUnits(entry: ProgressEntry): PageUnit[] {
  return rangePageUnits(entry.surah, entry.fromAyah, entry.surah, entry.toAyah);
}

export function buildKhatma(
  entries: ProgressEntry[],
  rates: FixRates,
  startDate: string = todayStr(),
): KhatmaPlan {
  const levels: Array<'weak' | 'medium' | 'strong'> = ['weak', 'medium', 'strong'];
  const perDay: Record<string, number> = { weak: rates.weak, medium: rates.medium, strong: rates.strong };
  const levelChunks: Record<'weak' | 'medium' | 'strong', FixChunk[]> = { weak: [], medium: [], strong: [] };
  let totalPages = 0;

  for (const level of levels) {
    const levelEntries = entries
      .filter((e) => levelOf(e) === level)
      .sort((a, b) => a.surah - b.surah || a.fromAyah - b.fromAyah);
    // Flatten to page units in mushaf order.
    const units: PageUnit[] = levelEntries.flatMap(entryUnits);
    totalPages += new Set(units.map((u) => u.page)).size;
    const sizes = balancedChunks(units.length, perDay[level]);
    let idx = 0;
    sizes.forEach((size, ci) => {
      const slice = units.slice(idx, idx + size);
      idx += size;
      if (slice.length === 0) return;
      const first = slice[0];
      const last = slice[slice.length - 1];
      const ranges: Array<{ surah: number; from: number; to: number }> = [];
      for (const u of slice) {
        const r = ranges[ranges.length - 1];
        if (r && r.surah === u.surah && r.to === u.from - 1) r.to = u.to;
        else ranges.push({ surah: u.surah, from: u.from, to: u.to });
      }
      levelChunks[level].push({
        id: `fix-${level}-${ci}`,
        level,
        surah: first.surah,
        fromAyah: first.from,
        toAyah: last.to,
        ranges,
        pages: slice.map((u) => u.page),
        pageCount: slice.length,
        firstDay: ci + 1,
      });
    });
  }

  const dayCount = Math.max(1, ...levels.map((l) => levelChunks[l].length));
  const days: KhatmaDay[] = [];
  for (let d = 0; d < dayCount; d++) {
    const chunks: FixChunk[] = [];
    for (const level of levels) {
      const list = levelChunks[level];
      if (list.length > 0) chunks.push(list[d % list.length]);
    }
    days.push({
      day: d + 1,
      date: addDaysStr(startDate, d),
      chunks,
      totalPages: chunks.reduce((n, c) => n + c.pageCount, 0),
    });
  }

  const dailyTotal = rates.weak + rates.medium + rates.strong;
  const targetDays = dailyTotal > 0 ? Math.max(1, Math.round(totalPages / dailyTotal)) : 0;
  return {
    days,
    totalPages,
    totalChunks: levels.reduce((n, l) => n + levelChunks[l].length, 0),
    targetDays,
    levelChunks,
  };
}

/** Pages of one entry (for display). */
export function entryPageList(entry: ProgressEntry): number[] {
  return entryPages(entry);
}

// ---- Rotating wird table ----------------------------------------------------

export interface WirdDay {
  day: number;
  date: string;
  fromSurah: number;
  fromAyah: number;
  toSurah: number;
  toAyah: number;
  ayahs: number;
  pages: number;
}

export function buildWirdTable(
  entries: ProgressEntry[],
  cycleDays: number,
  startDate: string = todayStr(),
): WirdDay[] {
  // Flatten memorized ayahs in mushaf order.
  const ayahs: Array<{ surah: number; ayah: number; page: number }> = [];
  const sorted = [...entries].sort((a, b) => a.surah - b.surah || a.fromAyah - b.fromAyah);
  for (const e of sorted) {
    for (const u of rangePageUnits(e.surah, e.fromAyah, e.surah, e.toAyah)) {
      for (let a = u.from; a <= u.to; a++) ayahs.push({ surah: u.surah, ayah: a, page: u.page });
    }
  }
  if (ayahs.length === 0 || cycleDays <= 0) return [];
  const sizes = balancedChunks(ayahs.length, Math.ceil(ayahs.length / cycleDays));
  // balancedChunks(total, perDay) with perDay = ceil(total/cycle) gives cycle groups.
  const days: WirdDay[] = [];
  let idx = 0;
  sizes.forEach((size, i) => {
    const slice = ayahs.slice(idx, idx + size);
    idx += size;
    if (slice.length === 0) return;
    days.push({
      day: i + 1,
      date: addDaysStr(startDate, i),
      fromSurah: slice[0].surah,
      fromAyah: slice[0].ayah,
      toSurah: slice[slice.length - 1].surah,
      toAyah: slice[slice.length - 1].ayah,
      ayahs: slice.length,
      pages: new Set(slice.map((a) => a.page)).size,
    });
  });
  return days;
}

// ---- Daily wird splitter ------------------------------------------------------

export interface WirdSplit {
  rotatingMin: number;
  recentMin: number;
  newMin: number;
  rotatingPages: number;
  recentPages: number;
  newPages: number;
  /** Minutes the rotating portion actually needs today (for the over-time warning). */
  rotatingNeededMin: number;
  overTime: boolean;
}

export function splitWirdByMinutes(totalMinutes: number, rotatingNeededPages: number): WirdSplit {
  const rotatingMin = Math.round(totalMinutes * 0.5);
  const recentMin = Math.round(totalMinutes * 0.3);
  const newMin = totalMinutes - rotatingMin - recentMin;
  const rotatingNeededMin = rotatingNeededPages * MIN_PER_PAGE;
  return {
    rotatingMin,
    recentMin,
    newMin,
    rotatingPages: Math.max(0, Math.floor(rotatingMin / MIN_PER_PAGE)),
    recentPages: Math.max(0, Math.floor(recentMin / MIN_PER_PAGE)),
    newPages: Math.max(0, Math.floor(newMin / MIN_PER_PAGE)),
    rotatingNeededMin,
    overTime: rotatingNeededMin > rotatingMin,
  };
}
