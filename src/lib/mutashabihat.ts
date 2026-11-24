// Mutashabihat (similar verses) reference dataset, imported from the
// standalone "ضبط المتشابهات — الماهر بالقرآن" app. The text is reference
// material: verified verses carry mushaf wording, the rest is flagged.
import raw from '../data/mutashabihat.json';
import { fmtNum } from './utils';

export type MutashabihRef = {
  surah: string;
  ayahs: number[];
  v?: boolean;
};

export type MutashabihVerse = {
  s: string;
  a: number;
  t: string;
};

export type MutashabihEntry = {
  id: string;
  sec: string;
  src: string;
  surah: string | null;
  juz: number | null;
  prophet: string | null;
  topic: string;
  detail: string;
  rule: string | null;
  sim: string | null;
  diff: string | null;
  refs: MutashabihRef[];
  pos: number;
  page: number;
  ayahs: number[];
  verses: MutashabihVerse[];
  unv?: boolean;
};

export const ENTRIES = raw as MutashabihEntry[];

export const SECTIONS = [
  { key: 'فوائد في ضبط المتشابهات', label: 'فوائد في ضبط المتشابهات', file: '70.pdf' },
  { key: 'قصص الأنبياء', label: 'متشابهات قصص الأنبياء', file: 'upload.pdf' },
  { key: 'المجموعة الكاملة بالأجزاء', label: 'المجموعة الكاملة بالأجزاء', file: 'upload-ee5c2c06.pdf' },
] as const;

export const SECTION_COUNTS: Record<string, number> = Object.fromEntries(
  SECTIONS.map((s) => [s.key, ENTRIES.filter((e) => e.sec === s.key).length]),
);

export const ENTRY_COUNT = ENTRIES.length;
export const VERSE_COUNT = ENTRIES.reduce((n, e) => n + (e.verses?.length ?? 0), 0);
export const UNVERIFIED_COUNT = ENTRIES.filter((e) => e.unv).length;
export const VERIFIED_ENTRY_COUNT = ENTRIES.filter((e) => e.verses?.length && !e.unv).length;
export const RULE_ENTRIES = ENTRIES.filter((e) => Boolean(e.rule));

const SURAH_NAMES = Array.from(
  new Set(
    ENTRIES.flatMap((e) => [e.surah, ...(e.refs ?? []).map((r) => r.surah)]).filter(
      (s): s is string => Boolean(s),
    ),
  ),
).sort((a, b) => a.localeCompare(b, 'ar'));

const JUZ_NUMBERS = Array.from(
  new Set(ENTRIES.map((e) => e.juz).filter((j): j is number => typeof j === 'number')),
).sort((a, b) => a - b);

const PROPHET_NAMES = Array.from(
  new Set(ENTRIES.map((e) => e.prophet).filter((p): p is string => Boolean(p))),
).sort((a, b) => a.localeCompare(b, 'ar'));

export const FILTER_OPTIONS = {
  surahs: SURAH_NAMES,
  juzs: JUZ_NUMBERS,
  prophets: PROPHET_NAMES,
};

/** Search normalization: diacritics, alef/ya/ta-marbuta variants, digits. */
export function normalizeArabic(value: string): string {
  return value
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/[\u064B-\u0652\u0670\u0640]/g, '')
    .replace(/[إأآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export type IndexedEntry = MutashabihEntry & {
  searchText: string;
  verseKeys: Set<string>;
  ayahSet: Set<number>;
  surahNames: string[];
};

export const INDEXED_ENTRIES: IndexedEntry[] = ENTRIES.map((e) => {
  const parts: string[] = [
    e.topic, e.detail, e.rule ?? '', e.sim ?? '', e.diff ?? '',
    e.surah ?? '', e.prophet ?? '', e.sec,
  ];
  for (const r of e.refs ?? []) parts.push(r.surah);
  const verseKeys = new Set<string>();
  for (const v of e.verses ?? []) {
    parts.push(v.t);
    verseKeys.add(`${v.s}|${v.a}`);
  }
  const surahNames: string[] = [];
  for (const r of e.refs ?? []) {
    if (!surahNames.includes(r.surah)) surahNames.push(r.surah);
  }
  return {
    ...e,
    searchText: normalizeArabic(parts.join(' ')),
    verseKeys,
    ayahSet: new Set(e.ayahs ?? []),
    surahNames,
  };
});

export function formatPage(page: number): string {
  return page ? fmtNum(page) : '—';
}
