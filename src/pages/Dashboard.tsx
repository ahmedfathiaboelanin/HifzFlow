// Dashboard: overview of memorization, schedule progress, stats, and quick actions.
import { useEffect, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/store';
import { clearSampleData, syncScheduleTasks } from '../store/store';
import { fmtDateAr, fmtNum, todayStr } from '../lib/utils';
import { totalMemorizedAyahs, entryPages } from '../lib/quran';
import { Btn, Card, CardBody, ProgressRing, Stat, PageHeader } from '../components/ui';
import { Icon } from '../components/icons';
import type { IconName } from '../components/icons';
import { InstallCard } from '../components/Pwa';
import { shareContent, hapticSuccess } from '../lib/pwa';
import type { PageId } from '../components/Layout';

const QUICK_ACTIONS: Array<{ id: PageId; label: string; sub: string; icon: IconName }> = [
  { id: 'revision', label: 'المراجعة', sub: 'الختمة وتثبيت الضعيف', icon: 'repeat' },
  { id: 'planner', label: 'المهام اليومية', sub: 'متابعة الإنجاز', icon: 'calendar' },
  { id: 'reader', label: 'افتح المصحف', sub: '٦٠٤ صفحات', icon: 'book' },
  { id: 'memorization', label: 'سجّل محفوظك', sub: 'نطاق جديد', icon: 'layers' },
];

export function Dashboard({ go }: { go: (p: PageId) => void }) {
  const prefs = useAppSelector((s) => s.prefs);
  const entries = useAppSelector((s) => s.progress.entries);
  const tasks = useAppSelector((s) => s.tasks.daily);
  const history = useAppSelector((s) => s.revision.history);
  const mistakes = useAppSelector((s) => s.mistakes.items);
  const focusSessions = useAppSelector((s) => s.focus.sessions);
  const schedule = useAppSelector((s) => s.schedule);
  const scheduleDays = schedule.days;
  const weakParts = schedule.weakParts;

  const today = todayStr();

  // Sync revision due items to daily tasks on mount
  useEffect(() => {
    syncScheduleTasks();
  }, []);

  // Today's scheduled khatma item
  const todayKhatmaItem = useMemo(() => {
    return scheduleDays.find((d) => d.date === today) || scheduleDays.find((d) => !d.done) || null;
  }, [scheduleDays, today]);

  // Due weak parts today
  const dueWeakCount = useMemo(() => {
    return weakParts.filter((wp) => wp.nextReviewDate <= today).length;
  }, [weakParts, today]);

  const dueRevisionCount = (todayKhatmaItem && !todayKhatmaItem.done ? 1 : 0) + dueWeakCount;

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

  const [shareNotice, setShareNotice] = useState('');

  const onShareDay = async () => {
    const text = [
      `تقارير إنجاز اليوم (${fmtDateAr(today)}):`,
      `• محفوظي: ${fmtNum(memorizedAyahs)} آية (${fmtNum(memorizedPages)} صفحة).`,
      `• مراجعة وتثبيت مستحق اليوم: ${fmtNum(dueRevisionCount)} مقطع.`,
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

  return (
    <div className="space-y-4">
      <PageHeader
        title="لوحة التحكم"
        icon="home"
        sub={`${fmtDateAr(today)} — ${memorizedAyahs > 0 ? `محفوظك ${fmtNum(memorizedAyahs)} آية في ${fmtNum(entries.length)} نطاق` : 'ابدأ بإضافة محفوظك من صفحة الحفظ'}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Btn variant="outline" size="sm" onClick={onShareDay} title="مشاركة ملخص إنجاز اليوم">
              <Icon name="share" size={15} className="me-1" /> مشاركة الورد
            </Btn>
            <Btn variant="soft" onClick={() => go('revision')}>
              <Icon name="repeat" size={16} className="me-1" /> المراجعة
            </Btn>
          </div>
        }
      />

      {shareNotice && (
        <div className="animate-fade-in rounded-xl border border-primary/40 bg-primarysoft p-2.5 text-center text-xs font-bold text-primary">
          {shareNotice}
        </div>
      )}

      <InstallCard />

      {prefs.sampleLoaded && (
        <Card className="border-amber-300/70 bg-amber-50/80 dark:border-amber-700/50 dark:bg-amber-950/25">
          <CardBody>
            <p className="flex items-center gap-2 text-sm font-bold text-amber-900 dark:text-amber-100">
              <Icon name="alert" size={16} /> هذه بيانات تجريبية للعرض فقط
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              سور وأخطاء ومهام وهمية لترى شكل التطبيق. امسحها بضغطة واحدة وابدأ فارغاً، أو استورد نسختك الاحتياطية.
            </p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              <Btn size="sm" variant="outline" onClick={() => clearSampleData()}>مسح البيانات التجريبية</Btn>
              <Btn size="sm" variant="ghost" onClick={() => go('backup')}>استيراد نسخة احتياطية</Btn>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Hero card */}
      <section className="hero-card hero-pattern p-5" aria-label="خطة اليوم">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-5">
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold text-white/70">
              <Icon name="target" size={13} /> خطة المراجعة والختمة
            </p>
            <h2 className="mt-1.5 font-display text-[1.75rem] font-bold leading-tight sm:text-[2rem]">
              {scheduleDays.length > 0
                ? `ختمة مراجعة في ${fmtNum(scheduleDays.length)} يوم`
                : 'جدولة الحفظ والمراجعة'}
            </h2>
            <p className="mt-1.5 max-w-md text-sm leading-relaxed text-white/80">
              {scheduleDays.length > 0
                ? `${fmtNum(scheduleDays.reduce((a, b) => a + b.pageCount, 0))} صفحة مقسمة بالتساوي بمعدل ${fmtNum(Number((scheduleDays.reduce((a, b) => a + b.pageCount, 0) / scheduleDays.length).toFixed(1)))} صفحة يومياً.`
                : 'قسّم محفوظك بالتساوي على عدد الأيام التي تختارها وثبّت السور الضعيفة بالتكرار المتباعد.'}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Btn
                className="bg-white hover:bg-white/90"
                style={{ color: 'rgb(var(--c-hero3))' }}
                onClick={() => go('revision')}
              >
                <Icon name="repeat" size={16} className="me-1" /> صفحة المراجعة
              </Btn>
              <Btn variant="ghost" className="text-white hover:bg-white/10" onClick={() => go('planner')}>
                <Icon name="calendar" size={16} className="me-1" /> المهام اليومية
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
            { label: 'مستحق المراجعة', value: fmtNum(dueRevisionCount) },
            { label: 'مهام اليوم', value: `${fmtNum(doneTodayTasks)}/${fmtNum(todayTasks.length)}` },
          ].map((s) => (
            <div key={s.label} className="rounded-xl bg-white/10 px-2.5 py-2 backdrop-blur-sm">
              <p className="text-[10px] text-white/65">{s.label}</p>
              <p className="mt-0.5 font-display text-base font-bold">{s.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {QUICK_ACTIONS.map((a) => (
          <button
            key={a.id}
            type="button"
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

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Stat
          label="آيات محفوظة"
          value={fmtNum(memorizedAyahs)}
          sub={`${fmtNum(entries.length)} نطاق محفوظ`}
          icon="book"
        />
        <Stat
          label="مستحق المراجعة والتثبيت"
          value={fmtNum(dueRevisionCount)}
          sub={dueRevisionCount > 0 ? 'مجدولة في المراجعة والمهام' : 'أحسنت، لا شيء متأخر'}
          icon="repeat"
        />
        <Stat
          label="مهام اليوم"
          value={`${fmtNum(doneTodayTasks)}/${fmtNum(todayTasks.length)}`}
          sub={`${fmtNum(taskPct)}٪ منجز`}
          icon="list"
        />
        <Stat
          label="دقائق تركيز اليوم"
          value={fmtNum(focusTodayMin)}
          sub={`${fmtNum(history.length)} مراجعة مسجلة`}
          icon="timer"
        />
        <Stat
          label="أخطاء مفتوحة"
          value={fmtNum(openMistakes)}
          sub="من صفحة الأخطاء"
          icon="pen"
        />
        <Stat
          label="صفحات محفوظة"
          value={`${fmtNum(memorizedPages)} / ٦٠٤`}
          sub={`${fmtNum(pct)}٪ من المصحف`}
          icon="layers"
        />
      </div>
    </div>
  );
}
