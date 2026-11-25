// Domain logic for the Memorization & Review Planner (جدولة الحفظ والمراجعة).
// Pure functions for calculating khatma plans, handling missed days,
// and scheduling spaced repetition for weak areas.
import { PAGES, SURAHS } from '../data/mushaf';
import type {
  MemorizedScope, MissedDaysPolicy, ScheduleConfig, ScheduleDayItem,
  WeakPartItem, WeakRating,
} from './types';
import { addDaysStr, daysUntil, fmtNum, parseISODate, todayStr, uid } from './utils';

export const defaultMemorizedScope: MemorizedScope = {
  type: 'ajza',
  ajzaCount: 10,
  ajzaStart: 'start',
  customFromJuz: 1,
  customToJuz: 10,
  fromSurah: 1,
  toSurah: 9,
  fromPage: 1,
  toPage: 201,
};

export const defaultScheduleConfig: ScheduleConfig = {
  id: 'current',
  memorized: defaultMemorizedScope,
  targetDays: 7,
  startDate: todayStr(),
  missedDaysPolicy: 'delayEnd',
  updatedAt: new Date().toISOString(),
};

/**
 * Resolves any memorized scope into the exact ordered list of Mushaf page numbers.
 */
export function resolveMemorizedPages(scope: MemorizedScope): {
  pages: number[];
  summary: string;
  totalPages: number;
} {
  let pages: number[] = [];
  let summary = '';

  if (scope.type === 'ajza') {
    let fromJuz = 1;
    let toJuz = 10;
    const count = Math.min(30, Math.max(1, scope.ajzaCount || 1));

    if (scope.ajzaStart === 'start') {
      fromJuz = 1;
      toJuz = count;
    } else if (scope.ajzaStart === 'end') {
      fromJuz = Math.max(1, 31 - count);
      toJuz = 30;
    } else if (scope.ajzaStart === 'custom') {
      fromJuz = Math.min(scope.customFromJuz ?? 1, scope.customToJuz ?? 30);
      toJuz = Math.max(scope.customFromJuz ?? 1, scope.customToJuz ?? 30);
    }

    const filtered = PAGES.filter((p) => p.juz >= fromJuz && p.juz <= toJuz);
    pages = filtered.map((p) => p.page);
    const countStr = count === 1 ? 'جزء واحد' : count === 2 ? 'جزآن' : `${fmtNum(count)} أجزاء`;
    summary = `${countStr} (من الجزء ${fmtNum(fromJuz)} إلى الجزء ${fmtNum(toJuz)})`;
  } else if (scope.type === 'surahs') {
    const fromS = Math.min(scope.fromSurah || 1, scope.toSurah || 114);
    const toS = Math.max(scope.fromSurah || 1, scope.toSurah || 114);
    const startP = SURAHS[fromS - 1]?.startPage ?? 1;
    const endP = SURAHS[toS - 1]?.endPage ?? 604;
    for (let p = startP; p <= endP; p++) pages.push(p);

    const s1 = SURAHS[fromS - 1]?.name ?? `سورة ${fromS}`;
    const s2 = SURAHS[toS - 1]?.name ?? `سورة ${toS}`;
    summary = `من ${s1} إلى ${s2}`;
  } else {
    // By pages
    const fromP = Math.max(1, Math.min(scope.fromPage || 1, scope.toPage || 604));
    const toP = Math.min(604, Math.max(scope.fromPage || 1, scope.toPage || 604));
    for (let p = fromP; p <= toP; p++) pages.push(p);
    summary = `من صفحة ${fmtNum(fromP)} إلى صفحة ${fmtNum(toP)}`;
  }

  return {
    pages,
    summary,
    totalPages: pages.length,
  };
}

/**
 * Builds human-readable labels for a page range based on Mushaf metadata.
 */
function describePageRange(startPage: number, endPage: number, pageCount: number): { title: string; details: string } {
  const p1 = PAGES[Math.max(0, startPage - 1)];
  const p2 = PAGES[Math.min(PAGES.length - 1, endPage - 1)];

  const startJuz = p1?.juz ?? 1;
  const endJuz = p2?.juz ?? 1;

  let title = '';
  if (startJuz === endJuz) {
    title = `الجزء ${fmtNum(startJuz)}`;
  } else {
    title = `الأجزاء من ${fmtNum(startJuz)} إلى ${fmtNum(endJuz)}`;
  }

  // Identify surah names covered
  const surahs = new Set<number>();
  for (let i = startPage - 1; i <= endPage - 1 && i < PAGES.length; i++) {
    const pageObj = PAGES[i];
    if (pageObj) {
      for (const r of pageObj.ranges) surahs.add(r.surah);
    }
  }

  const surahArr = Array.from(surahs);
  let surahDesc = '';
  if (surahArr.length === 1) {
    surahDesc = SURAHS[surahArr[0] - 1]?.name ?? '';
  } else if (surahArr.length === 2) {
    surahDesc = `${SURAHS[surahArr[0] - 1]?.name ?? ''} و${SURAHS[surahArr[1] - 1]?.name ?? ''}`;
  } else if (surahArr.length > 2) {
    surahDesc = `من ${SURAHS[surahArr[0] - 1]?.name ?? ''} إلى ${SURAHS[surahArr[surahArr.length - 1] - 1]?.name ?? ''}`;
  }

  const details = `${surahDesc ? surahDesc + ' • ' : ''}ص ${fmtNum(startPage)} إلى ص ${fmtNum(endPage)} (${fmtNum(pageCount)} صفحة)`;

  return { title, details };
}

/**
 * Generates an evenly distributed day-by-day khatma plan.
 */
export function generateScheduleDays(
  scope: MemorizedScope,
  targetDays: number,
  startDate: string = todayStr(),
): ScheduleDayItem[] {
  const { pages } = resolveMemorizedPages(scope);
  const total = pages.length;
  if (total === 0) return [];

  const daysCount = Math.max(1, targetDays);
  const items: ScheduleDayItem[] = [];

  // Distribute pages as evenly as possible using remainder distribution
  const basePages = Math.floor(total / daysCount);
  const remainder = total % daysCount;

  let offset = 0;
  for (let i = 0; i < daysCount; i++) {
    const countForDay = basePages + (i < remainder ? 1 : 0);
    if (countForDay <= 0) continue;

    const slice = pages.slice(offset, offset + countForDay);
    offset += countForDay;

    const startPage = slice[0];
    const endPage = slice[slice.length - 1];
    const { title, details } = describePageRange(startPage, endPage, countForDay);

    items.push({
      id: uid(),
      dayIndex: i + 1,
      date: addDaysStr(startDate, i),
      title: `${title}`,
      details,
      startPage,
      endPage,
      pageCount: countForDay,
      done: false,
      doneAt: null,
    });
  }

  return items;
}

/**
 * Checks for past incomplete days.
 */
export function checkMissedDays(days: ScheduleDayItem[], today: string = todayStr()): {
  hasMissed: boolean;
  missedCount: number;
  missedDays: ScheduleDayItem[];
} {
  const missed = days.filter((d) => d.date < today && !d.done);
  return {
    hasMissed: missed.length > 0,
    missedCount: missed.length,
    missedDays: missed,
  };
}

/**
 * Policy 1: Delay the end date.
 * Shifts all uncompleted days forward so the first uncompleted day becomes TODAY,
 * keeping the comfortable daily amount unchanged and extending the target finish date.
 */
export function applyDelayEndPolicy(days: ScheduleDayItem[], today: string = todayStr()): ScheduleDayItem[] {
  const completed = days.filter((d) => d.done);
  const pending = days.filter((d) => !d.done);

  if (pending.length === 0) return days;

  // Re-date pending days sequentially starting from today
  const updatedPending = pending.map((item, idx) => ({
    ...item,
    date: addDaysStr(today, idx),
    dayIndex: completed.length + idx + 1,
  }));

  // Return combined in chronological order
  return [...completed, ...updatedPending].sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Policy 2: Recalculate daily amount over the remaining days.
 * Keeps the target end date, gathers all remaining uncompleted pages, and divides
 * them evenly across the remaining calendar days (from today until target end date).
 */
export function applyRecalculateDailyPolicy(
  days: ScheduleDayItem[],
  targetEndDate: string,
  today: string = todayStr(),
): ScheduleDayItem[] {
  const completed = days.filter((d) => d.done);
  const pending = days.filter((d) => !d.done);

  if (pending.length === 0) return days;

  // Calculate days remaining from today until target end date (at least 1)
  const diffDays = Math.max(1, (daysUntil(targetEndDate) ?? 0) + 1);

  // Collect all uncompleted pages
  const allPendingPages: number[] = [];
  for (const item of pending) {
    for (let p = item.startPage; p <= item.endPage; p++) {
      allPendingPages.push(p);
    }
  }

  if (allPendingPages.length === 0) return days;

  // Divide across diffDays
  const basePages = Math.floor(allPendingPages.length / diffDays);
  const remainder = allPendingPages.length % diffDays;

  const newPending: ScheduleDayItem[] = [];
  let offset = 0;

  for (let i = 0; i < diffDays; i++) {
    const countForDay = basePages + (i < remainder ? 1 : 0);
    if (countForDay <= 0) continue;

    const slice = allPendingPages.slice(offset, offset + countForDay);
    offset += countForDay;

    const startPage = slice[0];
    const endPage = slice[slice.length - 1];
    const { title, details } = describePageRange(startPage, endPage, countForDay);

    newPending.push({
      id: uid(),
      dayIndex: completed.length + i + 1,
      date: addDaysStr(today, i),
      title,
      details,
      startPage,
      endPage,
      pageCount: countForDay,
      done: false,
      doneAt: null,
    });
  }

  return [...completed, ...newPending].sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Spaced Repetition interval calculation based on user rating.
 * Rating:
 *  - 'hard': needs immediate reinforcement -> 1 day
 *  - 'ok': moderate progression -> 1 -> 3 -> 7 -> 14 -> 21 -> +14 days
 *  - 'easy': mastered -> 1 -> 7 -> 14 -> 21 -> 30 -> x2 days
 */
export function calculateNextRepetition(
  currentInterval: number,
  rating: WeakRating,
): { nextInterval: number; daysToAdd: number } {
  let nextInterval = 1;

  if (rating === 'hard') {
    nextInterval = 1;
  } else if (rating === 'ok') {
    if (currentInterval <= 1) nextInterval = 3;
    else if (currentInterval <= 3) nextInterval = 7;
    else if (currentInterval <= 7) nextInterval = 14;
    else if (currentInterval <= 14) nextInterval = 21;
    else nextInterval = Math.min(60, currentInterval + 14);
  } else {
    // 'easy'
    if (currentInterval <= 1) nextInterval = 7;
    else if (currentInterval <= 3) nextInterval = 14;
    else if (currentInterval <= 7) nextInterval = 21;
    else if (currentInterval <= 14) nextInterval = 30;
    else nextInterval = Math.min(90, currentInterval * 2);
  }

  return { nextInterval, daysToAdd: nextInterval };
}

/**
 * Standard Rub' (أرباع القرآن) helper options.
 */
export const RUB_OPTIONS = [
  'الربع الأول',
  'الربع الثاني',
  'الربع الثالث',
  'الربع الرابع',
  'الربع الخامس',
  'الربع السادس',
  'الربع السابع',
  'الربع الثامن',
];
