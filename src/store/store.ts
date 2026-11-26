// Redux store: hydration from IndexedDB before first render, and a
// debounced write-through persistence middleware (Redux in memory, Dexie
// as the durable store). If IndexedDB is blocked the app keeps working
// in memory and shows an honest warning.
import { configureStore } from '@reduxjs/toolkit';
import type { Middleware } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import { db, openDb } from '../lib/db';
import { rateEntry } from '../lib/fixation';
import { buildKhatma } from '../lib/fixation';
import { surahName } from '../lib/quran';
import { buildSampleState } from '../lib/sampleData';
import type { BackupFile } from '../lib/backup';
import type { Rating } from '../lib/types';
import { todayStr, uid } from '../lib/utils';
import {
  defaultPrefs, focusSlice, metaSlice, mistakesSlice, prefsSlice,
  progressSlice, revisionSlice, scheduleSlice, tasksSlice, wirdSlice,
} from './slices';
import { defaultScheduleConfig, generateScheduleDays } from '../lib/schedule';

const rootReducer = {
  prefs: prefsSlice.reducer,
  progress: progressSlice.reducer,
  revision: revisionSlice.reducer,
  tasks: tasksSlice.reducer,
  mistakes: mistakesSlice.reducer,
  focus: focusSlice.reducer,
  wird: wirdSlice.reducer,
  schedule: scheduleSlice.reducer,
  meta: metaSlice.reducer,
};

// ---- Persistence -------------------------------------------------------------
let persistTimer: ReturnType<typeof setTimeout> | null = null;
let memoryOnly = false;

async function persistAll(state: Omit<AppState, 'meta'>): Promise<void> {
  if (memoryOnly) return;
  try {
    await db.transaction(
      'rw',
      [db.memorizationProgress, db.revisionPlans, db.revisionTasks, db.revisionSessions,
       db.revisionHistory, db.mistakes, db.bookmarks, db.focusSessions, db.distractions,
       db.dailyTasks, db.recurringTasks, db.userPreferences, db.wirdCompletions,
       db.scheduleConfig, db.scheduleDays, db.weakParts],
      async () => {
        await db.memorizationProgress.clear();
        await db.memorizationProgress.bulkPut(state.progress.entries);
        await db.revisionPlans.clear();
        await db.revisionPlans.bulkPut(state.revision.plans);
        await db.revisionTasks.clear();
        await db.revisionTasks.bulkPut(state.revision.tasks);
        await db.revisionSessions.clear();
        await db.revisionSessions.bulkPut(state.revision.sessions);
        await db.revisionHistory.clear();
        await db.revisionHistory.bulkPut(state.revision.history);
        await db.mistakes.clear();
        await db.mistakes.bulkPut(state.mistakes.items);
        await db.bookmarks.clear();
        await db.bookmarks.bulkPut(state.mistakes.bookmarks);
        await db.focusSessions.clear();
        await db.focusSessions.bulkPut(state.focus.sessions);
        await db.distractions.clear();
        await db.distractions.bulkPut(state.focus.distractions);
        await db.dailyTasks.clear();
        await db.dailyTasks.bulkPut(state.tasks.daily);
        await db.recurringTasks.clear();
        await db.recurringTasks.bulkPut(state.tasks.recurring);
        await db.userPreferences.clear();
        await db.userPreferences.put(state.prefs);
        await db.wirdCompletions.clear();
        await db.wirdCompletions.bulkPut(state.wird.items);
        await db.scheduleConfig.clear();
        if (state.schedule?.config) await db.scheduleConfig.put(state.schedule.config);
        await db.scheduleDays.clear();
        if (state.schedule?.days?.length) await db.scheduleDays.bulkPut(state.schedule.days);
        await db.weakParts.clear();
        if (state.schedule?.weakParts?.length) await db.weakParts.bulkPut(state.schedule.weakParts);
      },
    );
  } catch {
    memoryOnly = true;
    appStore.dispatch(metaSlice.actions.setStorage('memory'));
  }
}

const persistMiddleware: Middleware = (api) => (next) => (action) => {
  const result = next(action);
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    void persistAll(api.getState() as AppState);
  }, 400);
  return result;
};

// The store, with the persistence middleware attached.
export const appStore = configureStore({
  reducer: rootReducer,
  middleware: (getDefault) => getDefault().concat(persistMiddleware),
});

export type AppState = ReturnType<typeof appStore.getState>;
export type AppDispatch = typeof appStore.dispatch;
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<AppState> = useSelector;

// ---- Hydration ---------------------------------------------------------------
export async function hydrate(): Promise<void> {
  const ok = await openDb();
  if (!ok) {
    memoryOnly = true;
    appStore.dispatch(metaSlice.actions.setStorage('memory'));
    loadStateIntoStore(emptyStateWithSample());
    appStore.dispatch(metaSlice.actions.setHydrated());
    return;
  }
  const prefsRows = await db.userPreferences.toArray();
  if (prefsRows.length === 0) {
    // First run: labelled sample dataset.
    const sample = emptyStateWithSample();
    await persistAll(sample);
    loadStateIntoStore(sample);
    appStore.dispatch(metaSlice.actions.setHydrated());
    return;
  }
  const schedConfigs = await db.scheduleConfig.toArray();
  const loadedConfig = schedConfigs[0] ?? defaultScheduleConfig;
  let loadedDays = await db.scheduleDays.toArray();
  loadedDays.sort((a, b) => a.dayIndex - b.dayIndex);
  if (loadedDays.length === 0) {
    loadedDays = generateScheduleDays(loadedConfig.memorized, loadedConfig.targetDays, todayStr());
  }

  const state = {
    prefs: prefsRows[0],
    progress: { entries: await db.memorizationProgress.toArray() },
    revision: {
      plans: await db.revisionPlans.toArray(),
      tasks: await db.revisionTasks.toArray(),
      sessions: await db.revisionSessions.toArray(),
      history: await db.revisionHistory.toArray(),
    },
    tasks: {
      daily: await db.dailyTasks.toArray(),
      recurring: await db.recurringTasks.toArray(),
    },
    mistakes: {
      items: await db.mistakes.toArray(),
      bookmarks: await db.bookmarks.toArray(),
    },
    focus: {
      sessions: await db.focusSessions.toArray(),
      distractions: await db.distractions.toArray(),
    },
    wird: { items: await db.wirdCompletions.toArray() },
    schedule: {
      config: loadedConfig,
      days: loadedDays,
      weakParts: await db.weakParts.toArray(),
    },
  };
  loadStateIntoStore(state);
  appStore.dispatch(metaSlice.actions.setHydrated());
}

function emptyStateWithSample() {
  const sample = buildSampleState();
  const config = defaultScheduleConfig;
  const days = generateScheduleDays(config.memorized, config.targetDays, todayStr());
  return {
    prefs: { ...defaultPrefs, sampleLoaded: true },
    progress: { entries: sample.progress?.entries ?? [] },
    revision: { plans: [], tasks: [], sessions: [], history: [] },
    tasks: { daily: sample.tasks?.daily ?? [], recurring: sample.tasks?.recurring ?? [] },
    mistakes: { items: sample.mistakes?.items ?? [], bookmarks: sample.mistakes?.bookmarks ?? [] },
    focus: { sessions: [], distractions: [] },
    wird: { items: [] },
    schedule: { config, days, weakParts: [] },
  };
}

function loadStateIntoStore(s: {
  prefs: typeof defaultPrefs;
  progress: { entries: AppState['progress']['entries'] };
  revision: AppState['revision'];
  tasks: AppState['tasks'];
  mistakes: AppState['mistakes'];
  focus: AppState['focus'];
  wird: AppState['wird'];
  schedule: AppState['schedule'];
}): void {
  appStore.dispatch(prefsSlice.actions.setPrefs(s.prefs));
  appStore.dispatch(progressSlice.actions.setEntries(s.progress.entries));
  appStore.dispatch(revisionSlice.actions.setRevisionAll(s.revision));
  appStore.dispatch(tasksSlice.actions.setTasksAll(s.tasks));
  appStore.dispatch(mistakesSlice.actions.setMistakesAll(s.mistakes));
  appStore.dispatch(focusSlice.actions.setFocusAll(s.focus));
  appStore.dispatch(wirdSlice.actions.setWirdAll(s.wird.items));
  appStore.dispatch(scheduleSlice.actions.setScheduleAll(s.schedule));
}

// ---- Thunks / operations -------------------------------------------------------

/** Rate a revision (Again/Good/Easy) — the spaced-repetition state machine. */
export function rateProgress(progressId: string, rating: Rating, mistakesCount = 0): void {
  const state = appStore.getState() as AppState;
  const entry = state.progress.entries.find((e) => e.id === progressId);
  if (!entry) return;
  const result = rateEntry(entry, rating, state.prefs.fixationReviewCycle);
  appStore.dispatch(progressSlice.actions.updateEntry({ id: progressId, patch: result.entry }));
  appStore.dispatch(revisionSlice.actions.addHistory({
    id: uid(),
    progressId,
    surah: entry.surah,
    fromAyah: entry.fromAyah,
    toAyah: entry.toAyah,
    rating,
    reviewedAt: new Date().toISOString(),
    mistakesCount,
  }));
}

/** Insert the current khatma plan as dated tasks in the planner. */
export function insertFixationPlan(): number {
  const state = appStore.getState() as AppState;
  const plan = buildKhatma(state.progress.entries, state.prefs.rates, todayStr());
  const existing = new Set(state.tasks.daily.map((t) => t.id));
  const toAdd = [];
  for (const day of plan.days) {
    for (const chunk of day.chunks) {
      const id = `${chunk.id}-d${day.day}`;
      if (existing.has(id)) continue;
      const label = chunk.ranges.map((r) => `${surahName(r.surah)} ${r.from}–${r.to}`).join(' + ');
      toAdd.push({
        id,
        date: day.date,
        title: `تثبيت: ${label} — ${chunk.level === 'weak' ? 'ضعيف' : chunk.level === 'medium' ? 'متوسط' : 'قوي'} (${chunk.pageCount} صفحات)`,
        done: false,
        priority: chunk.level === 'weak' ? 3 : 2,
        linkedSurah: chunk.surah,
        kind: 'fixation' as const,
        refId: chunk.id,
      });
    }
  }
  if (toAdd.length > 0) appStore.dispatch(tasksSlice.actions.addDailyMany(toAdd));
  return toAdd.length;
}

/** Create today's instances of active recurring tasks (idempotent). */
export function generateRecurringToday(): void {
  const state = appStore.getState() as AppState;
  const today = todayStr();
  const weekday = new Date().getDay();
  const existing = new Set(state.tasks.daily.map((t) => t.refId));
  const toAdd = [];
  for (const r of state.tasks.recurring) {
    if (!r.active) continue;
    const due = r.frequency === 'daily' || r.days.includes(weekday);
    const refId = `rec-${r.id}-${today}`;
    if (due && !existing.has(refId)) {
      toAdd.push({
        id: uid(), date: today, title: r.title, done: false, priority: 1,
        linkedSurah: null, kind: 'general' as const, refId,
      });
    }
  }
  if (toAdd.length > 0) appStore.dispatch(tasksSlice.actions.addDailyMany(toAdd));
}

/**
 * Automatically synchronizes due items from the Revision section
 * (khatma plan + weak parts fixation) into Daily Tasks (مهام يومية).
 */
export function syncScheduleTasks(): void {
  const state = appStore.getState() as AppState;
  const today = todayStr();
  const days = state.schedule.days;
  const weakParts = state.schedule.weakParts;
  const dailyTasks = state.tasks.daily;

  const existingMap = new Map<string, typeof dailyTasks[0]>();
  for (const t of dailyTasks) {
    if (t.refId) existingMap.set(t.refId, t);
  }

  const toAdd: typeof dailyTasks = [];

  // 1. Khatma plan portion due today
  if (days.length > 0) {
    const todayItem = days.find((d) => d.date === today) || days.find((d) => !d.done);
    if (todayItem) {
      const refId = `khatma-${todayItem.id}`;
      const existing = existingMap.get(refId);
      if (!existing) {
        toAdd.push({
          id: uid(),
          date: today,
          title: `ورد مراجعة المحفوظ: ${todayItem.title} (${todayItem.details})`,
          done: todayItem.done,
          priority: 2,
          linkedSurah: null,
          kind: 'revision',
          refId,
        });
      } else if (existing.done !== todayItem.done) {
        appStore.dispatch(tasksSlice.actions.setDailyDone({ id: existing.id, done: todayItem.done }));
      }
    }
  }

  // 2. Weak parts due today for fixation
  for (const wp of weakParts) {
    if (wp.nextReviewDate <= today) {
      const refId = `weak-${wp.id}-${wp.nextReviewDate}`;
      const existing = existingMap.get(refId);
      if (!existing) {
        toAdd.push({
          id: uid(),
          date: today,
          title: `تثبيت جزء ضعيف: ${wp.title} (${wp.stage === 'sight' ? 'بالنظر' : 'غيباً'})`,
          done: false,
          priority: 3,
          linkedSurah: wp.surahNumber ?? null,
          kind: 'fixation',
          refId,
        });
      }
    }
  }

  if (toAdd.length > 0) {
    appStore.dispatch(tasksSlice.actions.addDailyMany(toAdd));
  }
}

/** Replace all state from a validated backup file. */
export function importBackupData(backup: BackupFile): void {
  const t = backup.tables;
  const prefs = (t.userPreferences?.[0] as unknown as typeof defaultPrefs) ?? defaultPrefs;
  loadStateIntoStore({
    prefs: { ...defaultPrefs, ...prefs, key: 'settings' },
    progress: { entries: (t.memorizationProgress ?? []) as AppState['progress']['entries'] },
    revision: {
      plans: (t.revisionPlans ?? []) as AppState['revision']['plans'],
      tasks: (t.revisionTasks ?? []) as AppState['revision']['tasks'],
      sessions: (t.revisionSessions ?? []) as AppState['revision']['sessions'],
      history: (t.revisionHistory ?? []) as AppState['revision']['history'],
    },
    tasks: {
      daily: (t.dailyTasks ?? []) as AppState['tasks']['daily'],
      recurring: (t.recurringTasks ?? []) as AppState['tasks']['recurring'],
    },
    mistakes: {
      items: (t.mistakes ?? []) as AppState['mistakes']['items'],
      bookmarks: (t.bookmarks ?? []) as AppState['mistakes']['bookmarks'],
    },
    focus: {
      sessions: (t.focusSessions ?? []) as AppState['focus']['sessions'],
      distractions: (t.distractions ?? []) as AppState['focus']['distractions'],
    },
    wird: { items: (t.wirdCompletions ?? []) as AppState['wird']['items'] },
    schedule: {
      config: ((t.scheduleConfig?.[0] as unknown as AppState['schedule']['config']) ?? defaultScheduleConfig),
      days: ((t.scheduleDays ?? []) as AppState['schedule']['days']),
      weakParts: ((t.weakParts ?? []) as AppState['schedule']['weakParts']),
    },
  });
  // Persist immediately (middleware debounce also covers it).
  void persistAll(appStore.getState() as AppState);
}

/** Remove only the labelled sample rows (ids start with "sample-"). */
export function clearSampleData(): void {
  const state = appStore.getState() as AppState;
  const isSample = (id: string) => id.startsWith('sample-');
  appStore.dispatch(progressSlice.actions.removeEntries(state.progress.entries.filter((e) => isSample(e.id)).map((e) => e.id)));
  appStore.dispatch(tasksSlice.actions.setTasksAll({
    daily: state.tasks.daily.filter((t) => !isSample(t.id)),
    recurring: state.tasks.recurring.filter((t) => !isSample(t.id)),
  }));
  appStore.dispatch(mistakesSlice.actions.setMistakesAll({
    items: state.mistakes.items.filter((m) => !isSample(m.id)),
    bookmarks: state.mistakes.bookmarks.filter((b) => !isSample(b.id)),
  }));
  appStore.dispatch(prefsSlice.actions.setPrefs({ sampleLoaded: false }));
}

/** Wipe everything (with confirm in the UI). */
export async function clearAllData(): Promise<void> {
  appStore.dispatch(prefsSlice.actions.setPrefs({ ...defaultPrefs, sampleLoaded: false }));
  appStore.dispatch(progressSlice.actions.setEntries([]));
  appStore.dispatch(revisionSlice.actions.setRevisionAll({ plans: [], tasks: [], sessions: [], history: [] }));
  appStore.dispatch(tasksSlice.actions.setTasksAll({ daily: [], recurring: [] }));
  appStore.dispatch(mistakesSlice.actions.setMistakesAll({ items: [], bookmarks: [] }));
  appStore.dispatch(focusSlice.actions.setFocusAll({ sessions: [], distractions: [] }));
  appStore.dispatch(wirdSlice.actions.setWirdAll([]));
  appStore.dispatch(scheduleSlice.actions.resetSchedule());
  await persistAll(appStore.getState() as AppState);
}
