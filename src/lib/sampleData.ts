// Clearly labelled sample dataset (first-run demo data).
// Sample rows use "sample-" id prefixes so they can be cleared with one click
// (Dashboard / Backup) without touching the user's own data.
import type { AppState } from '../store/store';
import { todayStr, addDaysStr } from './utils';

export function buildSampleState(today: string = todayStr()): Partial<AppState> {
  const t = today;
  return {
    progress: {
      entries: [
        { id: 'sample-prog-fatiha', surah: 1, fromAyah: 1, toAyah: 7, status: 'mastered', strength: 'veryStrong', srStage: 0, srDue: addDaysStr(t, 7), easyStreak: 0, stabilizedAt: null, createdAt: t },
        { id: 'sample-prog-mulk', surah: 67, fromAyah: 1, toAyah: 30, status: 'mastered', strength: 'strong', srStage: 2, srDue: addDaysStr(t, 3), easyStreak: 0, stabilizedAt: null, createdAt: t },
        { id: 'sample-prog-yasin', surah: 36, fromAyah: 1, toAyah: 83, status: 'memorized', strength: 'medium', srStage: 1, srDue: addDaysStr(t, 1), easyStreak: 0, stabilizedAt: null, createdAt: t },
        { id: 'sample-prog-kahf', surah: 18, fromAyah: 1, toAyah: 110, status: 'memorized', strength: 'medium', srStage: 0, srDue: t, easyStreak: 0, stabilizedAt: null, createdAt: t },
        { id: 'sample-prog-yunus', surah: 10, fromAyah: 1, toAyah: 109, status: 'memorized', strength: 'weak', srStage: 2, srDue: t, easyStreak: 0, stabilizedAt: null, createdAt: t },
        { id: 'sample-prog-baqara', surah: 2, fromAyah: 1, toAyah: 5, status: 'memorized', strength: 'weak', srStage: 0, srDue: t, easyStreak: 0, stabilizedAt: null, createdAt: t },
      ],
    },
    tasks: {
      daily: [
        { id: 'sample-task-1', date: t, title: 'مراجعة سورة يونس (ضعيف) — ٥ صفحات', done: false, priority: 3, linkedSurah: 10, kind: 'fixation', refId: null },
        { id: 'sample-task-2', date: t, title: 'ورد الختم: جزآن', done: false, priority: 2, linkedSurah: null, kind: 'revision', refId: null },
        { id: 'sample-task-3', date: addDaysStr(t, 1), title: 'تسميع الكهف (متوسط)', done: false, priority: 2, linkedSurah: 18, kind: 'revision', refId: null },
      ],
      recurring: [
        { id: 'sample-rec-1', title: 'أذكار الصباح', frequency: 'daily', days: [], active: true },
        { id: 'sample-rec-2', title: 'مراجعة جزء عم', frequency: 'weekly', days: [5], active: true },
      ],
    },
    mistakes: {
      items: [
        { id: 'sample-mistake-1', surah: 10, ayah: 25, type: 'word', note: 'تثبيت كلمة «دار السلام»', count: 2, lastSeen: new Date().toISOString(), resolved: false },
        { id: 'sample-mistake-2', surah: 18, ayah: 10, type: 'tajweed', note: 'إدغام في «إذ أوى الفتية»', count: 1, lastSeen: new Date().toISOString(), resolved: false },
      ],
      bookmarks: [
        { id: 'sample-bookmark-1', surah: 10, ayah: 25, note: 'آية أحب أراجعها', createdAt: new Date().toISOString() },
      ],
    },
  };
}
