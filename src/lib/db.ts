// Dexie.js + IndexedDB. Database `HifzFlowDB` — same name and tables as the
// hosted app so a JSON backup exported there imports here unchanged.
// One repository per table (CRUD only); features never touch Dexie directly.
// A future Supabase adapter implements the same SyncProvider interface.
import Dexie from 'dexie';
import type { Table } from 'dexie';
import type {
  Bookmark, DailyTask, Distraction, FocusSession, Mistake, Preferences,
  ProgressEntry, RecurringTask, RevisionHistoryItem, RevisionPlan,
  RevisionSessionItem, RevisionTask, WirdCompletion,
} from './types';

export class HifzFlowDB extends Dexie {
  memorizationProgress!: Table<ProgressEntry, string>;
  revisionPlans!: Table<RevisionPlan, string>;
  revisionTasks!: Table<RevisionTask, string>;
  revisionSessions!: Table<RevisionSessionItem, string>;
  revisionHistory!: Table<RevisionHistoryItem, string>;
  mistakes!: Table<Mistake, string>;
  bookmarks!: Table<Bookmark, string>;
  focusSessions!: Table<FocusSession, string>;
  distractions!: Table<Distraction, string>;
  dailyTasks!: Table<DailyTask, string>;
  recurringTasks!: Table<RecurringTask, string>;
  userPreferences!: Table<Preferences, string>;
  wirdCompletions!: Table<WirdCompletion, string>;

  constructor() {
    super('HifzFlowDB');
    this.version(1).stores({
      memorizationProgress: 'id, surah, status, strength, srDue',
      revisionPlans: 'id, createdAt',
      revisionTasks: 'id, planId, dueDate, status',
      revisionSessions: 'id, taskId, startedAt',
      revisionHistory: 'id, progressId, reviewedAt',
      mistakes: 'id, surah, resolved',
      bookmarks: 'id, surah, ayah',
      focusSessions: 'id, startedAt, mode',
      distractions: 'id, sessionId, at',
      dailyTasks: 'id, date, done, kind, refId',
      recurringTasks: 'id, active',
      userPreferences: 'key',
      wirdCompletions: 'id, cycleStart, day',
    });
  }
}

export const db = new HifzFlowDB();

/** Open the DB; returns false when IndexedDB is unavailable/blocked. */
export async function openDb(): Promise<boolean> {
  try {
    await db.open();
    return true;
  } catch {
    return false;
  }
}

// ---- Repository abstraction -------------------------------------------------

export interface Repo<T> {
  list(): Promise<T[]>;
  get(id: string): Promise<T | undefined>;
  put(item: T): Promise<void>;
  bulkPut(items: T[]): Promise<void>;
  remove(id: string): Promise<void>;
  clear(): Promise<void>;
}

export function dexieRepo<T extends { id: string }>(table: Table<T, string>): Repo<T> {
  return {
    list: () => table.toArray(),
    get: (id) => table.get(id),
    put: (item) => table.put(item).then(() => undefined),
    bulkPut: (items) => table.bulkPut(items).then(() => undefined),
    remove: (id) => table.delete(id).then(() => undefined),
    clear: () => table.clear().then(() => undefined),
  };
}

export const repos = {
  progress: () => dexieRepo(db.memorizationProgress),
  plans: () => dexieRepo(db.revisionPlans),
  revisionTasks: () => dexieRepo(db.revisionTasks),
  sessions: () => dexieRepo(db.revisionSessions),
  history: () => dexieRepo(db.revisionHistory),
  mistakes: () => dexieRepo(db.mistakes),
  bookmarks: () => dexieRepo(db.bookmarks),
  focusSessions: () => dexieRepo(db.focusSessions),
  distractions: () => dexieRepo(db.distractions),
  dailyTasks: () => dexieRepo(db.dailyTasks),
  recurringTasks: () => dexieRepo(db.recurringTasks),
  wirdCompletions: () => dexieRepo(db.wirdCompletions),
};

// ---- Sync provider (MVP: no cloud sync) --------------------------------------

export interface SyncProvider {
  readonly name: string;
  push(): Promise<void>;
  pull(): Promise<void>;
}

/** MVP placeholder. A future Supabase adapter implements this interface;
 *  features call repositories, never a sync backend directly. */
export class NoopSyncProvider implements SyncProvider {
  readonly name = 'local-only (no sync in MVP)';
  async push(): Promise<void> {
    throw new Error('Cloud sync is not enabled in the MVP — data stays on this device.');
  }
  async pull(): Promise<void> {
    throw new Error('Cloud sync is not enabled in the MVP — data stays on this device.');
  }
}

export const syncProvider: SyncProvider = new NoopSyncProvider();
