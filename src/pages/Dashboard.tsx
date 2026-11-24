// Dashboard: overview + daily follow-up (subpages with sticky tabs).
import { useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/store';
import { clearSampleData, generateRecurringToday, insertFixationPlan } from '../store/store';
import { tasksSlice } from '../store/slices';
import { buildKhatma, buildWirdTable, splitWirdByMinutes } from '../lib/fixation';
import { fmtDateAr, fmtMinutes, fmtNum, todayStr } from '../lib/utils';
import { surahName, totalMemorizedAyahs, entryPages } from '../lib/quran';
import { Badge, Btn, Card, CardBody, CardHead, EmptyState, ProgressRing, Stat, Tabs, PageHeader } from '../components/ui';
import { Icon } from '../components/icons';
import type { IconName } from '../components/icons';
import { InstallCard } from '../components/Pwa';
import { shareContent, hapticSuccess } from '../lib/pwa';
import type { PageId } from '../components/Layout';

const QUICK_ACTIONS: Array<{ id: PageId; label: string; sub: string; icon: IconName }> = [
  { id: 'revision', label: 'مراجعة اليوم', sub: 'الأضعف أولاً', icon: 'repeat' },
  { id: 'reader', label: 'افتح المصحف', sub: '٦٠٤ صفحات', icon: 'book' },
  { id: 'focus', label: 'جلسة تركيز', sub: 'مؤقّت هادئ', icon: 'timer' },
  { id: 'memorization', label: 'سجّل محفوظك', sub: 'نطاق جديد', icon: 'layers' },
];

export function Dashboard({ go }: { go: (p: PageId) => void }) {
  const [tab, setTab] = useState<'overview' | 'daily'>('overview');
  const prefs = useAppSelector((s) => s.prefs);
  const entries = useAppSelector((s) => s.progress.entries);
  const tasks = useAppSelector((s) => s.tasks.daily);
  const history = useAppSelector((s) => s.revision.history);
  const mistakes = useAppSelector((s) => s.mistakes.items);
  const focusSessions = useAppSelector((s) => s.focus.sessions);
  const dispatch = useAppDispatch();
  const today = todayStr();

  const dueToday = useMemo(
    () => entries.filter((e) => e.srDue && e.srDue <= today),
    [entries, today],
  );
  const memorizedAyahs = totalMemorizedAyahs(entries);
  const memorizedPages = useMemo(
    () => new Set(entries.flatMap(entryPages)).size,
    [entries],
  );
  const pct = Math.round((memorizedPages / 604) * 100);
  const focusTodayMin = useMemo(() => {
    const start = new Date(today).getTime();
    return Math.round(
      focusSessions
        .filter((f) => new Date(f.startedAt).getTime() >= start)
        .reduce((n, f) => n + f.durationSec, 0) / 60,
    );
  }, [focusSessions, today]);
  const openMistakes = mistakes.filter((m) => !m.resolved).length;
  const todayTasks = tasks.filter((t) => t.date === today);
  const doneTodayTasks = todayTasks.filter((t) => t.done).length;
  const taskPct = todayTasks.length ? Math.round((doneTodayTasks / todayTasks.length) * 100) : 0;

  const khatma = useMemo(() => buildKhatma(entries, prefs.rates, today), [entries, prefs.rates, today]);
  const todayFix = khatma.days[0];
  const [shareNotice, setShareNotice] = useState('');

  const onShareDay = async () => {
    const text = [
      `تقارير إنجاز اليوم (${fmtDateAr(today)}):`,
      `• محفوظي: ${fmtNum(memorizedAyahs)} آية (${fmtNum(memorizedPages)} صفحة).`,
      `• مراجعة اليوم المستحقة: ${fmtNum(dueToday.length)} مقطع.`,
      `• دقائق التركيز اليوم: ${fmtNum(focusTodayMin)} دقيقة.`,
      `• المهام المنجزة: ${fmtNum(doneTodayTasks)} من ${fmtNum(todayTasks.length)}.`,
      '#HifzFlow — حفظ القرآن الكريم ومراجعته بالتكرار المتباعد',
    ].join('\n');

    const ok = await shareContent({
      title: `إنجاز ورد القرآن اليوم — HifzFlow`,
      text,
      url: window.location.origin,
    });
    if (ok) {
      hapticSuccess();
      setShareNotice('تمت مشاركة / نسخ ملخص اليوم بنجاح ✓');
      setTimeout(() => setShareNotice(''), 3500);
    }
  };

  const split = useMemo(() => {
    const start = prefs.wirdCycleStart ?? today;
    const wird = buildWirdTable(entries, prefs.wirdCycleDays, start);
    const dayIdx = Math.floor((new Date(today).getTime() - new Date(start).getTime()) / 86400000);
    const todayWird = wird.length ? wird[Math.min(Math.max(dayIdx, 0), wird.length - 1)] : null;
    return { split: splitWirdByMinutes(prefs.dailyMinutes, todayWird?.pages ?? 0), todayWird };
  }, [entries, prefs.dailyMinutes, prefs.wirdCycleDays, prefs.wirdCycleStart, today]);

  return (
    <div>
      <PageHeader
        title="لوحة التحكم"
        icon="home"
        sub={`${fmtDateAr(today)} — ${memorizedAyahs > 0 ? `محفوظك ${fmtNum(memorizedAyahs)} آية في ${fmtNum(entries.length)} نطاق` : 'ابدأ بإضافة محفوظك من صفحة الحفظ'}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Btn variant="outline" size="sm" onClick={onShareDay} title="مشاركة ملخص إنجاز اليوم">
              <Icon name="share" size={15} /> مشاركة الورد
            </Btn>
            <Btn variant="soft" onClick={() => go('revision')}>
              <Icon name="repeat" size={16} /> ابدأ مراجعة
            </Btn>
          </div>
        }
      />

      {shareNotice && (
        <div className="mb-3 animate-fade-in rounded-xl border border-primary/40 bg-primarysoft p-2.5 text-center text-xs font-bold text-primary">
          {shareNotice}
        </div>
      )}

      <InstallCard className="mb-3" />

      {prefs.sampleLoaded && (
        <Card className="mb-3 border-amber-300/70 bg-amber-50/80 dark:border-amber-700/50 dark:bg-amber-950/25">
          <CardBody>
            <p className="flex items-center gap-2 text-sm font-bold text-amber-900 dark:text-amber-100">
              <Icon name="alert" size={16} /> هذه بيانات تجريبية للعرض فقط
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted">سور وأخطاء ومهام وهمية لترى شكل التطبيق. امسحها بضغطة واحدة وابدأ فارغاً، أو استورد نسختك الاحتياطية.</p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              <Btn size="sm" variant="outline" onClick={() => clearSampleData()}>مسح البيانات التجريبية</Btn>
              <Btn size="sm" variant="ghost" onClick={() => go('backup')}>استيراد نسخة احتياطية</Btn>
            </div>
          </CardBody>
        </Card>
      )}

      <Tabs
        tabs={[{ id: 'overview', label: 'نظرة عامة' }, { id: 'daily', label: 'المتابعة اليومية' }]}
        value={tab}
        onChange={setTab}
      />

      {tab === 'overview' && (
        <div className="mt-3 flex flex-col gap-3">
          <section className="hero-card hero-pattern p-5" aria-label="خطة اليوم">
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-5">
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold text-white/70">
                  <Icon name="target" size={13} /> خطتك اليوم
                </p>
                <h2 className="mt-1.5 font-display text-[1.75rem] font-bold leading-tight sm:text-[2rem]">
                  ختمة كل {fmtNum(khatma.targetDays)} يوم
                </h2>
                <p className="mt-1.5 max-w-md text-sm leading-relaxed text-white/80">
                  جزآن كل يوم — {fmtNum(prefs.rates.weak)} صفحات ضعيف، {fmtNum(prefs.rates.medium)} متوسط، {fmtNum(prefs.rates.strong)} قوي.
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Btn
                    className="bg-white hover:bg-white/90"
                    style={{ color: 'rgb(var(--c-hero3))' }}
                    onClick={() => go('revision')}
                  >
                    <Icon name="repeat" size={16} /> التثبيت والمراجعة
                  </Btn>
                  <Btn variant="ghost" className="text-white hover:bg-white/10" onClick={() => go('reader')}>
                    <Icon name="book" size={16} /> افتح المصحف
                  </Btn>
                </div>
              </div>
              <ProgressRing value={memorizedPages} max={604} size={116} stroke={9}>
                <span className="font-display text-2xl font-bold leading-none">{fmtNum(pct)}٪</span>
                <span className="mt-0.5 text-[10px] text-white/70">من المصحف</span>
              </ProgressRing>
            </div>
            <div className="relative z-10 mt-5 grid grid-cols-3 gap-2">
              {[
                { label: 'صفحات محفوظة', value: `${fmtNum(memorizedPages)} / ٦٠٤` },
                { label: 'مستحق اليوم', value: fmtNum(dueToday.length) },
                { label: 'مهام اليوم', value: `${fmtNum(doneTodayTasks)}/${fmtNum(todayTasks.length)}` },
              ].map((s) => (
                <div key={s.label} className="rounded-xl bg-white/10 px-2.5 py-2 backdrop-blur-sm">
                  <p className="text-[10px] text-white/65">{s.label}</p>
                  <p className="mt-0.5 font-display text-base font-bold">{s.value}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {QUICK_ACTIONS.map((a) => (
              <button
                key={a.id}
                onClick={() => go(a.id)}
                className="group flex min-h-[5.25rem] flex-col items-start gap-1 rounded-2xl border border-line bg-surface p-3 text-start shadow-soft transition hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-lift"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primarysoft text-primary transition group-hover:bg-primary group-hover:text-white">
                  <Icon name={a.icon} size={16} />
                </span>
                <span className="mt-1 text-[13px] font-bold leading-tight">{a.label}</span>
                <span className="text-[11px] text-muted">{a.sub}</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <Stat label="آيات محفوظة" value={fmtNum(memorizedAyahs)} sub={`${fmtNum(entries.length)} نطاق محفوظ`} icon="book" />
            <Stat label="مراجعة مستحقة" value={fmtNum(dueToday.length)} sub="الأضعف أولاً" icon="repeat" />
            <Stat label="دقائق تركيز اليوم" value={fmtNum(focusTodayMin)} sub={`${fmtNum(history.length)} مراجعة مسجلة`} icon="timer" />
            <Stat label="أخطاء مفتوحة" value={fmtNum(openMistakes)} sub="من صفحة الأخطاء" icon="pen" />
            <Stat label="مهام اليوم" value={`${fmtNum(doneTodayTasks)}/${fmtNum(todayTasks.length)}`} sub={`${fmtNum(taskPct)}٪ منجز`} icon="list" />
            <Stat label="صفحات محفوظة" value={`${fmtNum(memorizedPages)} / ٦٠٤`} sub={`${fmtNum(pct)}٪ من المصحف`} icon="layers" />
          </div>

          {/* ورد اليوم */}
          <Card>
            <CardHead title="ورد اليوم" sub={`مبني على ${fmtNum(prefs.dailyMinutes)} دقيقة — ٥٠٪ مراجعة دورية / ٣٠٪ مراجعة حديثة / ٢٠٪ حفظ جديد وربط`} />
            <CardBody>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { min: split.split.rotatingMin, pages: split.split.rotatingPages, label: 'مراجعة دورية' },
                  { min: split.split.recentMin, pages: split.split.recentPages, label: 'مراجعة حديثة' },
                  { min: split.split.newMin, pages: split.split.newPages, label: 'حفظ جديد وربط' },
                ].map((b) => (
                  <div key={b.label} className="rounded-xl border border-line bg-surface2/60 p-2.5">
                    <p className="font-display text-lg font-bold leading-none">{fmtNum(b.min)} <span className="font-sans text-[11px] font-normal text-muted">د</span></p>
                    <p className="mt-1 text-[11px] leading-tight text-muted">{b.label}<br /><span className="text-muted/80">~{fmtNum(b.pages)} صفحة</span></p>
                  </div>
                ))}
              </div>
              {split.split.overTime && (
                <p className="mt-2 rounded-xl bg-amber-100 p-2.5 text-xs font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                  ورد المراجعة الدورية اليوم يحتاج {fmtMinutes(split.split.rotatingNeededMin)} لكن حصته {fmtMinutes(split.split.rotatingMin)} — زوّد مدة الورد أو قلّل دورة الورد.
                </p>
              )}
              {split.todayWird && (
                <p className="mt-2.5 flex flex-wrap items-center gap-1.5 text-sm">
                  <Icon name="book" size={15} className="text-primary" />
                  ورد اليوم الدوري: <b>{surahName(split.todayWird.fromSurah)} {fmtNum(split.todayWird.fromAyah)} ← {surahName(split.todayWird.toSurah)} {fmtNum(split.todayWird.toAyah)}</b>
                  <Badge>{fmtNum(split.todayWird.ayahs)} آية • {fmtNum(split.todayWird.pages)} صفحات</Badge>
                </p>
              )}
              {todayFix && todayFix.chunks.length > 0 && (
                <div className="mt-3">
                  <p className="flex items-center gap-1.5 text-sm font-bold">
                    <Icon name="target" size={15} className="text-accent" /> تثبيت اليوم — يوم {fmtNum(todayFix.day)}
                  </p>
                  <ul className="mt-1.5 flex flex-col gap-1">
                    {todayFix.chunks.map((c) => (
                      <li key={c.id} className="flex flex-wrap items-center gap-2 rounded-lg bg-surface2/60 px-2.5 py-1.5 text-sm">
                        <Badge tone={c.level === 'weak' ? 'warn' : c.level === 'medium' ? 'soft' : 'ok'}>
                          {c.level === 'weak' ? 'ضعيف' : c.level === 'medium' ? 'متوسط' : 'قوي'}
                        </Badge>
                        <span className="min-w-0">{c.ranges.map((r) => `${surahName(r.surah)} ${fmtNum(r.from)}–${fmtNum(r.to)}`).join(' + ')}</span>
                        <span className="ms-auto text-xs text-muted">{fmtNum(c.pageCount)} صفحات</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {entries.length === 0 && (
                <EmptyState
                  icon="book"
                  title="لا يوجد محفوظ بعد"
                  sub="أضف السور التي حفظتها من صفحة الحفظ، أو حمّل البيانات التجريبية لتجربة التطبيق."
                  action={<Btn onClick={() => go('memorization')}>إضافة محفوظ</Btn>}
                />
              )}
            </CardBody>
          </Card>

          {/* Due today preview */}
          <Card>
            <CardHead
              title="مراجعة مستحقة اليوم"
              sub="الأضعف أولاً — قيّمها من صفحة المراجعة"
              action={<Btn variant="ghost" size="sm" onClick={() => go('revision')}>فتح المراجعة <Icon name="chevron-left" size={14} /></Btn>}
            />
            <CardBody>
              {dueToday.length === 0 ? (
                <p className="flex items-center gap-2 text-sm text-muted">
                  <Icon name="check-circle" size={16} className="text-primary" /> لا شيء مستحق اليوم — أحسنت.
                </p>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {dueToday.slice(0, 5).map((e) => (
                    <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-surface2/70 px-3 py-2 text-sm">
                      <span className="font-semibold">{surahName(e.surah)} {fmtNum(e.fromAyah)}–{fmtNum(e.toAyah)}</span>
                      <span className="flex items-center gap-1.5 text-[11px] text-muted">
                        <Badge tone={e.strength === 'weak' ? 'warn' : 'soft'} dot>
                          {e.strength === 'weak' ? 'ضعيف' : e.strength === 'medium' ? 'متوسط' : e.strength === 'strong' ? 'قوي' : 'متقن جداً'}
                        </Badge>
                        المرحلة {fmtNum(e.srStage + 1)} من ٦
                      </span>
                    </li>
                  ))}
                  {dueToday.length > 5 && <li className="text-xs text-muted">+ {fmtNum(dueToday.length - 5)} أخرى…</li>}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      {tab === 'daily' && (
        <div className="mt-3 flex flex-col gap-3">
          <Card>
            <CardHead
              title="متابعة اليوم"
              sub="علّم ما أنجزته — كل شيء يُحفظ تلقائياً"
              action={<Btn variant="outline" size="sm" onClick={() => generateRecurringToday()}>توليد مهام اليوم المتكررة</Btn>}
            />
            <CardBody>
              {todayTasks.length === 0 && dueToday.length === 0 && (
                <EmptyState
                  icon="calendar"
                  title="يومك فارغ"
                  sub="لا مهام ولا مراجعات مستحقة اليوم. أدرج خطة التثبيت في المهام من صفحة المراجعة."
                  action={<Btn onClick={() => { insertFixationPlan(); go('planner'); }}>إدراج خطة التثبيت في المهام</Btn>}
                />
              )}
              {todayTasks.length > 0 && (
                <div className="mb-3">
                  <div className="mb-1 flex items-center justify-between text-[11px] text-muted">
                    <span>إنجاز اليوم</span>
                    <span>{fmtNum(taskPct)}٪</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-surface2">
                    <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${taskPct}%` }} />
                  </div>
                </div>
              )}
              <ul className="flex flex-col gap-1.5">
                {todayTasks.map((t) => (
                  <li key={t.id} className="flex items-center gap-2.5 rounded-xl bg-surface2/70 px-3 py-2.5 text-sm">
                    <input
                      type="checkbox"
                      checked={t.done}
                      onChange={() => dispatch(tasksSlice.actions.toggleDaily(t.id))}
                      className="h-4 w-4 accent-[rgb(var(--c-primary))]"
                    />
                    <span className={t.done ? 'text-muted line-through' : ''}>{t.title}</span>
                  </li>
                ))}
                {dueToday.map((e) => (
                  <li key={`rev-${e.id}`} className="flex items-center justify-between gap-2 rounded-xl border border-line px-3 py-2 text-sm">
                    <span className="flex min-w-0 items-center gap-2">
                      <Icon name="repeat" size={14} className="shrink-0 text-primary" />
                      <span className="truncate">مراجعة: {surahName(e.surah)} {fmtNum(e.fromAyah)}–{fmtNum(e.toAyah)}</span>
                    </span>
                    <Btn variant="soft" size="sm" onClick={() => go('revision')}>قيّم</Btn>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}
