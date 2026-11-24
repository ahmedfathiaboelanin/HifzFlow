// Validated JSON backup export/import.
// Format matches the hosted app's export (same tables, same row shapes) so a
// backup exported from the hosted HifzFlow imports here unchanged.
// Validation (Zod) checks the file structure; row shapes are kept loose on
// purpose — a backup is accepted if every table is an array of objects, and
// the store applies its own defaults for missing fields.
import { z } from 'zod';
import type { AppState } from '../store/store';

const tableSchema = z.array(z.looseObject({}));

export const BackupSchema = z.object({
  app: z.literal('HifzFlow'),
  version: z.number(),
  exportedAt: z.string(),
  tables: z.object({
    memorizationProgress: tableSchema,
    revisionPlans: tableSchema,
    revisionTasks: tableSchema,
    revisionSessions: tableSchema,
    revisionHistory: tableSchema,
    mistakes: tableSchema,
    bookmarks: tableSchema,
    focusSessions: tableSchema,
    distractions: tableSchema,
    dailyTasks: tableSchema,
    recurringTasks: tableSchema,
    userPreferences: tableSchema,
    wirdCompletions: tableSchema,
  }).partial(),
});

export type BackupTableName =
  | 'memorizationProgress' | 'revisionPlans' | 'revisionTasks' | 'revisionSessions'
  | 'revisionHistory' | 'mistakes' | 'bookmarks' | 'focusSessions' | 'distractions'
  | 'dailyTasks' | 'recurringTasks' | 'userPreferences' | 'wirdCompletions';

export interface BackupFile {
  app: 'HifzFlow';
  version: number;
  exportedAt: string;
  tables: Partial<Record<BackupTableName, unknown[]>>;
}

export function buildBackup(state: AppState): BackupFile {
  return {
    app: 'HifzFlow',
    version: 1,
    exportedAt: new Date().toISOString(),
    tables: {
      memorizationProgress: state.progress.entries,
      revisionPlans: state.revision.plans,
      revisionTasks: state.revision.tasks,
      revisionSessions: state.revision.sessions,
      revisionHistory: state.revision.history,
      mistakes: state.mistakes.items,
      bookmarks: state.mistakes.bookmarks,
      focusSessions: state.focus.sessions,
      distractions: state.focus.distractions,
      dailyTasks: state.tasks.daily,
      recurringTasks: state.tasks.recurring,
      userPreferences: [state.prefs],
      wirdCompletions: state.wird.items,
    },
  };
}

export function validateBackup(data: unknown): { ok: true; backup: BackupFile } | { ok: false; errors: string[] } {
  const parsed = BackupSchema.safeParse(data);
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`) };
  }
  return { ok: true, backup: parsed.data as unknown as BackupFile };
}

export function downloadBackup(state: AppState): void {
  const blob = new Blob([JSON.stringify(buildBackup(state), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `hifzflow-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
