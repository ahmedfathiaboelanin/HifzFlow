// Today's review is the sum of three independent workloads:
//   1. Fixation chunks scheduled for today (khatma plan / inserted tasks).
//   2. The rotating daily wird (one day of the cycle).
//   3. Spaced-repetition entries that are due today or overdue.
//
// This module keeps that definition in one place so the revision page and the
// navigation badges cannot drift apart.
import { buildKhatma, buildWirdTable } from './fixation';
import type { FixChunk, WirdDay } from './fixation';
import { surahName } from './quran';
import type { DailyTask, FixRates, Preferences, ProgressEntry, WirdCompletion } from './types';
import { fmtNum, parseISODate, todayStr } from './utils';

export type FixationLevel = FixChunk['level'];

export interface TodayFixationItem {
  /** Task id, or the deterministic id used when the plan chunk is not inserted yet. */
  id: string;
  chunkId: string;
  title: string;
  label: string;
  date: string;
  done: boolean;
  overdue: boolean;
  /** True when no daily task exists yet; checking it inserts the task. */
  synthetic: boolean;
  pageCount: number | null;
  level: FixationLevel;
  surah: number;
}

const LEVEL_ORDER: Record<FixationLevel, number> = { weak: 0, medium: 1, strong: 2 };

export function levelLabel(level: FixationLevel): string {
  return level === 'weak' ? 'ضعيف' : level === 'medium' ? 'متوسط' : 'قوي';
}

function chunkLabel(chunk: FixChunk): string {
  return chunk.ranges
    .map((r) => `${surahName(r.surah)} ${fmtNum(r.from)}–${fmtNum(r.to)}`)
    .join(' + ');
}

/**
 * Fixation work for today:
 * - every still-open task scheduled today or overdue, and
 * - today's plan chunks when they have not been inserted as tasks yet.
 *
 * Completed tasks from today stay in the list so the checkbox keeps its state.
 */
export function todayFixationItems(
  entries: ProgressEntry[],
  tasks: DailyTask[],
  rates: FixRates,
  today = todayStr(),
): TodayFixationItem[] {
  const plan = buildKhatma(entries, rates, today);
  const chunks = new Map<string, FixChunk>();
  for (const level of ['weak', 'medium', 'strong'] as const) {
    for (const chunk of plan.levelChunks[level]) chunks.set(chunk.id, chunk);
  }

  const items = new Map<string, TodayFixationItem>();
  const scheduled = tasks.filter(
    (t) => t.kind === 'fixation' && (t.date === today || (t.date < today && !t.done)),
  );

  for (const task of scheduled) {
    const chunk = task.refId ? chunks.get(task.refId) : undefined;
    items.set(task.id, {
      id: task.id,
      chunkId: task.refId ?? task.id,
      title: task.title,
      label: chunk ? chunkLabel(chunk) : task.title,
      date: task.date,
      done: task.done,
      overdue: task.date < today && !task.done,
      synthetic: false,
      pageCount: chunk?.pageCount ?? null,
      level: chunk?.level ?? 'weak',
      surah: task.linkedSurah ?? chunk?.surah ?? 0,
    });
  }

  // If a plan has already been inserted, today's tasks are the source of truth.
  // Only fall back to the freshly built plan when nothing is scheduled.
  if (scheduled.length === 0) {
    const todayChunks = plan.days[0]?.chunks ?? [];
    for (const chunk of todayChunks) {
      const id = `${chunk.id}-d1`;
      if (items.has(id)) continue;
      const label = chunkLabel(chunk);
      items.set(id, {
        id,
        chunkId: chunk.id,
        title: `تثبيت: ${label} — ${levelLabel(chunk.level)} (${chunk.pageCount} صفحات)`,
        label,
        date: today,
        done: false,
        overdue: false,
        synthetic: true,
        pageCount: chunk.pageCount,
        level: chunk.level,
        surah: chunk.surah,
      });
    }
  }

  return [...items.values()].sort((a, b) => {
    if (a.overdue !== b.overdue) return a.overdue ? -1 : 1;
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level];
  });
}

export interface TodayWird {
  day: WirdDay;
  cycleStart: string;
  cycleLength: number;
  completed: boolean;
  /** True when the user has not explicitly started the cycle yet. */
  notStarted: boolean;
}

/** Today's row in the rotating wird, clamped to the current cycle. */
export function todayWirdInfo(
  entries: ProgressEntry[],
  prefs: Preferences,
  completions: WirdCompletion[],
  today = todayStr(),
): TodayWird | null {
  const cycleStart = prefs.wirdCycleStart ?? today;
  const days = buildWirdTable(entries, prefs.wirdCycleDays, cycleStart);
  if (days.length === 0) return null;
  const elapsed = Math.round(
    (parseISODate(today).getTime() - parseISODate(cycleStart).getTime()) / 86400000,
  );
  const day = days[Math.min(Math.max(elapsed, 0), days.length - 1)];
  return {
    day,
    cycleStart,
    cycleLength: days.length,
    completed: completions.some((c) => c.cycleStart === cycleStart && c.day === day.day),
    notStarted: prefs.wirdCycleStart === null,
  };
}

/**
 * Total number of open items in today's review: spaced repetition + fixation
 * + the daily wird (counted once). Used by navigation and the app icon badge.
 */
export function revisionDueCount(
  entries: ProgressEntry[],
  tasks: DailyTask[],
  prefs: Preferences,
  completions: WirdCompletion[],
  today = todayStr(),
): number {
  const spaced = entries.filter((e) => e.srDue && e.srDue <= today).length;
  const fixation = todayFixationItems(entries, tasks, prefs.rates, today).filter((i) => !i.done).length;
  const wird = todayWirdInfo(entries, prefs, completions, today);
  return spaced + fixation + (wird && !wird.completed ? 1 : 0);
}
