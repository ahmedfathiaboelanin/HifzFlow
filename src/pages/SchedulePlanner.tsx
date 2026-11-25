// Memorization and Review Planner (جدولة الحفظ والمراجعة).
// Manages memorized scope, khatma schedules with missed-day adjustments,
// and spaced repetition for weak areas with sight-vs-memory stages.
import { useMemo, useState } from 'react';
import { SURAHS } from '../data/mushaf';
import {
  RUB_OPTIONS, checkMissedDays, generateScheduleDays,
  resolveMemorizedPages,
} from '../lib/schedule';
import { hapticTap } from '../lib/pwa';
import type {
  MemorizedScope, MissedDaysPolicy, ScheduleDayItem,
  WeakPartItem, WeakPartStage, WeakPartType, WeakRating,
} from '../lib/types';
import {
  addDaysStr, cx, daysUntil, fmtDateAr, fmtNum, todayStr, uid,
} from '../lib/utils';
import {
  Badge, Btn, Card, CardBody, CardHead, EmptyState,
  IconButton, Input, PageHeader, Select, Tabs,
} from '../components/ui';
import { Icon } from '../components/icons';
import { useAppDispatch, useAppSelector } from '../store/store';
import { scheduleSlice } from '../store/slices';

export function SchedulePlanner() {
  const dispatch = useAppDispatch();
  const schedule = useAppSelector((s) => s.schedule);
  const config = schedule.config;
  const days = schedule.days;
  const weakParts = schedule.weakParts;

  const [activeTab, setActiveTab] = useState<'today' | 'khatma' | 'weak' | 'config'>('today');

  // Form states for editing memorized scope & plan
  const [scopeType, setScopeType] = useState<MemorizedScope['type']>(config.memorized.type);
  const [ajzaCount, setAjzaCount] = useState<number>(config.memorized.ajzaCount || 10);
  const [ajzaStart, setAjzaStart] = useState<MemorizedScope['ajzaStart']>(config.memorized.ajzaStart || 'start');
  const [customFromJuz, setCustomFromJuz] = useState<number>(config.memorized.customFromJuz || 1);
  const [customToJuz, setCustomToJuz] = useState<number>(config.memorized.customToJuz || 10);
  const [fromSurah, setFromSurah] = useState<number>(config.memorized.fromSurah || 1);
  const [toSurah, setToSurah] = useState<number>(config.memorized.toSurah || 9);
  const [fromPage, setFromPage] = useState<number>(config.memorized.fromPage || 1);
  const [toPage, setToPage] = useState<number>(config.memorized.toPage || 201);
  const [targetDays, setTargetDays] = useState<number>(config.targetDays || 7);
  const [policy, setPolicy] = useState<MissedDaysPolicy>(config.missedDaysPolicy || 'delayEnd');

  // Form state for adding weak parts
  const [weakType, setWeakType] = useState<WeakPartType>('surah');
  const [weakSurah, setWeakSurah] = useState<number>(1);
  const [weakJuz, setWeakJuz] = useState<number>(30);
  const [weakRubJuz, setWeakRubJuz] = useState<number>(1);
  const [weakRubIndex, setWeakRubIndex] = useState<number>(0);
  const [weakCustomTitle, setWeakCustomTitle] = useState<string>('');
  const [weakStage, setWeakStage] = useState<WeakPartStage>('sight');
  const [weakNotes, setWeakNotes] = useState<string>('');

  const today = todayStr();

  // Scope preview computation
  const previewScope: MemorizedScope = useMemo(() => ({
    type: scopeType,
    ajzaCount: Number(ajzaCount),
    ajzaStart,
    customFromJuz: Number(customFromJuz),
    customToJuz: Number(customToJuz),
    fromSurah: Number(fromSurah),
    toSurah: Number(toSurah),
    fromPage: Number(fromPage),
    toPage: Number(toPage),
  }), [scopeType, ajzaCount, ajzaStart, customFromJuz, customToJuz, fromSurah, toSurah, fromPage, toPage]);

  const previewInfo = useMemo(() => resolveMemorizedPages(previewScope), [previewScope]);

  // Khatma progress computations
  const totalDays = days.length;
  const completedDays = days.filter((d) => d.done).length;
  const progressPercent = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

  // Identify today's scheduled portion
  const todayItem = useMemo(() => {
    // 1. First look for today's date exact match
    const exact = days.find((d) => d.date === today);
    if (exact) return exact;
    // 2. Or the first pending portion
    const firstPending = days.find((d) => !d.done);
    return firstPending || days[days.length - 1] || null;
  }, [days, today]);

  // Current day index in progress (e.g. Day X of N)
  const currentDayIndex = useMemo(() => {
    if (!todayItem) return 1;
    return todayItem.dayIndex;
  }, [todayItem]);

  // Missed days detection
  const missedInfo = useMemo(() => checkMissedDays(days, today), [days, today]);

  // Weak parts due today
  const dueWeakParts = useMemo(() => {
    return weakParts.filter((wp) => wp.nextReviewDate <= today);
  }, [weakParts, today]);

  // Handlers for Khatma Plan
  const handleToggleDay = (id: string) => {
    hapticTap();
    dispatch(scheduleSlice.actions.toggleDayDone(id));
  };

  const handleSavePlan = () => {
    hapticTap();
    const newConfig = {
      ...config,
      memorized: previewScope,
      targetDays: Number(targetDays),
      startDate: today,
      missedDaysPolicy: policy,
      updatedAt: new Date().toISOString(),
    };
    const newDays = generateScheduleDays(previewScope, Number(targetDays), today);
    dispatch(scheduleSlice.actions.updateConfig(newConfig));
    dispatch(scheduleSlice.actions.setDays(newDays));
    setActiveTab('today');
  };

  const handleDelayEnd = () => {
    hapticTap();
    dispatch(scheduleSlice.actions.applyMissedDaysDelay());
  };

  const handleRecalculateDaily = () => {
    hapticTap();
    const lastDay = days[days.length - 1];
    const targetEndDate = lastDay ? lastDay.date : today;
    dispatch(scheduleSlice.actions.applyMissedDaysRecalculate({ targetEndDate }));
  };

  // Handlers for Weak Parts
  const handleAddWeakPart = () => {
    let title = '';
    if (weakType === 'surah') {
      title = SURAHS[weakSurah - 1]?.name ?? `سورة ${weakSurah}`;
    } else if (weakType === 'juz') {
      title = `الجزء ${fmtNum(weakJuz)}`;
    } else if (weakType === 'rub') {
      title = `${RUB_OPTIONS[weakRubIndex]} من الجزء ${fmtNum(weakRubJuz)}`;
    } else {
      title = weakCustomTitle.trim();
    }

    if (!title) return;

    hapticTap();
    const newPart: WeakPartItem = {
      id: uid(),
      title,
      type: weakType,
      surahNumber: weakType === 'surah' ? weakSurah : undefined,
      juzNumber: weakType === 'juz' ? weakJuz : weakType === 'rub' ? weakRubJuz : undefined,
      rubName: weakType === 'rub' ? RUB_OPTIONS[weakRubIndex] : undefined,
      stage: weakStage,
      intervalDays: 1,
      repetitionCount: 0,
      lastReviewedAt: null,
      lastRating: null,
      nextReviewDate: today, // due immediately for first review
      notes: weakNotes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    dispatch(scheduleSlice.actions.addWeakPart(newPart));
    setWeakCustomTitle('');
    setWeakNotes('');
  };

  const handleRateWeakPart = (id: string, rating: WeakRating) => {
    hapticTap();
    dispatch(scheduleSlice.actions.rateWeakPart({ id, rating }));
  };

  const handleToggleStage = (id: string) => {
    hapticTap();
    dispatch(scheduleSlice.actions.toggleWeakPartStage(id));
  };

  const handleRemoveWeakPart = (id: string) => {
    hapticTap();
    dispatch(scheduleSlice.actions.removeWeakPart(id));
  };

  return (
    <div>
      <PageHeader
        icon="target"
        title="جدولة الحفظ والمراجعة"
        sub="خطط لختمة مراجعتك بدقة، وعالج الأيام الفائتة، وثبّت المواضع الضعيفة بالتكرار المتباعد."
      />

      <Tabs
        tabs={[
          { id: 'today', label: 'ورد اليوم' },
          { id: 'khatma', label: 'جدول الختمة' },
          { id: 'weak', label: `المواضع الضعيفة (${fmtNum(weakParts.length)})` },
          { id: 'config', label: 'المحفوظ والخطة' },
        ]}
        value={activeTab}
        onChange={setActiveTab}
      />

      {/* ========================================================================= */}
      {/* 1. TODAY VIEW (ورد اليوم)                                                */}
      {/* ========================================================================= */}
      {activeTab === 'today' && (
        <div className="mt-4 flex flex-col gap-4">
          {/* Progress Header Card */}
          <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-surface via-surface to-primarysoft/15">
            <CardBody className="py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primarysoft text-primary">
                      <Icon name="calendar" size={17} />
                    </span>
                    <div>
                      <p className="text-xs text-muted">مرحلة الختمة الحالية</p>
                      <h2 className="font-display text-lg font-bold">
                        اليوم {fmtNum(currentDayIndex)} من {fmtNum(totalDays)}
                      </h2>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-start sm:text-end">
                    <p className="text-xs text-muted">الإنجاز الإجمالي</p>
                    <p className="font-display text-base font-bold text-primary">
                      {fmtNum(progressPercent)}٪ ({fmtNum(completedDays)} من {fmtNum(totalDays)} يوم)
                    </p>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-3.5 h-2.5 w-full overflow-hidden rounded-full bg-surface2">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(3, progressPercent))}%` }}
                />
              </div>

              <div className="mt-2.5 flex items-center justify-between text-[11px] text-muted">
                <span>المحفوظ: {resolveMemorizedPages(config.memorized).summary}</span>
                <span>مدة الختمة: {fmtNum(config.targetDays)} أيام</span>
              </div>
            </CardBody>
          </Card>

          {/* Missed Days Banner (if any) */}
          {missedInfo.hasMissed && (
            <div className="flex flex-col gap-2 rounded-2xl border border-amber-300/80 bg-amber-50/80 p-4 text-amber-900 shadow-soft dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-200">
              <div className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-amber-200/80 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200">
                  <Icon name="alert" size={15} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">
                    تنبيه: لديك ورد غير مكتمل من أيام سابقة ({fmtNum(missedInfo.missedCount)} يوم)
                  </p>
                  <p className="mt-0.5 text-xs text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
                    لم يتم تفويت أي جزء من محفوظك! يمكنك الاختيار بين ترحيل الأيام الفائتة وتأجيل تاريخ الختام، أو إعادة توزيع المتبقي بزيادة المقدار اليومي:
                  </p>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-2 ps-8">
                <Btn
                  variant="outline"
                  size="sm"
                  onClick={handleDelayEnd}
                  className="bg-surface text-ink hover:border-amber-400"
                >
                  <Icon name="clock" size={13} className="me-1" /> تأجيل موعد الختام (ترحيل الأيام)
                </Btn>
                <Btn
                  variant="outline"
                  size="sm"
                  onClick={handleRecalculateDaily}
                  className="bg-surface text-ink hover:border-amber-400"
                >
                  <Icon name="refresh" size={13} className="me-1" /> زيادة المقدار اليومي (إنهاء في الموعد)
                </Btn>
              </div>
            </div>
          )}

          {/* Today's Khatma Portion */}
          <Card>
            <CardHead
              title="ورد الختمة المقرّر اليوم"
              sub={todayItem ? fmtDateAr(todayItem.date) : 'اليوم'}
              action={
                todayItem && (
                  <Badge tone={todayItem.done ? 'ok' : 'warn'}>
                    {todayItem.done ? 'مُنجز اليوم ✓' : 'قيد المراجعة'}
                  </Badge>
                )
              }
            />
            <CardBody>
              {todayItem ? (
                <div className="flex flex-col gap-3">
                  <div
                    className={cx(
                      'flex items-center gap-3.5 rounded-2xl border p-4 transition',
                      todayItem.done
                        ? 'border-emerald-300/70 bg-emerald-50/50 dark:border-emerald-800/40 dark:bg-emerald-950/20'
                        : 'border-line bg-surface2/60',
                    )}
                  >
                    <input
                      type="checkbox"
                      id={`check-${todayItem.id}`}
                      checked={todayItem.done}
                      onChange={() => handleToggleDay(todayItem.id)}
                      className="h-6 w-6 shrink-0 cursor-pointer rounded-lg accent-[rgb(var(--c-primary))]"
                    />
                    <label htmlFor={`check-${todayItem.id}`} className="min-w-0 flex-1 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <span className="font-display text-base font-bold leading-tight">
                          {todayItem.title}
                        </span>
                        <span className="text-xs text-muted">
                          (اليوم {fmtNum(todayItem.dayIndex)} من {fmtNum(totalDays)})
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted leading-relaxed">
                        {todayItem.details}
                      </p>
                    </label>
                  </div>

                  {todayItem.done && (
                    <div className="rounded-xl bg-emerald-100/60 p-3 text-center text-xs font-semibold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
                      تقبّل الله طاعتك! تم إنجاز ورد الختمة المقرر لليوم بنجاح.
                    </div>
                  )}
                </div>
              ) : (
                <EmptyState
                  title="لا يوجد ورد مجدول"
                  sub="حدد مقدار محفوظك وعدد أيام الختمة من تبويب «المحفوظ والخطة» لتبدأ."
                />
              )}
            </CardBody>
          </Card>

          {/* Weak Parts Due Today */}
          <Card>
            <CardHead
              title="المواضع الضعيفة المستحقة للمراجعة اليوم"
              sub="تكرار متباعد لتثبيت المتشابهات والمواضع الصعبة"
              action={
                <span className="text-xs font-bold text-muted">
                  {fmtNum(dueWeakParts.length)} مواضع
                </span>
              }
            />
            <CardBody>
              {dueWeakParts.length === 0 ? (
                <EmptyState
                  title="لا توجد مواضع مستحقة اليوم"
                  sub="ممتاز! جميع المواضع الضعيفة مراجعة وفي مواعيدها. يمكنك إضافة مواضع جديدة من تبويب «المواضع الضعيفة»."
                />
              ) : (
                <div className="flex flex-col gap-2.5">
                  {dueWeakParts.map((wp) => (
                    <div
                      key={wp.id}
                      className="flex flex-col gap-2 rounded-2xl border border-line bg-surface2/50 p-3.5 transition"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{wp.title}</span>
                          <button
                            onClick={() => handleToggleStage(wp.id)}
                            title="انقر لتبديل طريقة المراجعة (نظراً أو غيباً)"
                            className={cx(
                              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold transition',
                              wp.stage === 'sight'
                                ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
                            )}
                          >
                            <Icon name={wp.stage === 'sight' ? 'eye' : 'book'} size={11} />
                            {wp.stage === 'sight' ? 'بالنظر أولاً' : 'غيباً'}
                          </button>
                        </div>
                        <span className="text-[11px] text-muted">
                          تكرار #{fmtNum(wp.repetitionCount + 1)} • كل {fmtNum(wp.intervalDays)} يوم
                        </span>
                      </div>

                      {wp.notes && (
                        <p className="text-xs text-muted/90 bg-surface/70 rounded-lg p-2">
                          {wp.notes}
                        </p>
                      )}

                      <div className="mt-1 flex flex-wrap items-center justify-between gap-2 border-t border-line/60 pt-2">
                        <span className="text-xs font-semibold text-muted">
                          قيّم مراجعتك لجدولة الموعد القادم:
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleRateWeakPart(wp.id, 'hard')}
                            className="rounded-lg bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700 hover:bg-red-200 transition dark:bg-red-950/60 dark:text-red-300"
                          >
                            صعب (+1 يوم)
                          </button>
                          <button
                            onClick={() => handleRateWeakPart(wp.id, 'ok')}
                            className="rounded-lg bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700 hover:bg-amber-200 transition dark:bg-amber-950/60 dark:text-amber-300"
                          >
                            مقبول (+{fmtNum(wp.intervalDays <= 1 ? 3 : wp.intervalDays <= 3 ? 7 : 14)} يوم)
                          </button>
                          <button
                            onClick={() => handleRateWeakPart(wp.id, 'easy')}
                            className="rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-200 transition dark:bg-emerald-950/60 dark:text-emerald-300"
                          >
                            سهل (+{fmtNum(wp.intervalDays <= 1 ? 7 : wp.intervalDays <= 3 ? 14 : 21)} يوم)
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. KHATMA PLAN TABLE (جدول الختمة)                                       */}
      {/* ========================================================================= */}
      {activeTab === 'khatma' && (
        <Card className="mt-4">
          <CardHead
            title="جدول أيام الختمة الكامل"
            sub={`إجمالي ${fmtNum(days.length)} يوماً • مكتمل منها ${fmtNum(completedDays)} يوماً`}
            action={
              <Btn variant="outline" size="sm" onClick={() => setActiveTab('config')}>
                <Icon name="pen" size={13} className="me-1" /> تعديل الخطة
              </Btn>
            }
          />
          <CardBody>
            {days.length === 0 ? (
              <EmptyState
                title="الجدول غير منشأ بعد"
                sub="اضغط على «المحفوظ والخطة» لحساب وتوليد جدول الختمة."
              />
            ) : (
              <div className="flex flex-col gap-2">
                {days.map((d) => {
                  const isToday = d.date === today;
                  const isPast = d.date < today;
                  return (
                    <div
                      key={d.id}
                      className={cx(
                        'flex items-center gap-3 rounded-xl border px-3.5 py-2.5 transition',
                        d.done
                          ? 'border-emerald-200 bg-emerald-50/40 dark:border-emerald-900/30 dark:bg-emerald-950/20'
                          : isToday
                          ? 'border-primary/50 bg-primarysoft/20 shadow-soft'
                          : isPast
                          ? 'border-amber-200 bg-amber-50/30 dark:border-amber-900/30 dark:bg-amber-950/20'
                          : 'border-line/70 bg-surface2/40',
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={d.done}
                        onChange={() => handleToggleDay(d.id)}
                        className="h-5 w-5 shrink-0 cursor-pointer rounded accent-[rgb(var(--c-primary))]"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-muted">
                            اليوم {fmtNum(d.dayIndex)}
                          </span>
                          <span className="font-bold leading-tight">{d.title}</span>
                          {isToday && (
                            <span className="rounded-full bg-primary px-2 py-0.2 text-[10px] font-bold text-white">
                              اليوم
                            </span>
                          )}
                          {isPast && !d.done && (
                            <span className="rounded-full bg-amber-200 px-1.5 py-0.2 text-[10px] font-bold text-amber-900 dark:bg-amber-900 dark:text-amber-200">
                              فائت
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-muted">{d.details}</p>
                      </div>
                      <span className="shrink-0 text-xs text-muted">
                        {fmtDateAr(d.date)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* 3. WEAK PARTS & SPACED REPETITION (المواضع الضعيفة)                     */}
      {/* ========================================================================= */}
      {activeTab === 'weak' && (
        <div className="mt-4 flex flex-col gap-4">
          {/* Add Weak Part Card */}
          <Card>
            <CardHead
              title="إضافة موضع ضعيف جديد"
              sub="حدد السورة أو الربع أو الجزء لتثبيته بنظام التكرار المتباعد"
            />
            <CardBody>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-bold text-muted">نوع الموضع</label>
                  <Select
                    value={weakType}
                    onChange={(e) => setWeakType(e.target.value as WeakPartType)}
                  >
                    <option value="surah">سورة كاملة</option>
                    <option value="juz">جزء كامل</option>
                    <option value="rub">ربع حزب</option>
                    <option value="custom">موضع مخصص (نص حر)</option>
                  </Select>
                </div>

                {weakType === 'surah' && (
                  <div>
                    <label className="mb-1 block text-xs font-bold text-muted">اختر السورة</label>
                    <Select
                      value={weakSurah}
                      onChange={(e) => setWeakSurah(Number(e.target.value))}
                    >
                      {SURAHS.map((s) => (
                        <option key={s.number} value={s.number}>
                          {s.number}. {s.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                )}

                {weakType === 'juz' && (
                  <div>
                    <label className="mb-1 block text-xs font-bold text-muted">اختر الجزء</label>
                    <Select
                      value={weakJuz}
                      onChange={(e) => setWeakJuz(Number(e.target.value))}
                    >
                      {Array.from({ length: 30 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>
                          الجزء {fmtNum(i + 1)}
                        </option>
                      ))}
                    </Select>
                  </div>
                )}

                {weakType === 'rub' && (
                  <>
                    <div>
                      <label className="mb-1 block text-xs font-bold text-muted">الجزء</label>
                      <Select
                        value={weakRubJuz}
                        onChange={(e) => setWeakRubJuz(Number(e.target.value))}
                      >
                        {Array.from({ length: 30 }, (_, i) => (
                          <option key={i + 1} value={i + 1}>
                            الجزء {fmtNum(i + 1)}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold text-muted">الربع</label>
                      <Select
                        value={weakRubIndex}
                        onChange={(e) => setWeakRubIndex(Number(e.target.value))}
                      >
                        {RUB_OPTIONS.map((name, idx) => (
                          <option key={idx} value={idx}>
                            {name}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </>
                )}

                {weakType === 'custom' && (
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-bold text-muted">عنوان الموضع</label>
                    <Input
                      placeholder="مثال: أواخر سورة البقرة، أو قصة موسى في سورة طه..."
                      value={weakCustomTitle}
                      onChange={(e) => setWeakCustomTitle(e.target.value)}
                    />
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-xs font-bold text-muted">مرحلة المراجعة</label>
                  <Select
                    value={weakStage}
                    onChange={(e) => setWeakStage(e.target.value as WeakPartStage)}
                  >
                    <option value="sight">نظراً من المصحف أولاً (تثبيت وقراءة)</option>
                    <option value="memory">عن ظهر قلب (مراجعة غيباً)</option>
                  </Select>
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-bold text-muted">ملاحظات / سبب الصعوبة (اختياري)</label>
                  <Input
                    placeholder="مثال: تشابه الآية مع سورة الأعراف، أو ضبط أواخر الآيات..."
                    value={weakNotes}
                    onChange={(e) => setWeakNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="mt-3 flex justify-end">
                <Btn onClick={handleAddWeakPart}>
                  <Icon name="plus" size={15} className="me-1" /> إضافة إلى جدول التكرار المتباعد
                </Btn>
              </div>
            </CardBody>
          </Card>

          {/* List of Weak Parts */}
          <Card>
            <CardHead
              title="جميع المواضع الضعيفة المسجلة"
              sub={`المجموع: ${fmtNum(weakParts.length)} موضع`}
            />
            <CardBody>
              {weakParts.length === 0 ? (
                <EmptyState
                  title="لا توجد مواضع ضعيفة مسجلة"
                  sub="أضف أي سورة أو ربع أو جزء تجد فيه ضعفاً أو صعوبة لتثبيته تدريجياً."
                />
              ) : (
                <div className="flex flex-col gap-3">
                  {weakParts.map((wp) => {
                    const isDue = wp.nextReviewDate <= today;
                    return (
                      <div
                        key={wp.id}
                        className={cx(
                          'flex flex-col gap-2 rounded-2xl border p-3.5 transition sm:flex-row sm:items-center sm:justify-between',
                          isDue
                            ? 'border-primary/40 bg-primarysoft/15'
                            : 'border-line/70 bg-surface2/40',
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm">{wp.title}</span>
                            <button
                              onClick={() => handleToggleStage(wp.id)}
                              className={cx(
                                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold transition',
                                wp.stage === 'sight'
                                  ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
                              )}
                            >
                              <Icon name={wp.stage === 'sight' ? 'eye' : 'book'} size={11} />
                              {wp.stage === 'sight' ? 'بالنظر' : 'غيباً'}
                            </button>
                            {isDue && (
                              <span className="rounded-full bg-primary px-2 py-0.5 text-[9px] font-bold text-white">
                                مستحق اليوم
                              </span>
                            )}
                          </div>
                          {wp.notes && (
                            <p className="mt-1 text-xs text-muted">{wp.notes}</p>
                          )}
                          <p className="mt-1 text-[11px] text-muted">
                            الموعد القادم: {fmtDateAr(wp.nextReviewDate)} • الفاصل الحالي: {fmtNum(wp.intervalDays)} يوم • عدد التكرارات: {fmtNum(wp.repetitionCount)}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 self-end sm:self-center">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleRateWeakPart(wp.id, 'hard')}
                              title="تقييم: صعب (+1 يوم)"
                              className="rounded-lg bg-red-100 px-2 py-1 text-xs font-bold text-red-700 hover:bg-red-200 dark:bg-red-950/60 dark:text-red-300"
                            >
                              صعب
                            </button>
                            <button
                              onClick={() => handleRateWeakPart(wp.id, 'ok')}
                              title="تقييم: مقبول"
                              className="rounded-lg bg-amber-100 px-2 py-1 text-xs font-bold text-amber-700 hover:bg-amber-200 dark:bg-amber-950/60 dark:text-amber-300"
                            >
                              مقبول
                            </button>
                            <button
                              onClick={() => handleRateWeakPart(wp.id, 'easy')}
                              title="تقييم: سهل"
                              className="rounded-lg bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300"
                            >
                              سهل
                            </button>
                          </div>
                          <IconButton
                            label="حذف الموضع"
                            name="trash"
                            size={14}
                            className="text-muted hover:text-red-600"
                            onClick={() => handleRemoveWeakPart(wp.id)}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. CONFIG & MEMORIZED AMOUNT (المحفوظ والخطة)                             */}
      {/* ========================================================================= */}
      {activeTab === 'config' && (
        <div className="mt-4 flex flex-col gap-4">
          <Card>
            <CardHead
              title="تحديد المقدار المحفوظ"
              sub="حدد كم تحفظ من القرآن الكريم ليتم توزيعه على الختمة"
            />
            <CardBody>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold text-muted">طريقة تحديد المحفوظ</label>
                  <Select
                    value={scopeType}
                    onChange={(e) => setScopeType(e.target.value as MemorizedScope['type'])}
                  >
                    <option value="ajza">عدد الأجزاء (مثلاً: 10 أجزاء)</option>
                    <option value="surahs">نطاق سور محدد (من سورة إلى سورة)</option>
                    <option value="pages">نطاق صفحات المصحف</option>
                  </Select>
                </div>

                {scopeType === 'ajza' && (
                  <>
                    <div>
                      <label className="mb-1 block text-xs font-bold text-muted">عدد الأجزاء المحفوظة</label>
                      <Input
                        type="number"
                        min={1}
                        max={30}
                        value={ajzaCount}
                        onChange={(e) => setAjzaCount(Math.max(1, Math.min(30, Number(e.target.value))))}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold text-muted">جهة المحفوظ</label>
                      <Select
                        value={ajzaStart}
                        onChange={(e) => setAjzaStart(e.target.value as MemorizedScope['ajzaStart'])}
                      >
                        <option value="start">من بداية المصحف (من الفاتحة تصاعدياً)</option>
                        <option value="end">من نهاية المصحف (من جزء عم تنازلياً)</option>
                        <option value="custom">نطاق أجزاء مخصص</option>
                      </Select>
                    </div>
                    {ajzaStart === 'custom' && (
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="mb-1 block text-xs font-bold text-muted">من الجزء</label>
                          <Input
                            type="number"
                            min={1}
                            max={30}
                            value={customFromJuz}
                            onChange={(e) => setCustomFromJuz(Number(e.target.value))}
                          />
                        </div>
                        <div className="flex-1">
                          <label className="mb-1 block text-xs font-bold text-muted">إلى الجزء</label>
                          <Input
                            type="number"
                            min={1}
                            max={30}
                            value={customToJuz}
                            onChange={(e) => setCustomToJuz(Number(e.target.value))}
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}

                {scopeType === 'surahs' && (
                  <>
                    <div>
                      <label className="mb-1 block text-xs font-bold text-muted">من سورة</label>
                      <Select
                        value={fromSurah}
                        onChange={(e) => setFromSurah(Number(e.target.value))}
                      >
                        {SURAHS.map((s) => (
                          <option key={s.number} value={s.number}>
                            {s.number}. {s.name}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold text-muted">إلى سورة</label>
                      <Select
                        value={toSurah}
                        onChange={(e) => setToSurah(Number(e.target.value))}
                      >
                        {SURAHS.map((s) => (
                          <option key={s.number} value={s.number}>
                            {s.number}. {s.name}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </>
                )}

                {scopeType === 'pages' && (
                  <>
                    <div>
                      <label className="mb-1 block text-xs font-bold text-muted">من صفحة</label>
                      <Input
                        type="number"
                        min={1}
                        max={604}
                        value={fromPage}
                        onChange={(e) => setFromPage(Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold text-muted">إلى صفحة</label>
                      <Input
                        type="number"
                        min={1}
                        max={604}
                        value={toPage}
                        onChange={(e) => setToPage(Number(e.target.value))}
                      />
                    </div>
                  </>
                )}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHead
              title="مدة الختمة وسياسة الأيام الفائتة"
              sub="كم يوماً تريد لإنهاء مراجعة هذا المقدار بالكامل؟"
            />
            <CardBody>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold text-muted">
                    عدد أيام الختمة (مثلاً ٧ أيام)
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={120}
                    value={targetDays}
                    onChange={(e) => setTargetDays(Math.max(1, Number(e.target.value)))}
                  />
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {[3, 5, 7, 10, 15, 30].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setTargetDays(d)}
                        className={cx(
                          'rounded-lg px-2.5 py-1 text-xs font-semibold transition',
                          targetDays === d
                            ? 'bg-primary text-white'
                            : 'bg-surface2 text-muted hover:text-ink',
                        )}
                      >
                        {fmtNum(d)} أيام
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-muted">
                    السياسة الافتراضية عند تفويت يوم
                  </label>
                  <Select
                    value={policy}
                    onChange={(e) => setPolicy(e.target.value as MissedDaysPolicy)}
                  >
                    <option value="delayEnd">تأجيل موعد الختام (الحفاظ على المقدار اليومي ثابتاً)</option>
                    <option value="recalculateDaily">زيادة المقدار اليومي (إنهاء الختمة في موعدها الأصلي)</option>
                  </Select>
                  <p className="mt-1 text-[11px] text-muted">
                    في كلتا الحالتين، لا يتم تخطي أي جزء ويُعرض عليك الخياران دائماً عند حدوث تأخير.
                  </p>
                </div>
              </div>

              {/* Summary and Recalculate Preview */}
              <div className="mt-4 rounded-2xl border border-line bg-surface2/60 p-4">
                <p className="text-xs font-bold text-muted">معاينة الحساب:</p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
                  <div>
                    <span className="text-muted">المقدار المحفوظ:</span>
                    <p className="font-bold text-ink">{previewInfo.summary}</p>
                  </div>
                  <div>
                    <span className="text-muted">إجمالي الصفحات:</span>
                    <p className="font-bold text-ink">{fmtNum(previewInfo.totalPages)} صفحة</p>
                  </div>
                  <div>
                    <span className="text-muted">المعدل اليومي:</span>
                    <p className="font-bold text-primary">
                      نحو {fmtNum(Math.ceil(previewInfo.totalPages / Math.max(1, targetDays)))} صفحة يومياً
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <Btn onClick={handleSavePlan} size="lg">
                  <Icon name="check" size={16} className="me-1.5" /> حفظ الخطة والبدء من اليوم
                </Btn>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}
