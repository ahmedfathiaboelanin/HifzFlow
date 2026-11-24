// Verification simulation for the fixation + spaced-repetition rules.
// Run: npm run simulate
// Imports the REAL logic from src/lib (not a copy) and asserts the settled rules.
import { balancedChunks, buildKhatma, rateEntry } from '../src/lib/fixation';
import { ayahJuz, ayahPage, TOTAL_AYAHS, TOTAL_PAGES, TOTAL_SURAHS } from '../src/lib/quran';
import type { ProgressEntry } from '../src/lib/types';

let failures = 0;
function check(name: string, cond: boolean, detail = '') {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
  if (!cond) failures++;
}

const entry = (over: Partial<ProgressEntry>): ProgressEntry => ({
  id: 't1', surah: 10, fromAyah: 1, toAyah: 109, status: 'memorized', strength: 'weak',
  srStage: 0, srDue: '2026-11-23', easyStreak: 0, stabilizedAt: null, createdAt: '2026-11-23',
  ...over,
});

// ---- Data ---------------------------------------------------------------
check('114 surahs', TOTAL_SURAHS === 114, String(TOTAL_SURAHS));
check('6236 ayahs', TOTAL_AYAHS === 6236, String(TOTAL_AYAHS));
check('604 pages', TOTAL_PAGES === 604, String(TOTAL_PAGES));
check('p1 Al-Fatiha', ayahPage(1, 7) === 1);
check('p2 Al-Baqarah 1-5', [1, 2, 3, 4, 5].every((n) => ayahPage(2, n) === 2));
check('p582 start of Juz 30', ayahPage(78, 1) === 582 && ayahJuz(78, 1) === 30);

// ---- Chunking ------------------------------------------------------------
check('Yunus 14 pages @5 = [5,5,4]', JSON.stringify(balancedChunks(14, 5)) === '[5,5,4]');
check('Al-Kahf 12 pages @12 = [12]', JSON.stringify(balancedChunks(12, 12)) === '[12]');
check('48 pages @6 = 8x6', JSON.stringify(balancedChunks(48, 6)) === '[6,6,6,6,6,6,6,6]');

// ---- Khatma plan ----------------------------------------------------------
const sample: ProgressEntry[] = [
  entry({ id: 'yunus', surah: 10, fromAyah: 1, toAyah: 109, strength: 'weak' }),
  entry({ id: 'kahf', surah: 18, fromAyah: 1, toAyah: 110, strength: 'medium' }),
  entry({ id: 'yasin', surah: 36, fromAyah: 1, toAyah: 83, strength: 'strong' }),
  entry({ id: 'mulk', surah: 67, fromAyah: 1, toAyah: 30, strength: 'strong' }),
];
const plan = buildKhatma(sample, { weak: 5, medium: 15, strong: 20 }, '2026-11-23');
check('weak Yunus = 3 chunks', plan.levelChunks.weak.length === 3, `got ${plan.levelChunks.weak.length}`);
check('weak chunk sizes 5,5,4', JSON.stringify(plan.levelChunks.weak.map((c) => c.pageCount)) === '[5,5,4]');
check('medium Al-Kahf = 1 chunk', plan.levelChunks.medium.length === 1);
check('khatma day 1 mixes all 3 levels', plan.days[0].chunks.length === 3);
check('15-day khatm arithmetic: round(604/40) = 15', Math.round(604 / 40) === 15);

// ---- Spaced repetition: the settled weak rule ------------------------------
const TODAY = '2026-11-23';
// 1. Good at the final weak stage (stage 5) -> stabilizes to medium, due +15d.
const r1 = rateEntry(entry({ srStage: 5 }), 'good', 15, TODAY);
check('weak Good at final stage promotes to medium', r1.entry.strength === 'medium' && r1.stabilized, `strength=${r1.entry.strength}`);
check('stabilized next due = +15d', r1.entry.srDue === '2026-12-08', `due=${r1.entry.srDue}`);
check('stabilizedAt stamped', r1.entry.stabilizedAt === TODAY);
// 2. Again at the final stage restarts the cycle (no promotion).
const r2 = rateEntry(entry({ srStage: 5 }), 'again', 15, TODAY);
check('weak Again at final stage restarts (still weak, stage 0)', r2.entry.strength === 'weak' && r2.entry.srStage === 0 && !r2.stabilized);
check('Again due = +1d', r2.entry.srDue === '2026-11-24', `due=${r2.entry.srDue}`);
// 3. Easy twice mid-cycle does NOT promote weak.
const step1 = rateEntry(entry({ srStage: 2, easyStreak: 0 }), 'easy', 15, TODAY);
const step2 = rateEntry(step1.entry, 'easy', 15, TODAY);
check('weak Easy x2 mid-cycle stays weak', step2.entry.strength === 'weak' && !step2.stabilized, `strength=${step2.entry.strength} stage=${step2.entry.srStage}`);
check('weak Easy x2 advances stages only', step2.entry.srStage === 4, `stage=${step2.entry.srStage}`);
// 4. Post-fixation cycle 10 days -> +10d next due.
const r4 = rateEntry(entry({ srStage: 5 }), 'good', 10, TODAY);
check('post-fixation cycle 10 -> due +10d', r4.entry.srDue === '2026-12-03', `due=${r4.entry.srDue}`);
// 5. Good mid-cycle advances one stage (1->2->3->5->7->10 intervals).
const r5 = rateEntry(entry({ srStage: 0 }), 'good', 15, TODAY);
check('weak stage 0 Good -> stage 1, due +2d', r5.entry.srStage === 1 && r5.entry.srDue === '2026-11-25', `stage=${r5.entry.srStage} due=${r5.entry.srDue}`);
const r6 = rateEntry(entry({ srStage: 4 }), 'good', 15, TODAY);
check('weak stage 4 Good -> stage 5, due +10d', r6.entry.srStage === 5 && r6.entry.srDue === '2026-12-03', `stage=${r6.entry.srStage} due=${r6.entry.srDue}`);
// 6. Non-weak Easy x2 DOES upgrade (medium -> strong).
const m1 = rateEntry(entry({ strength: 'medium', srStage: 1, easyStreak: 0 }), 'easy', 15, TODAY);
const m2 = rateEntry(m1.entry, 'easy', 15, TODAY);
check('medium Easy x2 upgrades to strong', m2.entry.strength === 'strong', `strength=${m2.entry.strength}`);
// 7. No khatma-based promotion exists in the logic: buildKhatma never changes strength.
const before = sample.map((e) => e.strength).join(',');
buildKhatma(sample, { weak: 5, medium: 15, strong: 20 }, '2026-11-23');
check('khatma planning never changes strengths', sample.map((e) => e.strength).join(',') === before);

console.log(failures === 0 ? '\nALL CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
