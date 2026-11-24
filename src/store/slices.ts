// Redux Toolkit slices — one per Dexie table group.
// Persistence to IndexedDB is done by middleware in store.ts; slices stay pure.
import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type {
  Bookmark, DailyTask, Distraction, FixRates, FocusSession, Mistake,
  Preferences, ProgressEntry, RecurringTask, RevisionHistoryItem,
  RevisionPlan, RevisionSessionItem, RevisionTask, WirdCompletion,
} from '../lib/types';

export const defaultPrefs: Preferences = {
  key: 'settings',
  palette: 'sage',
  mode: 'system',
  rates: { weak: 5, medium: 15, strong: 20 },
  fixationReviewCycle: 15,
  wirdCycleDays: 15,
  wirdCycleStart: null,
  dailyMinutes: 60,
  sampleLoaded: false,
};

// ---- Preferences -------------------------------------------------------------
export const prefsSlice = createSlice({
  name: 'prefs',
  initialState: defaultPrefs,
  reducers: {
    setPrefs: (state, action: PayloadAction<Partial<Preferences>>) => ({ ...state, ...action.payload }),
    setRates: (state, action: PayloadAction<Partial<FixRates>>) => {
      state.rates = { ...state.rates, ...action.payload };
    },
  },
});

// ---- Memorization progress -----------------------------------------------------
export const progressSlice = createSlice({
  name: 'progress',
  initialState: { entries: [] as ProgressEntry[] },
  reducers: {
    setEntries: (state, action: PayloadAction<ProgressEntry[]>) => {
      state.entries = action.payload;
    },
    addEntry: (state, action: PayloadAction<ProgressEntry>) => {
      state.entries.push(action.payload);
    },
    addEntries: (state, action: PayloadAction<ProgressEntry[]>) => {
      state.entries.push(...action.payload);
    },
    updateEntry: (state, action: PayloadAction<{ id: string; patch: Partial<ProgressEntry> }>) => {
      const e = state.entries.find((x) => x.id === action.payload.id);
      if (e) Object.assign(e, action.payload.patch);
    },
    removeEntry: (state, action: PayloadAction<string>) => {
      state.entries = state.entries.filter((x) => x.id !== action.payload);
    },
    removeEntries: (state, action: PayloadAction<string[]>) => {
      const ids = new Set(action.payload);
      state.entries = state.entries.filter((x) => !ids.has(x.id));
    },
  },
});

// ---- Revision (plans / tasks / sessions / history) ------------------------------
export const revisionSlice = createSlice({
  name: 'revision',
  initialState: {
    plans: [] as RevisionPlan[],
    tasks: [] as RevisionTask[],
    sessions: [] as RevisionSessionItem[],
    history: [] as RevisionHistoryItem[],
  },
  reducers: {
    setRevisionAll: (state, action: PayloadAction<Partial<typeof state>>) => ({ ...state, ...action.payload }),
    addHistory: (state, action: PayloadAction<RevisionHistoryItem>) => {
      state.history.unshift(action.payload);
    },
    addSession: (state, action: PayloadAction<RevisionSessionItem>) => {
      state.sessions.unshift(action.payload);
    },
    addPlan: (state, action: PayloadAction<RevisionPlan>) => {
      state.plans.push(action.payload);
    },
    addTask: (state, action: PayloadAction<RevisionTask>) => {
      state.tasks.push(action.payload);
    },
    setTaskDone: (state, action: PayloadAction<{ id: string; done: boolean }>) => {
      const t = state.tasks.find((x) => x.id === action.payload.id);
      if (t) t.status = action.payload.done ? 'done' : 'pending';
    },
  },
});

// ---- Daily + recurring tasks -----------------------------------------------------
export const tasksSlice = createSlice({
  name: 'tasks',
  initialState: { daily: [] as DailyTask[], recurring: [] as RecurringTask[] },
  reducers: {
    setTasksAll: (state, action: PayloadAction<Partial<typeof state>>) => ({ ...state, ...action.payload }),
    addDaily: (state, action: PayloadAction<DailyTask>) => {
      state.daily.push(action.payload);
    },
    addDailyMany: (state, action: PayloadAction<DailyTask[]>) => {
      state.daily.push(...action.payload);
    },
    toggleDaily: (state, action: PayloadAction<string>) => {
      const t = state.daily.find((x) => x.id === action.payload);
      if (t) t.done = !t.done;
    },
    setDailyDone: (state, action: PayloadAction<{ id: string; done: boolean }>) => {
      const t = state.daily.find((x) => x.id === action.payload.id);
      if (t) t.done = action.payload.done;
    },
    removeDaily: (state, action: PayloadAction<string>) => {
      state.daily = state.daily.filter((x) => x.id !== action.payload);
    },
    removeDailyByRef: (state, action: PayloadAction<string>) => {
      state.daily = state.daily.filter((x) => x.refId !== action.payload);
    },
    addRecurring: (state, action: PayloadAction<RecurringTask>) => {
      state.recurring.push(action.payload);
    },
    toggleRecurring: (state, action: PayloadAction<string>) => {
      const t = state.recurring.find((x) => x.id === action.payload);
      if (t) t.active = !t.active;
    },
    removeRecurring: (state, action: PayloadAction<string>) => {
      state.recurring = state.recurring.filter((x) => x.id !== action.payload);
    },
  },
});

// ---- Mistakes + bookmarks ---------------------------------------------------------
export const mistakesSlice = createSlice({
  name: 'mistakes',
  initialState: { items: [] as Mistake[], bookmarks: [] as Bookmark[] },
  reducers: {
    setMistakesAll: (state, action: PayloadAction<Partial<typeof state>>) => ({ ...state, ...action.payload }),
    addMistake: (state, action: PayloadAction<Mistake>) => {
      state.items.unshift(action.payload);
    },
    bumpMistake: (state, action: PayloadAction<string>) => {
      const m = state.items.find((x) => x.id === action.payload);
      if (m) {
        m.count += 1;
        m.lastSeen = new Date().toISOString();
      }
    },
    resolveMistake: (state, action: PayloadAction<{ id: string; resolved: boolean }>) => {
      const m = state.items.find((x) => x.id === action.payload.id);
      if (m) m.resolved = action.payload.resolved;
    },
    removeMistake: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((x) => x.id !== action.payload);
    },
    addBookmark: (state, action: PayloadAction<Bookmark>) => {
      state.bookmarks.unshift(action.payload);
    },
    removeBookmark: (state, action: PayloadAction<string>) => {
      state.bookmarks = state.bookmarks.filter((x) => x.id !== action.payload);
    },
  },
});

// ---- Focus -------------------------------------------------------------------------
export const focusSlice = createSlice({
  name: 'focus',
  initialState: { sessions: [] as FocusSession[], distractions: [] as Distraction[] },
  reducers: {
    setFocusAll: (state, action: PayloadAction<Partial<typeof state>>) => ({ ...state, ...action.payload }),
    addFocusSession: (state, action: PayloadAction<FocusSession>) => {
      state.sessions.unshift(action.payload);
    },
    addDistraction: (state, action: PayloadAction<Distraction>) => {
      state.distractions.unshift(action.payload);
    },
  },
});

// ---- Rotating wird completions ---------------------------------------------------------
export const wirdSlice = createSlice({
  name: 'wird',
  initialState: { items: [] as WirdCompletion[] },
  reducers: {
    setWirdAll: (state, action: PayloadAction<WirdCompletion[]>) => {
      state.items = action.payload;
    },
    toggleWirdDay: (state, action: PayloadAction<{ cycleStart: string; day: number }>) => {
      const { cycleStart, day } = action.payload;
      const i = state.items.findIndex((x) => x.cycleStart === cycleStart && x.day === day);
      if (i >= 0) state.items.splice(i, 1);
      else state.items.push({ id: `${cycleStart}-${day}`, cycleStart, day, doneAt: new Date().toISOString() });
    },
  },
});

// ---- Meta (not persisted) ---------------------------------------------------------------
export const metaSlice = createSlice({
  name: 'meta',
  initialState: { storage: 'indexeddb' as 'indexeddb' | 'memory', hydrated: false },
  reducers: {
    setStorage: (state, action: PayloadAction<'indexeddb' | 'memory'>) => {
      state.storage = action.payload;
    },
    setHydrated: (state) => {
      state.hydrated = true;
    },
  },
});
