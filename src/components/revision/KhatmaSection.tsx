// القسم الأول من المراجعة: خطة تقسيم المحفوظ على الأيام
import { useMemo, useState } from 'react';
import { SURAHS } from '../../data/mushaf';
import {
  checkMissedDays,
  generateScheduleDays,
  generateScheduleFromPageList,
  resolveMemorizedPages,
} from '../../lib/schedule';
import { hapticSuccess, hapticTap } from '../../lib/pwa';
import type {
  MemorizedScope,
  MemorizedScopeType,
  MissedDaysPolicy,
  ProgressEntry,
  ScheduleConfig,
  ScheduleDayItem,
} from '../../lib/types';
import { fmtNum } from '../../lib/utils';
import { Badge, Btn, Card, CardBody, CardHead, EmptyState, ProgressBar } from '../ui';
import { Icon } from '../icons';
import { scheduleSlice } from '../../store/slices';
import { syncScheduleTasks, useAppDispatch } from '../../store/store';
import { KhatmaConfigForm } from './KhatmaConfigForm';
import { TodayKhatmaCard } from './TodayKhatmaCard';
import { MissedDaysAlert } from './MissedDaysAlert';
import { KhatmaTable } from './KhatmaTable';

interface KhatmaSectionProps {
  config: ScheduleConfig;
  days: ScheduleDayItem[];
  progressEntries: ProgressEntry[];
  today: string;
}

export function KhatmaSection({
  config,
  days,
  progressEntries,
  today,
}: KhatmaSectionProps) {
  const dispatch = useAppDispatch();

  // Form states
  const [scopeType, setScopeType] = useState<MemorizedScopeType>(
    config.memorized.type || 'manual',
  );
  const [manualCount, setManualCount] = useState<number>(
    config.memorized.manualPageCount || 10,
  );
  const [targetDays, setTargetDays] = useState<number>(config.targetDays || 10);
  const [ajzaCount, setAjzaCount] = useState<number>(
    config.memorized.ajzaCount || 10,
  );
  const [ajzaStart, setAjzaStart] = useState<MemorizedScope['ajzaStart']>(
    config.memorized.ajzaStart || 'start',
  );
  const [customFromJuz, setCustomFromJuz] = useState<number>(
    config.memorized.customFromJuz || 1,
  );
  const [customToJuz, setCustomToJuz] = useState<number>(
    config.memorized.customToJuz || 10,
  );
  const [fromSurah, setFromSurah] = useState<number>(
    config.memorized.fromSurah || 1,
  );
  const [toSurah, setToSurah] = useState<number>(config.memorized.toSurah || 9);
  const [fromPage, setFromPage] = useState<number>(
    config.memorized.fromPage || 1,
  );
  const [toPage, setToPage] = useState<number>(config.memorized.toPage || 201);
  const [policy] = useState<MissedDaysPolicy>(
    config.missedDaysPolicy || 'delayEnd',
  );

  const [showConfig, setShowConfig] = useState(days.length === 0);

  // Compute pages from progress entries if selected
  const progressPages = useMemo(() => {
    const pageSet = new Set<number>();
    for (const e of progressEntries) {
      const s = SURAHS[e.surah - 1];
      if (s) {
        for (let p = s.startPage; p <= s.endPage; p++) {
          pageSet.add(p);
        }
      }
    }
    return Array.from(pageSet).sort((a, b) => a - b);
  }, [progressEntries]);

  // Scope preview computation
  const previewScope: MemorizedScope = useMemo(
    () => ({
      type: scopeType,
      manualPageCount: Number(manualCount),
      ajzaCount: Number(ajzaCount),
      ajzaStart,
      customFromJuz: Number(customFromJuz),
      customToJuz: Number(customToJuz),
      fromSurah: Number(fromSurah),
      toSurah: Number(toSurah),
      fromPage: Number(fromPage),
      toPage: Number(toPage),
    }),
    [
      scopeType,
      manualCount,
      ajzaCount,
      ajzaStart,
      customFromJuz,
      customToJuz,
      fromSurah,
      toSurah,
      fromPage,
      toPage,
    ],
  );

  const previewInfo = useMemo(() => {
    if (scopeType === 'progress') {
      return {
        pages: progressPages,
        summary: `سجل الحفظ (${fmtNum(progressPages.length)} صفحة)`,
        totalPages: progressPages.length,
      };
    }
    return resolveMemorizedPages(previewScope);
  }, [scopeType, previewScope, progressPages]);

  const dailyRate = useMemo(() => {
    const total = previewInfo.totalPages;
    const d = Math.max(1, Number(targetDays));
    return total / d;
  }, [previewInfo.totalPages, targetDays]);

  // Khatma progress computations
  const totalDays = days.length;
  const completedDays = days.filter((d) => d.done).length;
  const progressPercent =
    totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

  // Identify today's scheduled portion (strictly sorted)
  const todayItem = useMemo(() => {
    const sorted = [...days].sort((a, b) => a.dayIndex - b.dayIndex);
    const exact = sorted.find((d) => d.date === today);
    if (exact) return exact;
    const firstPending = sorted.find((d) => !d.done);
    return firstPending || sorted[sorted.length - 1] || null;
  }, [days, today]);

  const currentDayIndex = useMemo(() => {
    if (!todayItem) return 1;
    return todayItem.dayIndex;
  }, [todayItem]);

  const missedInfo = useMemo(() => checkMissedDays(days, today), [days, today]);

  // Handlers
  const handleGeneratePlan = () => {
    hapticTap();
    let generatedDays: ScheduleDayItem[] = [];

    if (scopeType === 'progress') {
      generatedDays = generateScheduleFromPageList(
        progressPages,
        targetDays,
        today,
      );
    } else if (scopeType === 'manual') {
      const dummyPages = Array.from(
        { length: Math.max(1, manualCount) },
        (_, i) => i + 1,
      );
      generatedDays = generateScheduleFromPageList(dummyPages, targetDays, today);
    } else {
      generatedDays = generateScheduleDays(previewScope, targetDays, today);
    }

    dispatch(scheduleSlice.actions.setDays(generatedDays));
    dispatch(
      scheduleSlice.actions.updateConfig({
        memorized: previewScope,
        targetDays,
        startDate: today,
        missedDaysPolicy: policy,
      }),
    );
    setShowConfig(false);
    setTimeout(() => syncScheduleTasks(), 0);
  };

  const handleToggleDay = (id: string) => {
    hapticTap();
    dispatch(scheduleSlice.actions.toggleDayDone(id));
    setTimeout(() => syncScheduleTasks(), 0);
  };

  const handleApplyMissedDelay = () => {
    hapticSuccess();
    dispatch(scheduleSlice.actions.applyMissedDaysDelay());
    setTimeout(() => syncScheduleTasks(), 0);
  };

  const handleApplyMissedRecalculate = () => {
    hapticSuccess();
    if (days.length === 0) return;
    const targetEndDate = days[days.length - 1].date;
    dispatch(scheduleSlice.actions.applyMissedDaysRecalculate({ targetEndDate }));
    setTimeout(() => syncScheduleTasks(), 0);
  };

  return (
    <div className="space-y-4">
      {/* Configuration & Setup Card */}
      <Card>
        <CardHead
          title="خطة الختمة وتقسيم المحفوظ"
          sub="حدد مقدار ما تحفظ وعدد الأيام ليتم تقسيمه بالتساوي وتحديد وردك اليومي."
          action={
            days.length > 0 ? (
              <Btn
                size="sm"
                variant={showConfig ? 'soft' : 'outline'}
                onClick={() => setShowConfig(!showConfig)}
              >
                <Icon
                  name={showConfig ? 'chevron-down' : 'more'}
                  size={14}
                  className="me-1"
                />
                {showConfig ? 'إخفاء الإعدادات' : 'تعديل الخطة'}
              </Btn>
            ) : null
          }
        />

        {showConfig && (
          <KhatmaConfigForm
            scopeType={scopeType}
            setScopeType={setScopeType}
            manualCount={manualCount}
            setManualCount={setManualCount}
            targetDays={targetDays}
            setTargetDays={setTargetDays}
            ajzaCount={ajzaCount}
            setAjzaCount={setAjzaCount}
            ajzaStart={ajzaStart}
            setAjzaStart={setAjzaStart}
            customFromJuz={customFromJuz}
            setCustomFromJuz={setCustomFromJuz}
            customToJuz={customToJuz}
            setCustomToJuz={setCustomToJuz}
            fromSurah={fromSurah}
            setFromSurah={setFromSurah}
            toSurah={toSurah}
            setToSurah={setToSurah}
            progressPagesCount={progressPages.length}
            totalPages={previewInfo.totalPages}
            dailyRate={dailyRate}
            today={today}
            onGeneratePlan={handleGeneratePlan}
          />
        )}

        {/* Active plan summary banner */}
        {days.length > 0 && (
          <CardBody>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs text-muted">الخطة الحالية المعتمدة</p>
                <p className="font-bold text-ink">
                  {fmtNum(days.reduce((acc, d) => acc + d.pageCount, 0))} صفحة مقسمة على {fmtNum(days.length)} يوم
                  ({fmtNum(Number((days.reduce((acc, d) => acc + d.pageCount, 0) / days.length).toFixed(1)))} صفحة/يوم تقريباً)
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone="soft">
                  التقدّم: {fmtNum(completedDays)} / {fmtNum(totalDays)} يوم ({fmtNum(progressPercent)}%)
                </Badge>
              </div>
            </div>
            <div className="mt-3">
              <ProgressBar value={progressPercent} />
            </div>
          </CardBody>
        )}
      </Card>

      {/* Missed Days Handler Notice */}
      {missedInfo.hasMissed && (
        <MissedDaysAlert
          missedCount={missedInfo.missedCount}
          onApplyDelay={handleApplyMissedDelay}
          onApplyRecalculate={handleApplyMissedRecalculate}
        />
      )}

      {/* Today's Khatma Portion */}
      {days.length > 0 && todayItem && (
        <TodayKhatmaCard
          todayItem={todayItem}
          totalDays={totalDays}
          currentDayIndex={currentDayIndex}
          onToggleDay={handleToggleDay}
        />
      )}

      {/* Full Day-by-Day Table */}
      {days.length > 0 ? (
        <KhatmaTable
          days={days}
          today={today}
          onToggleDay={handleToggleDay}
        />
      ) : (
        <EmptyState
          title="لم يتم إنشاء خطة الختمة بعد"
          sub="حدد المحفوظ وعدد الأيام في الأعلى واضغط «تطبيق وحفظ الخطة» لتقسيمه وعرض جدول المراجعة اليومي."
        />
      )}
    </div>
  );
}
