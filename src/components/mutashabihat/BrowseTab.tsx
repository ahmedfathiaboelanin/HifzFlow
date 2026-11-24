// Browse + filter the mutashabihat dataset: section, surah, juz, prophet,
// rule-only, sort, free text, and paging.
import { useMemo, useState } from 'react';
import { Badge, Btn, Card, CardBody, Input, Select } from '../ui';
import { Icon } from '../icons';
import { cx, fmtNum } from '../../lib/utils';
import type { IndexedEntry } from '../../lib/mutashabihat';
import {
  FILTER_OPTIONS, INDEXED_ENTRIES, RULE_ENTRIES, SECTIONS, SECTION_COUNTS, normalizeArabic,
} from '../../lib/mutashabihat';
import { EntryCard } from './EntryCard';

const PER_PAGE = 12;

type SortId = 'src' | 'pos' | 'surah';

type FilterState = {
  q: string;
  sec: string;
  surah: string;
  juz: string;
  prophet: string;
  ruleOnly: boolean;
  sort: SortId;
};

const INITIAL: FilterState = {
  q: '', sec: '', surah: '', juz: '', prophet: '', ruleOnly: false, sort: 'src',
};

function matches(entry: IndexedEntry, f: FilterState, normalizedQuery: string): boolean {
  if (f.sec && entry.sec !== f.sec) return false;
  if (f.juz && entry.juz !== Number(f.juz)) return false;
  if (f.prophet && entry.prophet !== f.prophet) return false;
  if (f.ruleOnly && !entry.rule) return false;
  if (f.surah) {
    const hit = entry.surah === f.surah || entry.surahNames.includes(f.surah);
    if (!hit) return false;
  }
  if (normalizedQuery) {
    if (/^[0-9]+$/.test(normalizedQuery) && entry.ayahSet.has(Number(normalizedQuery))) {
      return true;
    }
    for (const token of normalizedQuery.split(' ')) {
      if (token && !entry.searchText.includes(token)) return false;
    }
  }
  return true;
}

export function BrowseTab() {
  const [filters, setFilters] = useState<FilterState>(INITIAL);
  const [page, setPage] = useState(1);

  const update = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const normalizedQuery = useMemo(() => normalizeArabic(filters.q), [filters.q]);

  const list = useMemo(() => {
    const out = INDEXED_ENTRIES.filter((e) => matches(e, filters, normalizedQuery));
    if (filters.sort === 'pos') out.sort((a, b) => (b.pos ?? 0) - (a.pos ?? 0));
    else if (filters.sort === 'surah') {
      out.sort((a, b) => String(a.surah ?? '').localeCompare(String(b.surah ?? ''), 'ar'));
    }
    return out;
  }, [filters, normalizedQuery]);

  const totalPages = Math.max(1, Math.ceil(list.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const pageItems = list.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  const reset = () => {
    setFilters(INITIAL);
    setPage(1);
  };

  return (
    <div>
      <Card>
        <CardBody className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            <div className="relative min-w-0 flex-1">
              <Icon
                name="search"
                size={16}
                className="pointer-events-none absolute inset-y-0 start-3 my-auto text-muted"
              />
              <Input
                type="search"
                value={filters.q}
                onChange={(e) => update('q', e.target.value)}
                placeholder="ابحث بكلمة من الآية، أو القاعدة، أو اسم سورة / نبي…"
                aria-label="بحث في المتشابهات"
                className="h-11 ps-9"
              />
            </div>
            <Btn variant="outline" onClick={reset} className="h-11">مسح الكل</Btn>
          </div>

          <div className="flex flex-wrap gap-1.5" role="group" aria-label="المصدر">
            <button
              type="button"
              aria-pressed={filters.sec === ''}
              onClick={() => update('sec', '')}
              className={cx(
                'rounded-full border px-3 py-1.5 text-[12px] font-semibold transition',
                filters.sec === ''
                  ? 'border-primary bg-primary text-white'
                  : 'border-line bg-surface text-muted hover:border-primary/40 hover:text-ink',
              )}
            >
              الكل ({fmtNum(INDEXED_ENTRIES.length)})
            </button>
            {SECTIONS.map((s) => (
              <button
                key={s.key}
                type="button"
                aria-pressed={filters.sec === s.key}
                onClick={() => update('sec', s.key)}
                className={cx(
                  'rounded-full border px-3 py-1.5 text-[12px] font-semibold transition',
                  filters.sec === s.key
                    ? 'border-primary bg-primary text-white'
                    : 'border-line bg-surface text-muted hover:border-primary/40 hover:text-ink',
                )}
              >
                {s.label} ({fmtNum(SECTION_COUNTS[s.key] ?? 0)})
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <label className="flex flex-col gap-1 text-[11px] font-semibold text-muted">
              السورة
              <Select value={filters.surah} onChange={(e) => update('surah', e.target.value)} className="h-9 text-[13px]">
                <option value="">كل السور</option>
                {FILTER_OPTIONS.surahs.map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
            </label>
            <label className="flex flex-col gap-1 text-[11px] font-semibold text-muted">
              الجزء
              <Select value={filters.juz} onChange={(e) => update('juz', e.target.value)} className="h-9 text-[13px]">
                <option value="">كل الأجزاء</option>
                {FILTER_OPTIONS.juzs.map((j) => <option key={j} value={j}>الجزء {fmtNum(j)}</option>)}
              </Select>
            </label>
            <label className="flex flex-col gap-1 text-[11px] font-semibold text-muted">
              قصة النبي
              <Select value={filters.prophet} onChange={(e) => update('prophet', e.target.value)} className="h-9 text-[13px]">
                <option value="">كل القصص</option>
                {FILTER_OPTIONS.prophets.map((p) => <option key={p} value={p}>{p}</option>)}
              </Select>
            </label>
            <label className="flex flex-col gap-1 text-[11px] font-semibold text-muted">
              الترتيب
              <Select value={filters.sort} onChange={(e) => update('sort', e.target.value as SortId)} className="h-9 text-[13px]">
                <option value="src">ترتيب المصدر</option>
                <option value="pos">عدد المواضع (الأكثر أولًا)</option>
                <option value="surah">حسب السورة الرئيسية</option>
              </Select>
            </label>
          </div>

          <label className="inline-flex w-fit items-center gap-2 text-[12px] font-semibold text-muted">
            <input
              type="checkbox"
              checked={filters.ruleOnly}
              onChange={(e) => update('ruleOnly', e.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            المدخلات التي لها ضابط فقط ({fmtNum(RULE_ENTRIES.length)} مدخلًا)
          </label>
        </CardBody>
      </Card>

      <div className="mb-2 mt-4 flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-bold">
          النتائج: <span className="text-primary">{fmtNum(list.length)}</span> مدخل
        </p>
        <p className="text-[11px] text-muted">
          الرقم المُسطَّر بنقاط في المراجع يعني أن نص آيته لم يُوثَّق بعد.
        </p>
      </div>

      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface px-4 py-12 text-center">
          <Icon name="search" size={26} className="mx-auto mb-2 text-muted" />
          <p className="font-bold">لا توجد نتائج مطابقة</p>
          <p className="mt-1 text-sm text-muted">جرّب كلمة أخرى أو امسح عوامل التصفية.</p>
          <Btn variant="outline" className="mt-4" onClick={reset}>مسح عوامل التصفية</Btn>
        </div>
      ) : (
        <>
          <div className="grid gap-3 lg:grid-cols-2">
            {pageItems.map((entry) => <EntryCard key={entry.id} entry={entry} />)}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] text-muted">
              صفحة {fmtNum(safePage)} من {fmtNum(totalPages)}
            </p>
            <div className="flex items-center gap-2">
              <Btn
                variant="outline"
                size="sm"
                disabled={safePage <= 1}
                onClick={() => setPage(safePage - 1)}
              >
                <Icon name="chevron-right" size={13} /> السابق
              </Btn>
              <Badge tone="soft">{fmtNum(safePage)} / {fmtNum(totalPages)}</Badge>
              <Btn
                variant="outline"
                size="sm"
                disabled={safePage >= totalPages}
                onClick={() => setPage(safePage + 1)}
              >
                التالي <Icon name="chevron-left" size={13} />
              </Btn>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
