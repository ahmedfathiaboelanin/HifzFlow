// Reader: mushaf-by-pages (default) + surah view + surah-by-pages + search.
// Verse text is the bundled Uthmani text; the mushaf-check reminder is shown.
import { useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/store';
import { mistakesSlice } from '../store/slices';
import { ayahJuz, ayahPage, memorizedStrength, pageAyahs, pageInfo, searchAyahs, surahName, surahPages, SURAHS } from '../lib/quran';
import { fmtNum, uid } from '../lib/utils';
import { useWakeLock, hapticTap, hapticSuccess } from '../lib/pwa';
import { Badge, Btn, Card, CardBody, EmptyState, IconButton, Input, PageHeader, Select, Tabs, Textarea } from '../components/ui';
import { Icon } from '../components/icons';

type Mode = 'mushaf' | 'surah' | 'surahPages' | 'search';

function AyahView({ surah, ayah, text, selected, onSelect }: {
  surah: number; ayah: number; text: string; selected: boolean; onSelect: () => void;
}) {
  const entries = useAppSelector((s) => s.progress.entries);
  const strength = memorizedStrength(entries, surah, ayah);
  return (
    <span
      onClick={onSelect}
      className={
        'quran-text cursor-pointer rounded px-1 text-[1.35rem] leading-[2.2] transition ' +
        (strength ? 'bg-primarysoft text-primary ' : '') +
        (selected ? 'ring-2 ring-accent ' : '')
      }
      title={strength ? `محفوظ — ${strength === 'weak' ? 'ضعيف' : strength === 'medium' ? 'متوسط' : strength === 'strong' ? 'قوي' : 'متقن جداً'}` : 'اضغط للتحديد'}
    >
      {text} <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-line align-middle font-sans text-[11px] font-bold text-muted">{fmtNum(ayah)}</span>
    </span>
  );
}

export function Reader() {
  const [mode, setMode] = useState<Mode>('mushaf');
  const [page, setPage] = useState(1);
  const [jumpVal, setJumpVal] = useState('1');
  const [surah, setSurah] = useState(2);
  const [surahPageIdx, setSurahPageIdx] = useState(0);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<{ surah: number; ayah: number } | null>(null);
  const [mistakeNote, setMistakeNote] = useState('');
  const [mistakeType, setMistakeType] = useState<'tajweed' | 'word' | 'order' | 'forgetting'>('word');
  const wakeLock = useWakeLock();

  const changePage = (p: number) => {
    const n = Math.min(604, Math.max(1, p));
    setPage(n);
    setJumpVal(String(n));
  };

  const pages = useMemo(() => surahPages(surah), [surah]);
  const currentSurahPage = pages[Math.min(surahPageIdx, Math.max(0, pages.length - 1))];
  const results = useMemo(() => (query.trim().length >= 2 ? searchAyahs(query) : []), [query]);
  const info = pageInfo(page);
  const ayahs = useMemo(() => pageAyahs(page), [page]);

  const jumpToPage = (p: number) => {
    changePage(p);
    setMode('mushaf');
  };

  return (
    <div>
      <PageHeader
        icon="book"
        title="المصحف"
        sub="النص العثماني كاملاً (١١٤ سورة / ٦٬٢٣٦ آية) محفوظ في التطبيق. راجع الآيات من المصحف نفسه للتأكد — النص هنا مرجع للمراجعة."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {wakeLock.supported && (
              <Btn
                size="sm"
                variant={wakeLock.active ? 'primary' : 'outline'}
                onClick={() => void wakeLock.toggle()}
                title="منع إغلاق الشاشة أثناء التلاوة"
              >
                <Icon name="eye" size={14} />
                {wakeLock.active ? 'الشاشة نشطة' : 'إبقاء الشاشة مضاءة'}
              </Btn>
            )}
            <Badge tone="soft">٦٠٤ صفحات</Badge>
          </div>
        }
      />

      <div className="mb-3 flex items-start gap-2 rounded-xl border border-line bg-surface/80 p-2.5 text-xs leading-relaxed text-muted">
        <Icon name="sparkles" size={15} className="mt-0.5 shrink-0 text-accent" />
        <span>اختر الصفحة أو السورة، والآيات المظللة بالأخضر محفوظة عندك. اضغط أي آية لتحديدها وحفظها كإشارة أو تسجيل خطأ فيها.</span>
      </div>

      <Tabs
        tabs={[
          { id: 'mushaf', label: 'المصحف بالصفحات' },
          { id: 'surah', label: 'السورة كاملة' },
          { id: 'surahPages', label: 'سورة بصفحاتها' },
          { id: 'search', label: 'بحث' },
        ]}
        value={mode}
        onChange={setMode}
      />

      {mode === 'mushaf' && (
        <Card className="mt-3">
          <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
            <Btn variant="outline" disabled={page <= 1} onClick={() => changePage(page - 1)}>
              <Icon name="chevron-right" size={14} /> السابقة
            </Btn>
            <span className="text-sm font-bold">صفحة {fmtNum(page)} من ٦٠٤ • الجزء {fmtNum(info.juz)}</span>
            <Btn variant="outline" disabled={page >= 604} onClick={() => changePage(page + 1)}>
              التالية <Icon name="chevron-left" size={14} />
            </Btn>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const n = parseInt(jumpVal, 10);
                if (!isNaN(n)) jumpToPage(n);
              }}
              className="ms-auto flex items-center gap-1.5 text-sm"
            >
              <span>انتقل لصفحة:</span>
              <Input
                type="number"
                min={1}
                max={604}
                value={jumpVal}
                onChange={(e) => setJumpVal(e.target.value)}
                className="!h-8 !w-16 text-center"
              />
              <Btn type="submit" size="sm" variant="outline">
                انتقال
              </Btn>
            </form>
          </div>
          <CardBody>
            <p className="mb-2 text-xs text-muted">
              تبدأ في هذه الصفحة: {info.ranges.map((r) => `${surahName(r.surah)} ${fmtNum(r.from)}–${fmtNum(r.to)}`).join(' • ')}
            </p>
            <div className="rounded-xl bg-surface2 p-3 text-center">
              {ayahs.map((a) => (
                <AyahView key={`${a.surah}-${a.ayah}`} surah={a.surah} ayah={a.ayah} text={a.text} selected={selected?.surah === a.surah && selected?.ayah === a.ayah} onSelect={() => setSelected({ surah: a.surah, ayah: a.ayah })} />
              ))}
            </div>
            <SelectedAyahPanel selected={selected} onClose={() => setSelected(null)} mistakeNote={mistakeNote} setMistakeNote={setMistakeNote} mistakeType={mistakeType} setMistakeType={setMistakeType} />
          </CardBody>
        </Card>
      )}

      {mode === 'surah' && (
        <Card className="mt-3">
          <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
            <Select value={surah} onChange={(e) => setSurah(Number(e.target.value))}>
              {SURAHS.map((s) => (<option key={s.number} value={s.number}>{fmtNum(s.number)} — {s.name} ({fmtNum(s.ayahs)} آية)</option>))}
            </Select>
            <Badge>{surahPages(surah).length > 0 ? `صفحات المصحف ${fmtNum(surahPages(surah)[0].page)}–${fmtNum(surahPages(surah)[surahPages(surah).length - 1].page)}` : ''}</Badge>
          </div>
          <CardBody>
            <div className="rounded-xl bg-surface2 p-3 text-center">
              <SurahFullText surah={surah} selected={selected} onSelect={setSelected} />
            </div>
            <SelectedAyahPanel selected={selected} onClose={() => setSelected(null)} mistakeNote={mistakeNote} setMistakeNote={setMistakeNote} mistakeType={mistakeType} setMistakeType={setMistakeType} />
          </CardBody>
        </Card>
      )}

      {mode === 'surahPages' && (
        <Card className="mt-3">
          <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
            <Select value={surah} onChange={(e) => { setSurah(Number(e.target.value)); setSurahPageIdx(0); }}>
              {SURAHS.map((s) => (<option key={s.number} value={s.number}>{fmtNum(s.number)} — {s.name}</option>))}
            </Select>
            <Btn variant="outline" disabled={surahPageIdx <= 0} onClick={() => setSurahPageIdx(surahPageIdx - 1)}>
              <Icon name="chevron-right" size={14} /> السابقة
            </Btn>
            <span className="text-sm font-bold">
              {pages.length > 0 && currentSurahPage
                ? `صفحة ${fmtNum(surahPageIdx + 1)} من ${fmtNum(pages.length)} في السورة • صفحة المصحف ${fmtNum(currentSurahPage.page)} • الجزء ${fmtNum(currentSurahPage.juz)}`
                : '—'}
            </span>
            <Btn variant="outline" disabled={surahPageIdx >= pages.length - 1} onClick={() => setSurahPageIdx(surahPageIdx + 1)}>
              التالية <Icon name="chevron-left" size={14} />
            </Btn>
          </div>
          <CardBody>
            {currentSurahPage && (
              <>
                <p className="mb-2 text-xs text-muted">الآيات {fmtNum(currentSurahPage.from)}–{fmtNum(currentSurahPage.to)} من {surahName(surah)}</p>
                <div className="rounded-xl bg-surface2 p-3 text-center">
                  {pageAyahs(currentSurahPage.page)
                    .filter((a) => a.surah === surah && a.ayah >= currentSurahPage.from && a.ayah <= currentSurahPage.to)
                    .map((a) => (
                      <AyahView key={`${a.surah}-${a.ayah}`} surah={a.surah} ayah={a.ayah} text={a.text} selected={selected?.surah === a.surah && selected?.ayah === a.ayah} onSelect={() => setSelected({ surah: a.surah, ayah: a.ayah })} />
                    ))}
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {pages.map((p, i) => (
                    <button key={p.page} onClick={() => setSurahPageIdx(i)} className={'rounded-lg border px-2 py-1 text-xs ' + (i === surahPageIdx ? 'border-primary bg-primary text-white' : 'border-line bg-surface')}>
                      {fmtNum(p.page)}
                    </button>
                  ))}
                </div>
              </>
            )}
            <SelectedAyahPanel selected={selected} onClose={() => setSelected(null)} mistakeNote={mistakeNote} setMistakeNote={setMistakeNote} mistakeType={mistakeType} setMistakeType={setMistakeType} />
          </CardBody>
        </Card>
      )}

      {mode === 'search' && (
        <Card className="mt-3">
          <CardBody>
            <Input placeholder="ابحث في نص القرآن (البحث يتجاهل التشكيل)… مثال: الحمد لله" value={query} onChange={(e) => setQuery(e.target.value)} />
            <p className="mt-1 text-xs text-muted">اكتب كلمتين على الأقل — البحث يشمل كل الآيات الـ ٦٬٢٣٦.</p>
            {query.trim().length >= 2 && (
              <div className="mt-3 flex flex-col gap-2">
                {results.length === 0 && <EmptyState title="لا نتائج" sub="جرّب كلمة أخرى أو تحقق من الإملاء (بدون تشكيل)." />}
                {results.map((r) => (
                  <button key={`${r.surah}-${r.ayah}`} onClick={() => jumpToPage(r.page)} className="rounded-xl border border-line bg-surface2 p-3 text-start hover:border-primary">
                    <p className="text-xs font-bold text-primary">{surahName(r.surah)} — آية {fmtNum(r.ayah)} • صفحة {fmtNum(r.page)} • جزء {fmtNum(r.juz)}</p>
                    <p className="quran-text mt-1 text-lg">{r.text}</p>
                  </button>
                ))}
                {results.length >= 100 && <p className="text-xs text-muted">أول ١٠٠ نتيجة فقط — ضيّق البحث أكثر.</p>}
              </div>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
}

function SurahFullText({ surah, selected, onSelect }: {
  surah: number;
  selected: { surah: number; ayah: number } | null;
  onSelect: (s: { surah: number; ayah: number }) => void;
}) {
  const pages = useMemo(() => surahPages(surah), [surah]);
  return (
    <>
      {pages.map((p) => (
        <span key={p.page}>
          {pageAyahs(p.page)
            .filter((a) => a.surah === surah && a.ayah >= p.from && a.ayah <= p.to)
            .map((a) => (
              <AyahView key={`${a.surah}-${a.ayah}`} surah={a.surah} ayah={a.ayah} text={a.text} selected={selected?.surah === a.surah && selected?.ayah === a.ayah} onSelect={() => onSelect({ surah: a.surah, ayah: a.ayah })} />
            ))}
        </span>
      ))}
    </>
  );
}

function SelectedAyahPanel({ selected, onClose, mistakeNote, setMistakeNote, mistakeType, setMistakeType }: {
  selected: { surah: number; ayah: number } | null;
  onClose: () => void;
  mistakeNote: string;
  setMistakeNote: (s: string) => void;
  mistakeType: 'tajweed' | 'word' | 'order' | 'forgetting';
  setMistakeType: (t: 'tajweed' | 'word' | 'order' | 'forgetting') => void;
}) {
  const dispatch = useAppDispatch();
  const bookmarks = useAppSelector((s) => s.mistakes.bookmarks);
  const [feedback, setFeedback] = useState('');
  if (!selected) return null;
  const isBookmarked = bookmarks.some((b) => b.surah === selected.surah && b.ayah === selected.ayah);

  return (
    <div className="mt-3 rounded-xl border border-primary/35 bg-primarysoft/50 p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="flex items-center gap-1.5 text-sm font-bold">
          <Icon name="bookmark" size={14} className="text-primary" />
          {surahName(selected.surah)} — آية {fmtNum(selected.ayah)}
          <span className="text-xs font-normal text-muted">صفحة {fmtNum(ayahPage(selected.surah, selected.ayah))} • الجزء {fmtNum(ayahJuz(selected.surah, selected.ayah))}</span>
        </p>
        <IconButton label="إغلاق" name="x" size={14} onClick={onClose} />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Btn
          size="sm"
          variant={isBookmarked ? 'soft' : 'outline'}
          onClick={() => {
            hapticTap();
            if (isBookmarked) {
              const b = bookmarks.find((x) => x.surah === selected.surah && x.ayah === selected.ayah);
              if (b) dispatch(mistakesSlice.actions.removeBookmark(b.id));
              setFeedback('تمت إزالة الإشارة المرجعية.');
            } else {
              dispatch(mistakesSlice.actions.addBookmark({ id: uid(), surah: selected.surah, ayah: selected.ayah, note: '', createdAt: new Date().toISOString() }));
              setFeedback('تم حفظ الآية كإشارة مرجعية.');
            }
          }}
        >
          {isBookmarked ? '★ محفوظة كإشارة' : '☆ حفظ كإشارة'}
        </Btn>
        <Select value={mistakeType} onChange={(e) => setMistakeType(e.target.value as typeof mistakeType)}>
          <option value="word">خطأ: كلمة</option>
          <option value="tajweed">خطأ: تجويد</option>
          <option value="order">خطأ: ترتيب</option>
          <option value="forgetting">خطأ: نسيان</option>
        </Select>
        <Textarea rows={1} placeholder="ملاحظة عن الخطأ (اختياري)…" value={mistakeNote} onChange={(e) => setMistakeNote(e.target.value)} className="min-w-[12rem] flex-1" />
        <Btn
          variant="outline"
          onClick={() => {
            hapticSuccess();
            dispatch(mistakesSlice.actions.addMistake({
              id: uid(), surah: selected.surah, ayah: selected.ayah, type: mistakeType,
              note: mistakeNote, count: 1, lastSeen: new Date().toISOString(), resolved: false,
            }));
            setMistakeNote('');
            setFeedback('تم تسجيل الخطأ بنجاح — يمكنك مراجعته من صفحة الأخطاء.');
          }}
        >
          تسجيل الخطأ
        </Btn>
      </div>
      {feedback && (
        <p className="mt-2 text-xs font-semibold text-primary">{feedback}</p>
      )}
    </div>
  );
}
