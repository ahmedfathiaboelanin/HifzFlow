// Revision: today's spaced repetition + fixation (khatmas) + rotating wird
// + daily wird splitter + history. Subpages with sticky tabs.
import { useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/store';
import { insertFixationPlan, rateProgress } from '../store/store';
import { prefsSlice, tasksSlice, wirdSlice } from '../store/slices';
import { INTERVALS, buildKhatma, buildWirdTable, rateEntry, revisionPriority, splitWirdByMinutes } from '../lib/fixation';
import type { KhatmaPlan } from '../lib/fixation';
import { surahName } from '../lib/quran';
import { addDaysStr, fmtDateAr, fmtMinutes, fmtNum, todayStr } from '../lib/utils';
import { hapticSuccess, hapticTap } from '../lib/pwa';
import type { ProgressEntry, Rating } from '../lib/types';
import { STRENGTH_LABEL } from '../lib/types';
import { Badge, Btn, Card, CardBody, CardHead, EmptyState, PageHeader, Pagination, ProgressBar, Select, Tabs, usePagination } from '../components/ui';

type Tab = 'today' | 'fixation' | 'wird' | 'splitter' | 'history';

const RATING_LABEL: Record<Rating, string> = { again: 'أعد', good: 'جيد', easy: 'سهل' };

export function Revision() {
  const [tab, setTab] = useState<Tab>('today');
  return (
    <div>
      <PageHeader
        icon="repeat"
        title="المراجعة"
        sub="التكرار المتباعد للأضعف أولاً، والتثبيت بختمات، وورد المراجعة الدوري."
      />
      <Tabs
        tabs={[
          { id: 'today', label: 'مراجعة اليوم' },
          { id: 'fixation', label: 'التثبيت' },
          { id: 'wird', label: 'جدول الورد' },
          { id: 'splitter', label: 'تقسيم الورد' },
          { id: 'history', label: 'السجل' },
        ]}
        value={tab}
        onChange={setTab}
      />
      {tab === 'today' && <TodayTab />}
      {tab === 'fixation' && <FixationTab />}
      {tab === 'wird' && <WirdTab />}
      {tab === 'splitter' && <SplitterTab />}
      {tab === 'history' && <HistoryTab />}
    </div>
  );
}

// Hoisted to module level to prevent remounting and allow React Compiler optimizations
function RoundSection({
  title,
  sub,
  items,
  onRate,
}: {
  title: string;
  sub: string;
  items: Array<{ e: ProgressEntry; score: number }>;
  onRate: (e: ProgressEntry, rating: Rating) => void;
}) {
  return (
    <Card className="mt-3">
      <CardHead title={title} sub={sub} />
      <CardBody>
        {items.length === 0 ? (
          <p className="text-sm text-muted">لا شيء في هذه الجولة.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {items.map(({ e }) => {
              const remainingStages = Math.max(0, INTERVALS.weak.length - (e.srStage + 1));
              return (
                <li key={e.id} className="flex flex-wrap items-center gap-2 rounded-xl bg-surface2 px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">{surahName(e.surah)} {fmtNum(e.fromAyah)}–{fmtNum(e.toAyah)}</p>
                    <p className="text-xs text-muted">
                      {STRENGTH_LABEL[e.strength]} • المرحلة {fmtNum(e.srStage + 1)} من {fmtNum(INTERVALS[e.strength].length)} • مستحقة {fmtDateAr(e.srDue)}
                      {e.strength === 'weak' && (
                        remainingStages === 0
                          ? ' • المرحلة الأخيرة للتثبيت'
                          : ` • باقي ${fmtNum(remainingStages)} مراحل للتثبيت`
                      )}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Btn size="sm" variant="danger" onClick={() => onRate(e, 'again')}>أعد</Btn>
                    <Btn size="sm" variant="outline" onClick={() => onRate(e, 'good')}>جيد</Btn>
                    <Btn size="sm" variant="soft" onClick={() => onRate(e, 'easy')}>سهل</Btn>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}

// ---- Today's revision ---------------------------------------------------------
function TodayTab() {
  const entries = useAppSelector((s) => s.progress.entries);
  const mistakes = useAppSelector((s) => s.mistakes.items);
  const prefs = useAppSelector((s) => s.prefs);
  const [notice, setNotice] = useState('');
  const today = todayStr();

  const rounds = useMemo(() => {
    const openMistakes = (surah: number) => mistakes.filter((m) => m.surah === surah && !m.resolved).length;
    const scored = entries
      .filter((e) => e.srDue && e.srDue <= addDaysStr(today, 2))
      .map((e) => ({ e, score: revisionPriority(e, openMistakes(e.surah), today) }))
      .sort((a, b) => b.score - a.score);
    return {
      r1: scored.filter((x) => x.e.srDue! < today),
      r2: scored.filter((x) => x.e.srDue === today),
      r3: scored.filter((x) => x.e.srDue! > today),
    };
  }, [entries, mistakes, today]);

  const rate = (e: ProgressEntry, rating: Rating) => {
    const preview = rateEntry(e, rating, prefs.fixationReviewCycle);
    rateProgress(e.id, rating);
    if (preview.stabilized) {
      hapticSuccess();
      setNotice(`🎉 ثبتت سورة ${surahName(e.surah)}! أكملت دورة التكرار المتباعد (٦ مراحل) فأصبحت متوسطة — مراجعتها القادمة بعد ${fmtNum(prefs.fixationReviewCycle)} يوم.`);
    } else if (preview.cycleCompleted) {
      hapticSuccess();
      setNotice(`✅ أكملت سورة ${surahName(e.surah)} دورة مراجعة كاملة — تبدأ دورة جديدة.`);
    } else if (rating === 'again') {
      hapticTap();
      setNotice(`سورة ${surahName(e.surah)} عادت ضعيفة وبدأت دورتها من الأول — لا بأس، التثبيت يأتي بالتكرار.`);
    } else {
      hapticTap();
      setNotice('');
    }
  };

  return (
    <div>
      {notice && (
        <div className="mt-3 rounded-xl border border-primary/40 bg-primarysoft/70 p-3 text-sm font-semibold">{notice}</div>
      )}
      <RoundSection title="الجولة الأولى — المتأخر" sub="مستحق قبل اليوم، الأضعف أولاً" items={rounds.r1} onRate={rate} />
      <RoundSection title="الجولة الثانية — مستحق اليوم" sub="مراجعة اليوم" items={rounds.r2} onRate={rate} />
      <RoundSection title="الجولة الثالثة — القادم" sub="مستحق خلال اليومين القادمين" items={rounds.r3} onRate={rate} />
      {entries.length === 0 && (
        <Card className="mt-3"><EmptyState title="لا يوجد محفوظ بعد" sub="أضف محفوظك من صفحة الحفظ لتظهر مراجعاتك هنا." /></Card>
      )}
    </div>
  );
}

// Separate fixation table for one level (weak alone / medium alone), hoisted to
// module level so its pagination state survives parent re-renders.
function LevelTable({ level, title, sub, plan, today }: {
  level: 'weak' | 'medium'; title: string; sub: string;
  plan: KhatmaPlan; today: string;
}) {
  const tasks = useAppSelector((s) => s.tasks.daily);
  const dispatch = useAppDispatch();
  const chunks = plan.levelChunks[level];
  const [p, setP] = useState(1);
  const shown = chunks.slice((p - 1) * 7, p * 7);
  const pages = Math.max(1, Math.ceil(chunks.length / 7));

  const chunkDone = (chunkId: string, firstDay: number) => {
    const t = tasks.find((x) => x.id === `${chunkId}-d${firstDay}`);
    return t?.done ?? false;
  };
  const toggleChunk = (chunkId: string, firstDay: number, date: string, title: string, surah: number) => {
    const id = `${chunkId}-d${firstDay}`;
    const t = tasks.find((x) => x.id === id);
    if (t) dispatch(tasksSlice.actions.toggleDaily(id));
    else {
      dispatch(tasksSlice.actions.addDaily({
        id, date, title, done: true, priority: 2, linkedSurah: surah, kind: 'fixation', refId: chunkId,
      }));
    }
  };

  return (
    <Card>
      <CardHead title={title} sub={sub} />
      {chunks.length === 0 ? (
        <EmptyState title="لا يوجد محفوظ بهذا المستوى" sub="أضف سوراً بهذا المستوى من صفحة الحفظ." />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr className="border-b border-line text-start text-xs text-muted">
                  <th className="px-3 py-2 text-start">اليوم</th>
                  <th className="px-3 py-2 text-start">النطاق</th>
                  <th className="px-3 py-2 text-start">الصفحات</th>
                  <th className="px-3 py-2 text-start">تم</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((c) => {
                  const date = plan.days[c.firstDay - 1]?.date ?? today;
                  const done = chunkDone(c.id, c.firstDay);
                  const label = c.ranges.map((r) => `${surahName(r.surah)} ${fmtNum(r.from)}–${fmtNum(r.to)}`).join(' + ');
                  return (
                    <tr key={c.id} className="border-b border-line last:border-0">
                      <td className="px-3 py-2">{fmtNum(c.firstDay)} • {fmtDateAr(date)}</td>
                      <td className="px-3 py-2">{label}</td>
                      <td className="px-3 py-2">{fmtNum(c.pageCount)} صفحات (ص {fmtNum(c.pages[0])}–{fmtNum(c.pages[c.pages.length - 1])})</td>
                      <td className="px-3 py-2">
                        <input
                          type="checkbox" checked={done} aria-label={`تم ${label}`}
                          onChange={() => toggleChunk(c.id, c.firstDay, date, `تثبيت: ${label} — ${level === 'weak' ? 'ضعيف' : 'متوسط'} (${c.pageCount} صفحات)`, c.surah)}
                          className="h-4 w-4 accent-[rgb(var(--c-primary))]"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {pages > 1 && (
            <div className="flex items-center justify-between px-4 py-2 text-xs text-muted">
              <span>صفحة {fmtNum(p)} من {fmtNum(pages)}</span>
              <div className="flex gap-1">
                <button disabled={p <= 1} onClick={() => setP(p - 1)} className="rounded-lg border border-line px-2 py-1 disabled:opacity-40">‹</button>
                <button disabled={p >= pages} onClick={() => setP(p + 1)} className="rounded-lg border border-line px-2 py-1 disabled:opacity-40">›</button>
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  );
}

// ---- Fixation ------------------------------------------------------------------
function FixationTab() {
  const entries = useAppSelector((s) => s.progress.entries);
  const prefs = useAppSelector((s) => s.prefs);
  const dispatch = useAppDispatch();
  const [insertedMsg, setInsertedMsg] = useState('');
  const [perPage, setPerPage] = useState(7);
  const today = todayStr();

  const plan = useMemo(() => buildKhatma(entries, prefs.rates, today), [entries, prefs.rates, today]);
  const weakEntries = useMemo(() => entries.filter((e) => e.strength === 'weak').sort((a, b) => a.surah - b.surah), [entries]);
  const stabilized = useMemo(() => entries.filter((e) => e.stabilizedAt), [entries]);
  const { page, setPage, totalPages, pageItems, total } = usePagination(plan.days, perPage);

  const onInsert = () => {
    const n = insertFixationPlan();
    setInsertedMsg(n > 0 ? `تم إدراج ${fmtNum(n)} جلسة تثبيت في المهام بتواريخها.` : 'الخطة مُدرجة بالفعل في المهام.');
  };

  return (
    <div className="mt-3 flex flex-col gap-3">
      {/* Banner: 15-day khatm target */}
      <div className="rounded-2xl bg-gradient-to-l from-hero1 via-hero2 to-hero3 p-4 text-white shadow-soft">
        <p className="text-lg font-bold">🎯 هدفك الأول: ختمة كل {fmtNum(plan.targetDays)} يوم</p>
        <p className="mt-1 text-sm opacity-90">
          {fmtNum(prefs.rates.weak)} صفحات ضعيف + {fmtNum(prefs.rates.medium)} متوسط + جزء قوي ({fmtNum(prefs.rates.strong)} صفحة) = {fmtNum(prefs.rates.weak + prefs.rates.medium + prefs.rates.strong)} صفحة/يوم (جزآن) — محفوظك {fmtNum(plan.totalPages)} صفحة
        </p>
        <p className="mt-1 text-xs opacity-80">الختمة الحالية في الجدول: {fmtNum(plan.days.length)} يوم • {fmtNum(plan.totalChunks)} مقطعاً</p>
      </div>

      <Card>
        <CardHead title="إعدادات التثبيت" sub="تتحدث الأرقام والجدول فوراً عند التغيير" />
        <CardBody>
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-sm">ضعيف / يوم
              <Select className="mt-1 block" value={prefs.rates.weak} onChange={(e) => dispatch(prefsSlice.actions.setRates({ weak: Number(e.target.value) }))}>
                {[5, 6, 7].map((n) => (<option key={n} value={n}>{fmtNum(n)} صفحات</option>))}
              </Select>
            </label>
            <label className="text-sm">متوسط / يوم
              <Select className="mt-1 block" value={prefs.rates.medium} onChange={(e) => dispatch(prefsSlice.actions.setRates({ medium: Number(e.target.value) }))}>
                {[10, 12, 15].map((n) => (<option key={n} value={n}>{fmtNum(n)} صفحة</option>))}
              </Select>
            </label>
            <label className="text-sm">قوي / يوم
              <Select className="mt-1 block" value={prefs.rates.strong} onChange={(e) => dispatch(prefsSlice.actions.setRates({ strong: Number(e.target.value) }))}>
                {[20, 22, 25].map((n) => (<option key={n} value={n}>{fmtNum(n)} صفحة</option>))}
              </Select>
            </label>
            <label className="text-sm">مراجعة ما بعد التثبيت
              <Select className="mt-1 block" value={prefs.fixationReviewCycle} onChange={(e) => dispatch(prefsSlice.actions.setPrefs({ fixationReviewCycle: Number(e.target.value) as 15 | 10 }))}>
                <option value={15}>كل ١٥ يوم</option>
                <option value={10}>كل ١٠ أيام</option>
              </Select>
            </label>
          </div>
          <div className="mt-3 rounded-xl bg-amber-50 p-3 text-sm leading-relaxed dark:bg-amber-900/20">
            <b>⚠️ القاعدة المهمة:</b> لا ترقية تلقائية بعد الختمة — لا مستوى يصعد لمجرد أن الختمة انتهت.
            الضعيف يصبح متوسطاً <b>فقط</b> عندما يكمل دورة التكرار المتباعد كاملة (٦ مراحل: ١، ٢، ٣، ٥، ٧، ١٠ أيام) بتقييم جيد/سهل في المرحلة الأخيرة.
            «سهل» مرتين متتاليتين لا يكفي للضعيف، و«أعد» يعيد الدورة من الأول. والمتوسط يُغطى كل يوم بالتوازي (١٥ صفحة/يوم) فلا يُنسى.
          </div>
        </CardBody>
      </Card>

      {/* Fixation status: weak cycle stage x/6 + stabilized */}
      <Card>
        <CardHead title="حالة تثبيت الضعيف" sub="كل سورة ضعيفة في أي مرحلة من ٦؟ ومتى مراجعتها القادمة؟" />
        <CardBody>
          {weakEntries.length === 0 && <p className="text-sm text-muted">لا سور ضعيفة حالياً — ممتاز! 🎉</p>}
          <ul className="flex flex-col gap-2">
            {weakEntries.map((e) => (
              <li key={e.id} className="rounded-xl bg-surface2 px-3 py-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="font-bold">{surahName(e.surah)} {fmtNum(e.fromAyah)}–{fmtNum(e.toAyah)}</span>
                  <span className="text-xs text-muted">المرحلة {fmtNum(e.srStage + 1)} من ٦ • القادمة {fmtDateAr(e.srDue)}</span>
                </div>
                <div className="mt-1.5"><ProgressBar value={e.srStage + 1} max={6} /></div>
                <p className="mt-1 text-xs text-muted">
                  {e.srStage + 1 >= 6
                    ? 'المرحلة الأخيرة للتثبيت — تقييم جيد/سهل القادم ينقلها للمتوسط بإذن الله.'
                    : `باقي ${fmtNum(6 - (e.srStage + 1))} مراحل لإكمال الدورة والتثبيت — قيّم من «مراجعة اليوم».`}
                </p>
              </li>
            ))}
          </ul>
          {stabilized.length > 0 && (
            <div className="mt-3">
              <p className="text-sm font-bold">✅ ثبتت ودخلت المتوسط:</p>
              <ul className="mt-1 list-inside list-disc text-sm text-muted">
                {stabilized.map((e) => (
                  <li key={e.id}>{surahName(e.surah)} {fmtNum(e.fromAyah)}–{fmtNum(e.toAyah)} — ثبتت {fmtDateAr(e.stabilizedAt)} • تُراجع مع المتوسط كل {fmtNum(prefs.fixationReviewCycle)} يوم</li>
                ))}
              </ul>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Khatma plan preview */}
      <Card>
        <CardHead
          title="خطة الختمة الحالية"
          sub="كل يوم يخلط المستويات الثلاثة بالتوازي — الختمة تغطي كل محفوظك مرة واحدة"
          action={<Btn onClick={onInsert}>إدراج الخطة في المهام</Btn>}
        />
        {insertedMsg && <p className="px-4 pt-2 text-sm font-semibold text-primary">{insertedMsg}</p>}
        {plan.days.length === 0 ? (
          <EmptyState title="لا يوجد محفوظ بعد" sub="أضف محفوظك من صفحة الحفظ لتبنى خطة الختمة." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr className="border-b border-line text-start text-xs text-muted">
                    <th className="px-3 py-2 text-start">اليوم</th>
                    <th className="px-3 py-2 text-start">التاريخ</th>
                    <th className="px-3 py-2 text-start">الجلسات</th>
                    <th className="px-3 py-2 text-start">الصفحات</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((d) => (
                    <tr key={d.day} className="border-b border-line last:border-0">
                      <td className="px-3 py-2 font-bold">يوم {fmtNum(d.day)}</td>
                      <td className="px-3 py-2">{fmtDateAr(d.date)}</td>
                      <td className="px-3 py-2">
                        {d.chunks.map((c) => (
                          <div key={c.id} className="text-xs">
                            <Badge tone={c.level === 'weak' ? 'warn' : c.level === 'medium' ? 'soft' : 'ok'}>
                              {c.level === 'weak' ? 'ضعيف' : c.level === 'medium' ? 'متوسط' : 'قوي'}
                            </Badge>{' '}
                            {c.ranges.map((r) => `${surahName(r.surah)} ${fmtNum(r.from)}–${fmtNum(r.to)}`).join(' + ')} ({fmtNum(c.pageCount)} ص)
                          </div>
                        ))}
                      </td>
                      <td className="px-3 py-2">{fmtNum(d.totalPages)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={totalPages} total={total} perPage={perPage} onChange={setPage} perPageOptions={[7, 14]} onPerPage={(n) => { setPerPage(n); setPage(1); }} />
          </>
        )}
      </Card>

      {/* Separate fixation wird: weak alone + medium alone */}
      <div>
        <h2 className="mb-2 text-lg font-bold">ورد التثبيت المنفصل</h2>
        <p className="mb-2 text-sm text-muted">جدول الضعيف لوحده وجدول المتوسط لوحده — واحد واحد، بأزرار «تم» شغالة (تُدرج الجلسة في المهام عند أول ضغطة إن لم تكن مدرجة).</p>
        <div className="flex flex-col gap-3">
          <LevelTable level="weak" plan={plan} today={today} title="جدول الضعيف لوحده" sub={`${fmtNum(plan.levelChunks.weak.length)} مقطعاً — ${fmtNum(prefs.rates.weak)} صفحات/يوم`} />
          <LevelTable level="medium" plan={plan} today={today} title="جدول المتوسط لوحده" sub={`${fmtNum(plan.levelChunks.medium.length)} مقطعاً — ${fmtNum(prefs.rates.medium)} صفحة/يوم`} />
        </div>
      </div>
    </div>
  );
}

// ---- Rotating wird table -------------------------------------------------------
function WirdTab() {
  const entries = useAppSelector((s) => s.progress.entries);
  const prefs = useAppSelector((s) => s.prefs);
  const completions = useAppSelector((s) => s.wird.items);
  const dispatch = useAppDispatch();
  const [perPage, setPerPage] = useState(7);
  const today = todayStr();
  const start = prefs.wirdCycleStart ?? today;

  const days = useMemo(
    () => buildWirdTable(entries, prefs.wirdCycleDays, start),
    [entries, prefs.wirdCycleDays, start],
  );
  const doneCount = completions.filter((c) => c.cycleStart === start).length;
  const { page, setPage, totalPages, pageItems, total } = usePagination(days, perPage);
  const allDone = days.length > 0 && doneCount >= days.length;

  return (
    <div className="mt-3 flex flex-col gap-3">
      <Card>
        <CardHead
          title="جدول المراجعة الدوري (الورد)"
          sub="من محفوظك الفعلي بترتيب المصحف — علّم كل يوم بعد إتمامه"
          action={
            <Select value={prefs.wirdCycleDays} onChange={(e) => dispatch(prefsSlice.actions.setPrefs({ wirdCycleDays: Number(e.target.value) }))}>
              {[7, 10, 15, 30].map((n) => (<option key={n} value={n}>دورة {fmtNum(n)} أيام</option>))}
            </Select>
          }
        />
        <CardBody>
          {entries.length === 0 ? (
            <EmptyState title="لا يوجد محفوظ بعد" sub="أضف محفوظك من صفحة الحفظ ليُبنى جدول الورد." />
          ) : (
            <>
              <div className="mb-2 flex flex-wrap items-center gap-3">
                <p className="text-sm">الدورة تبدأ {fmtDateAr(start)} • أتممت {fmtNum(doneCount)} من {fmtNum(days.length)} يوماً</p>
                {prefs.wirdCycleStart === null && (
                  <Btn variant="soft" onClick={() => dispatch(prefsSlice.actions.setPrefs({ wirdCycleStart: today }))}>بدء الدورة اليوم</Btn>
                )}
                {allDone && (
                  <Btn onClick={() => dispatch(prefsSlice.actions.setPrefs({ wirdCycleStart: addDaysStr(start, prefs.wirdCycleDays) }))}>
                    بدء الدورة التالية ✓
                  </Btn>
                )}
              </div>
              <ProgressBar value={doneCount} max={Math.max(1, days.length)} />
              <div className="mt-3 overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr className="border-b border-line text-start text-xs text-muted">
                      <th className="px-3 py-2 text-start">اليوم</th>
                      <th className="px-3 py-2 text-start">التاريخ</th>
                      <th className="px-3 py-2 text-start">النطاق</th>
                      <th className="px-3 py-2 text-start">الآيات</th>
                      <th className="px-3 py-2 text-start">الصفحات</th>
                      <th className="px-3 py-2 text-start">تم</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.map((d) => {
                      const done = completions.some((c) => c.cycleStart === start && c.day === d.day);
                      const isToday = d.date === today;
                      return (
                        <tr key={d.day} className={isToday ? 'bg-primarysoft/50' : 'border-b border-line last:border-0'}>
                          <td className="px-3 py-2 font-bold">يوم {fmtNum(d.day)}{isToday ? ' (اليوم)' : ''}</td>
                          <td className="px-3 py-2">{fmtDateAr(d.date)}</td>
                          <td className="px-3 py-2">{surahName(d.fromSurah)} {fmtNum(d.fromAyah)} ← {surahName(d.toSurah)} {fmtNum(d.toAyah)}</td>
                          <td className="px-3 py-2">{fmtNum(d.ayahs)}</td>
                          <td className="px-3 py-2">{fmtNum(d.pages)}</td>
                          <td className="px-3 py-2">
                            <input
                              type="checkbox" checked={done} aria-label={`تم يوم ${d.day}`}
                              onChange={() => dispatch(wirdSlice.actions.toggleWirdDay({ cycleStart: start, day: d.day }))}
                              className="h-4 w-4 accent-[rgb(var(--c-primary))]"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <Pagination page={page} totalPages={totalPages} total={total} perPage={perPage} onChange={setPage} perPageOptions={[7, 14]} onPerPage={(n) => { setPerPage(n); setPage(1); }} />
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

// ---- Wird splitter ---------------------------------------------------------------
function SplitterTab() {
  const prefs = useAppSelector((s) => s.prefs);
  const entries = useAppSelector((s) => s.progress.entries);
  const dispatch = useAppDispatch();
  const today = todayStr();
  const start = prefs.wirdCycleStart ?? today;
  const todayPages = useMemo(() => {
    const wird = buildWirdTable(entries, prefs.wirdCycleDays, start);
    const dayIdx = Math.floor((new Date(today).getTime() - new Date(start).getTime()) / 86400000);
    return wird.length ? wird[Math.min(Math.max(dayIdx, 0), wird.length - 1)].pages : 0;
  }, [entries, prefs.wirdCycleDays, start, today]);
  const split = splitWirdByMinutes(prefs.dailyMinutes, todayPages);

  return (
    <div className="mt-3 flex flex-col gap-3">
      <Card>
        <CardHead title="تقسيم الورد اليومي بالدقائق" sub="٥٠٪ مراجعة دورية / ٣٠٪ مراجعة الحفظ الحديث / ٢٠٪ حفظ جديد وربط — الصفحة ≈ ٣ دقائق" />
        <CardBody>
          <div className="flex flex-wrap gap-1">
            {[30, 45, 60, 90, 120].map((m) => (
              <Btn
                key={m}
                variant={prefs.dailyMinutes === m ? 'primary' : 'outline'}
                onClick={() => dispatch(prefsSlice.actions.setPrefs({ dailyMinutes: m }))}
              >
                {fmtNum(m)} دقيقة
              </Btn>
            ))}
            <span className="ms-2 flex items-center gap-1 text-sm">
              أو اكتب:
              <input
                type="number" min={10} max={300} value={prefs.dailyMinutes}
                onChange={(e) => dispatch(prefsSlice.actions.setPrefs({ dailyMinutes: Number(e.target.value) || 60 }))}
                className="w-20 rounded-xl border border-line bg-surface px-2 py-1.5 text-sm"
              /> دقيقة
            </span>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-surface2 p-3">
              <p className="text-lg font-bold">{fmtMinutes(split.rotatingMin)}</p>
              <p className="text-xs text-muted">مراجعة دورية (~{fmtNum(split.rotatingPages)} صفحة)</p>
            </div>
            <div className="rounded-xl bg-surface2 p-3">
              <p className="text-lg font-bold">{fmtMinutes(split.recentMin)}</p>
              <p className="text-xs text-muted">مراجعة حديثة (~{fmtNum(split.recentPages)} صفحة)</p>
            </div>
            <div className="rounded-xl bg-surface2 p-3">
              <p className="text-lg font-bold">{fmtMinutes(split.newMin)}</p>
              <p className="text-xs text-muted">حفظ جديد وربط (~{fmtNum(split.newPages)} صفحة)</p>
            </div>
          </div>
          {split.overTime && (
            <p className="mt-3 rounded-xl bg-amber-100 p-3 text-sm font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
              ⚠️ تنبيه: ورد المراجعة الدورية اليوم ({fmtNum(todayPages)} صفحة) يحتاج نحو {fmtMinutes(split.rotatingNeededMin)}،
              لكن حصته من وردك {fmtMinutes(split.rotatingMin)} فقط. زوّد مدة الورد اليومي أو قصّر دورة الورد.
            </p>
          )}
          {!split.overTime && (
            <p className="mt-3 text-sm text-muted">ورد اليوم الدوري ({fmtNum(todayPages)} صفحة) يتسع في حصته ({fmtMinutes(split.rotatingMin)}) إن شاء الله.</p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

// ---- History -----------------------------------------------------------------------
function HistoryTab() {
  const history = useAppSelector((s) => s.revision.history);
  const [perPage, setPerPage] = useState(8);
  const { page, setPage, totalPages, pageItems, total } = usePagination(history, perPage);
  return (
    <Card className="mt-3">
      <CardHead title="سجل المراجعات" sub="كل تقييم سجلته — الأحدث أولاً" />
      {pageItems.length === 0 ? (
        <EmptyState title="لا مراجعات مسجلة بعد" sub="قيّم مراجعة من «مراجعة اليوم» وستظهر هنا." />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr className="border-b border-line text-start text-xs text-muted">
                  <th className="px-3 py-2 text-start">التاريخ</th>
                  <th className="px-3 py-2 text-start">السورة</th>
                  <th className="px-3 py-2 text-start">التقييم</th>
                  <th className="px-3 py-2 text-start">أخطاء</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((h) => (
                  <tr key={h.id} className="border-b border-line last:border-0">
                    <td className="px-3 py-2">{new Date(h.reviewedAt).toLocaleString('ar-EG')}</td>
                    <td className="px-3 py-2">{surahName(h.surah)} {fmtNum(h.fromAyah)}–{fmtNum(h.toAyah)}</td>
                    <td className="px-3 py-2">
                      <Badge tone={h.rating === 'again' ? 'danger' : h.rating === 'easy' ? 'ok' : 'soft'}>{RATING_LABEL[h.rating]}</Badge>
                    </td>
                    <td className="px-3 py-2">{fmtNum(h.mistakesCount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} total={total} perPage={perPage} onChange={setPage} perPageOptions={[8, 16]} onPerPage={(n) => { setPerPage(n); setPage(1); }} />
        </>
      )}
    </Card>
  );
}
