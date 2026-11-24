// Read-only helpers over the bundled immutable Quran datasets.
// Verse text is reference data — the app shows a "verify against the mushaf"
// reminder wherever verse text is displayed.
import { PAGES, SURAHS } from '../data/mushaf';
import type { PageInfo } from '../data/mushaf';
import type { ProgressEntry } from './types';

interface AyahData { n: number; text: string; page: number; juz: number }
interface SurahData {
  number: number; name: string; englishName: string;
  englishNameTranslation: string; revelationType: string; ayahs: AyahData[];
}
interface QuranData { surahs: SurahData[] }

// The full Uthmani text (~2 MB) is a separate chunk: the shell and dashboard
// paint first, and App awaits this loader before rendering pages.
let DATA: QuranData = { surahs: [] };
let loading: Promise<void> | null = null;

export function loadQuranData(): Promise<void> {
  if (DATA.surahs.length > 0) return Promise.resolve();
  if (!loading) {
    loading = import('../data/quran.json').then((mod) => {
      DATA = ((mod as { default?: unknown }).default ?? mod) as QuranData;
    });
  }
  return loading;
}

export function isQuranLoaded(): boolean {
  return DATA.surahs.length > 0;
}

export const TOTAL_SURAHS = 114;
export const TOTAL_AYAHS = 6236;
export const TOTAL_PAGES = 604;
export const TOTAL_JUZ = 30;

export { SURAHS };
export type { PageInfo };

export function getSurah(n: number): SurahData | undefined {
  return DATA.surahs.find((s) => s.number === n);
}

export function surahName(n: number): string {
  return getSurah(n)?.name ?? `سورة ${n}`;
}

export function surahAyahCount(n: number): number {
  return getSurah(n)?.ayahs.length ?? 0;
}

export function ayahText(surah: number, ayah: number): string {
  return getSurah(surah)?.ayahs.find((a) => a.n === ayah)?.text ?? '';
}

export function ayahPage(surah: number, ayah: number): number {
  return getSurah(surah)?.ayahs.find((a) => a.n === ayah)?.page ?? 1;
}

export function ayahJuz(surah: number, ayah: number): number {
  return getSurah(surah)?.ayahs.find((a) => a.n === ayah)?.juz ?? 1;
}

export function pageInfo(page: number): PageInfo {
  return PAGES[Math.min(Math.max(page, 1), 604) - 1];
}

/** All ayahs on a mushaf page, in order, with their text. */
export function pageAyahs(page: number): Array<{ surah: number; ayah: number; text: string }> {
  const info = pageInfo(page);
  const out: Array<{ surah: number; ayah: number; text: string }> = [];
  for (const r of info.ranges) {
    for (let a = r.from; a <= r.to; a++) {
      out.push({ surah: r.surah, ayah: a, text: ayahText(r.surah, a) });
    }
  }
  return out;
}

/** Mushaf pages of a surah, each with its ayah range. */
export function surahPages(surah: number): Array<{ page: number; from: number; to: number; juz: number }> {
  const s = getSurah(surah);
  if (!s) return [];
  const out: Array<{ page: number; from: number; to: number; juz: number }> = [];
  for (const a of s.ayahs) {
    const last = out[out.length - 1];
    if (last && last.page === a.page && last.to === a.n - 1) last.to = a.n;
    else out.push({ page: a.page, from: a.n, to: a.n, juz: a.juz });
  }
  return out;
}

export interface PageUnit { surah: number; page: number; from: number; to: number; juz: number }

/** Split a memorized range into per-page units (mushaf order). */
export function rangePageUnits(fromSurah: number, fromAyah: number, toSurah: number, toAyah: number): PageUnit[] {
  const units: PageUnit[] = [];
  let s = fromSurah;
  let a = fromAyah;
  // Guard against inverted ranges.
  if (s > toSurah || (s === toSurah && a > toAyah)) return units;
  while (s < toSurah || (s === toSurah && a <= toAyah)) {
    const surah = getSurah(s);
    if (!surah) break;
    const endAyah = s === toSurah ? toAyah : surah.ayahs.length;
    for (let n = a; n <= endAyah; n++) {
      const ay = surah.ayahs[n - 1];
      const last = units[units.length - 1];
      if (last && last.surah === s && last.page === ay.page && last.to === n - 1) last.to = n;
      else units.push({ surah: s, page: ay.page, from: n, to: n, juz: ay.juz });
    }
    s += 1;
    a = 1;
  }
  return units;
}

export function rangeAyahCount(fromSurah: number, fromAyah: number, toSurah: number, toAyah: number): number {
  if (fromSurah === toSurah) return Math.max(0, toAyah - fromAyah + 1);
  let n = 0;
  for (let s = fromSurah; s <= toSurah; s++) {
    const c = surahAyahCount(s);
    if (s === fromSurah) n += c - fromAyah + 1;
    else if (s === toSurah) n += toAyah;
    else n += c;
  }
  return n;
}

export function rangePages(fromSurah: number, fromAyah: number, toSurah: number, toAyah: number): number[] {
  const units = rangePageUnits(fromSurah, fromAyah, toSurah, toAyah);
  return [...new Set(units.map((u) => u.page))];
}

/** Ayah count of a progress entry. */
export function entryAyahCount(e: ProgressEntry): number {
  return rangeAyahCount(e.surah, e.fromAyah, e.surah, e.toAyah);
}

export function entryPages(e: ProgressEntry): number[] {
  return rangePages(e.surah, e.fromAyah, e.surah, e.toAyah);
}

/** Is this ayah inside any memorized/mastered entry? */
export function memorizedStrength(entries: ProgressEntry[], surah: number, ayah: number): string | null {
  for (const e of entries) {
    if (e.surah === surah && ayah >= e.fromAyah && ayah <= e.toAyah) return e.strength;
  }
  return null;
}

// ---- Diacritic-insensitive Arabic search ---------------------------------
export function stripDiacritics(text: string): string {
  return text
    .replace(/[\u064B-\u0652\u0670\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي');
}

export interface SearchHit { surah: number; ayah: number; text: string; page: number; juz: number }

export function searchAyahs(query: string, limit = 100): SearchHit[] {
  const q = stripDiacritics(query.trim());
  if (q.length < 2) return [];
  const hits: SearchHit[] = [];
  for (const s of DATA.surahs) {
    for (const a of s.ayahs) {
      if (stripDiacritics(a.text).includes(q)) {
        hits.push({ surah: s.number, ayah: a.n, text: a.text, page: a.page, juz: a.juz });
        if (hits.length >= limit) return hits;
      }
    }
  }
  return hits;
}

/** Memorized ayah count per juz (for analytics coverage). */
export function juzCoverage(entries: ProgressEntry[]): Array<{ juz: number; memorized: number; total: number }> {
  const total = new Array<number>(31).fill(0);
  const mem = new Array<number>(31).fill(0);
  for (const s of DATA.surahs) {
    for (const a of s.ayahs) total[a.juz] += 1;
  }
  for (const e of entries) {
    const s = getSurah(e.surah);
    if (!s) continue;
    for (let n = e.fromAyah; n <= e.toAyah; n++) {
      const ay = s.ayahs[n - 1];
      if (ay) mem[ay.juz] += 1;
    }
  }
  return Array.from({ length: 30 }, (_, i) => ({ juz: i + 1, memorized: mem[i + 1], total: total[i + 1] }));
}

export function totalMemorizedAyahs(entries: ProgressEntry[]): number {
  return entries.reduce((n, e) => n + entryAyahCount(e), 0);
}
