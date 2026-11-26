// Daily + recurring task planner (grouped by date, Done buttons).
import { useEffect, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/store';
import { generateRecurringToday, syncScheduleTasks } from '../store/store';
import { scheduleSlice, tasksSlice } from '../store/slices';
import { fmtDateAr, fmtNum, todayStr, uid } from '../lib/utils';
import { hapticTap } from '../lib/pwa';
import { Btn, Card, CardBody, CardHead, EmptyState, IconButton, Input, PageHeader, Select, Tabs } from '../components/ui';

const WEEKDAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

function TaskRow({
  id,
  title: t,
  done,
  date: d,
  onToggle,
  onRemove,
}: {
  id: string;
  title: string;
  done: boolean;
  date: string;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <li className="flex items-center gap-2.5 rounded-xl border border-line/70 bg-surface2/50 px-3 py-2 text-sm">
      <input
        type="checkbox"
        checked={done}
        onChange={() => {
          hapticTap();
          onToggle(id);
        }}
        className="h-4 w-4 shrink-0 accent-[rgb(var(--c-primary))]"
      />
      <span className={done ? 'text-muted line-through' : ''}>{t}</span>
      <span className="ms-auto shrink-0 text-[11px] text-muted">{fmtDateAr(d)}</span>
      <IconButton
        label="حذف المهمة"
        name="trash"
        size={14}
        className="h-7 w-7 text-muted hover:text-red-600"
        onClick={() => onRemove(id)}
      />
    </li>
  );
}

export function Planner() {
  const [tab, setTab] = useState<'today' | 'upcoming' | 'recurring'>('today');
  const daily = useAppSelector((s) => s.tasks.daily);
  const recurring = useAppSelector((s) => s.tasks.recurring);
  const dispatch = useAppDispatch();
  const today = todayStr();

  const [title, setTitle] = useState('');
  const [date, setDate] = useState(today);
  const [priority, setPriority] = useState(2);
  const [recTitle, setRecTitle] = useState('');
  const [recFreq, setRecFreq] = useState<'daily' | 'weekly'>('weekly');
  const [recDays, setRecDays] = useState<number[]>([5]);
  const [groupPage, setGroupPage] = useState(1);

  useEffect(() => {
    syncScheduleTasks();
  }, []);

  const todayList = useMemo(
    () => daily.filter((t) => t.date <= today).sort((a, b) => (b.priority - a.priority) || a.date.localeCompare(b.date)),
    [daily, today],
  );
  const upcomingGroups = useMemo(() => {
    const map = new Map<string, typeof daily>();
    for (const t of daily.filter((x) => x.date > today)) {
      if (!map.has(t.date)) map.set(t.date, []);
      map.get(t.date)!.push(t);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [daily, today]);
  const groupPages = Math.max(1, Math.ceil(upcomingGroups.length / 5));
  const shownGroups = upcomingGroups.slice((groupPage - 1) * 5, groupPage * 5);

  const addTask = () => {
    if (!title.trim()) return;
    dispatch(tasksSlice.actions.addDaily({
      id: uid(), date, title: title.trim(), done: false, priority,
      linkedSurah: null, kind: 'general', refId: null,
    }));
    setTitle('');
  };

  const addRecurring = () => {
    if (!recTitle.trim()) return;
    dispatch(tasksSlice.actions.addRecurring({
      id: uid(), title: recTitle.trim(), frequency: recFreq,
      days: recFreq === 'weekly' ? recDays : [], active: true,
    }));
    setRecTitle('');
  };

  const toggleTask = (id: string) => {
    const task = daily.find((t) => t.id === id);
    if (task && task.refId?.startsWith('khatma-')) {
      const dayId = task.refId.replace(/^khatma-/, '');
      dispatch(scheduleSlice.actions.setDayDone({ id: dayId, done: !task.done }));
    }
    dispatch(tasksSlice.actions.toggleDaily(id));
  };
  const removeTask = (id: string) => dispatch(tasksSlice.actions.removeDaily(id));

  return (
    <div>
      <PageHeader
        icon="calendar"
        title="المهام"
        sub="مهامك اليومية والمتكررة — وجلسات التثبيت المُدرجة تظهر هنا بتواريخها."
      />
      <Tabs
        tabs={[
          { id: 'today', label: 'اليوم' },
          { id: 'upcoming', label: 'القادم' },
          { id: 'recurring', label: 'المتكررة' },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === 'today' && (
        <Card className="mt-3">
          <CardHead
            title="مهام اليوم والمتأخرة"
            sub="علّم ما أنجزته"
            action={
              <Btn
                variant="outline"
                onClick={() => {
                  generateRecurringToday();
                  syncScheduleTasks();
                }}
              >
                تحديث مهام اليوم
              </Btn>
            }
          />
          <CardBody>
            <div className="mb-3 flex flex-wrap items-end gap-2">
              <Input placeholder="مهمة جديدة…" value={title} onChange={(e) => setTitle(e.target.value)} className="!w-64" onKeyDown={(e) => { if (e.key === 'Enter') addTask(); }} />
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="!w-40" />
              <Select value={priority} onChange={(e) => setPriority(Number(e.target.value))}>
                <option value={1}>أولوية عادية</option>
                <option value={2}>أولوية متوسطة</option>
                <option value={3}>أولوية عالية</option>
              </Select>
              <Btn onClick={addTask}>إضافة</Btn>
            </div>
            {todayList.length === 0 ? (
              <EmptyState title="لا مهام اليوم" sub="يومك خالٍ — أضف مهمة أو أدرج خطة التثبيت من صفحة المراجعة." />
            ) : (
              <ul className="flex flex-col gap-1.5">
                {todayList.map((t) => (
                  <TaskRow
                    key={t.id}
                    id={t.id}
                    title={t.title}
                    done={t.done}
                    date={t.date}
                    onToggle={toggleTask}
                    onRemove={removeTask}
                  />
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      )}

      {tab === 'upcoming' && (
        <Card className="mt-3">
          <CardHead title="المهام القادمة" sub="مجمّعة حسب التاريخ — ٥ مجموعات في الصفحة" />
          <CardBody>
            {shownGroups.length === 0 ? (
              <EmptyState title="لا مهام قادمة" sub="المهام المستقبلية ستظهر هنا مجمّعة حسب تاريخها." />
            ) : (
              <div className="flex flex-col gap-3">
                {shownGroups.map(([d, list]) => (
                  <div key={d}>
                    <p className="mb-1 text-sm font-bold">{fmtDateAr(d)}</p>
                    <ul className="flex flex-col gap-1.5">
                      {list.map((t) => (
                        <TaskRow
                          key={t.id}
                          id={t.id}
                          title={t.title}
                          done={t.done}
                          date={t.date}
                          onToggle={toggleTask}
                          onRemove={removeTask}
                        />
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
            {groupPages > 1 && (
              <div className="mt-3 flex items-center justify-between text-xs text-muted">
                <span>صفحة {fmtNum(groupPage)} من {fmtNum(groupPages)}</span>
                <div className="flex gap-1">
                  <button disabled={groupPage <= 1} onClick={() => setGroupPage(groupPage - 1)} className="rounded-lg border border-line px-2 py-1 disabled:opacity-40">‹ السابق</button>
                  <button disabled={groupPage >= groupPages} onClick={() => setGroupPage(groupPage + 1)} className="rounded-lg border border-line px-2 py-1 disabled:opacity-40">التالي ›</button>
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {tab === 'recurring' && (
        <Card className="mt-3">
          <CardHead title="المهام المتكررة" sub="تُولَّد تلقائياً في مهام اليوم عند فتح التطبيق" />
          <CardBody>
            <div className="mb-3 flex flex-wrap items-end gap-2">
              <Input placeholder="مهمة متكررة جديدة…" value={recTitle} onChange={(e) => setRecTitle(e.target.value)} className="!w-64" />
              <Select value={recFreq} onChange={(e) => setRecFreq(e.target.value as 'daily' | 'weekly')}>
                <option value="daily">يومياً</option>
                <option value="weekly">أسبوعياً</option>
              </Select>
              {recFreq === 'weekly' && (
                <div className="flex flex-wrap gap-1">
                  {WEEKDAYS.map((d, i) => (
                    <button
                      key={i}
                      onClick={() => setRecDays(recDays.includes(i) ? recDays.filter((x) => x !== i) : [...recDays, i])}
                      className={'rounded-full px-2.5 py-1 text-xs font-semibold ' + (recDays.includes(i) ? 'bg-primary text-white' : 'bg-surface2 text-muted')}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              )}
              <Btn onClick={addRecurring}>إضافة</Btn>
            </div>
            {recurring.length === 0 ? (
              <EmptyState title="لا مهام متكررة" sub="مثال: أذكار الصباح يومياً، أو مراجعة جزء عم كل جمعة." />
            ) : (
              <ul className="flex flex-col gap-1.5">
                {recurring.map((r) => (
                  <li key={r.id} className="flex items-center gap-2 rounded-xl bg-surface2 px-3 py-2 text-sm">
                    <span className="font-bold">{r.title}</span>
                    <span className="text-xs text-muted">{r.frequency === 'daily' ? 'يومياً' : `أسبوعياً: ${r.days.map((d) => WEEKDAYS[d]).join('، ')}`}</span>
                    <span className="ms-auto flex gap-2">
                      <button className="text-primary hover:underline" onClick={() => dispatch(tasksSlice.actions.toggleRecurring(r.id))}>{r.active ? 'إيقاف' : 'تفعيل'}</button>
                      <button className="text-red-600 hover:underline" onClick={() => dispatch(tasksSlice.actions.removeRecurring(r.id))}>حذف</button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
