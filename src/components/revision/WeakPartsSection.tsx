// القسم الثاني من المراجعة: تثبيت الأجزاء الضعيفة بالتكرار المتباعد
import { useMemo, useState } from 'react';
import { SURAHS } from '../../data/mushaf';
import { staggerWeakParts } from '../../lib/schedule';
import { hapticSuccess, hapticTap } from '../../lib/pwa';
import type {
  ProgressEntry,
  WeakPartItem,
  WeakPartStage,
  WeakPartType,
  WeakRating,
} from '../../lib/types';
import { fmtNum, uid } from '../../lib/utils';
import { progressSlice, scheduleSlice } from '../../store/slices';
import { syncScheduleTasks, useAppDispatch } from '../../store/store';
import { LogicalStaggerBanner } from './LogicalStaggerBanner';
import { WeakDueList } from './WeakDueList';
import { WeakTimelineQueue } from './WeakTimelineQueue';
import { AddWeakPartForm } from './AddWeakPartForm';

interface WeakPartsSectionProps {
  weakParts: WeakPartItem[];
  progressEntries: ProgressEntry[];
  today: string;
}

export function WeakPartsSection({
  weakParts,
  progressEntries,
  today,
}: WeakPartsSectionProps) {
  const dispatch = useAppDispatch();
  const [dailyQuota, setDailyQuota] = useState<number>(1);

  // Identify weak entries from progress that are not yet added to weakParts
  const unimportedWeakEntries = useMemo(() => {
    return progressEntries.filter((pe) => {
      if (pe.strength !== 'weak') return false;
      const alreadyAdded = weakParts.some(
        (wp) => wp.type === 'surah' && wp.surahNumber === pe.surah,
      );
      return !alreadyAdded;
    });
  }, [progressEntries, weakParts]);

  // Due weak parts today
  const dueWeakParts = useMemo(() => {
    return weakParts.filter((wp) => wp.nextReviewDate <= today);
  }, [weakParts, today]);

  // Timeline / Logical queue: sorted by nextReviewDate
  const timelineQueue = useMemo(() => {
    return [...weakParts].sort((a, b) =>
      a.nextReviewDate.localeCompare(b.nextReviewDate),
    );
  }, [weakParts]);

  // Handlers
  const handleAddWeakPart = (data: {
    type: WeakPartType;
    surahNumber?: number;
    juzNumber?: number;
    rubName?: string;
    customTitle?: string;
    stage: WeakPartStage;
    notes?: string;
  }) => {
    hapticTap();
    let title = '';
    if (data.type === 'surah' && data.surahNumber) {
      title = `سورة ${SURAHS[data.surahNumber - 1]?.name || data.surahNumber}`;
    } else if (data.type === 'juz' && data.juzNumber) {
      title = `الجزء ${fmtNum(data.juzNumber)}`;
    } else if (data.type === 'rub' && data.rubName) {
      title = `${data.rubName} (الجزء ${fmtNum(data.juzNumber || 1)})`;
    } else {
      title = data.customTitle?.trim() || 'مقطع مخصص';
    }

    const newItem: WeakPartItem = {
      id: uid(),
      title,
      type: data.type,
      surahNumber: data.surahNumber,
      juzNumber: data.juzNumber,
      rubName: data.rubName,
      stage: data.stage,
      intervalDays: 1,
      repetitionCount: 0,
      lastReviewedAt: null,
      lastRating: null,
      nextReviewDate: today,
      notes: data.notes,
      createdAt: new Date().toISOString(),
    };

    const updatedList = staggerWeakParts(
      [...weakParts, newItem],
      today,
      dailyQuota,
    );
    dispatch(scheduleSlice.actions.setWeakParts(updatedList));
    setTimeout(() => syncScheduleTasks(), 0);
  };

  const handleImportFromProgress = () => {
    hapticSuccess();
    const newItems: WeakPartItem[] = unimportedWeakEntries.map((pe) => {
      const s = SURAHS[pe.surah - 1];
      const title = `سورة ${s?.name || pe.surah} (${fmtNum(pe.fromAyah)}–${fmtNum(pe.toAyah)})`;
      return {
        id: uid(),
        title,
        type: 'surah',
        surahNumber: pe.surah,
        stage: 'sight',
        intervalDays: 1,
        repetitionCount: 0,
        lastReviewedAt: null,
        lastRating: null,
        nextReviewDate: today,
        createdAt: new Date().toISOString(),
      };
    });

    const combined = [...weakParts, ...newItems];
    const staggered = staggerWeakParts(combined, today, dailyQuota);
    dispatch(scheduleSlice.actions.setWeakParts(staggered));
    setTimeout(() => syncScheduleTasks(), 0);
  };

  const handleRestaggerAll = () => {
    hapticSuccess();
    const staggered = staggerWeakParts(weakParts, today, dailyQuota);
    dispatch(scheduleSlice.actions.setWeakParts(staggered));
    setTimeout(() => syncScheduleTasks(), 0);
  };

  const handleRate = (id: string, rating: WeakRating) => {
    hapticTap();
    dispatch(scheduleSlice.actions.rateWeakPart({ id, rating }));
    setTimeout(() => syncScheduleTasks(), 0);
  };

  const handleToggleStage = (id: string) => {
    hapticTap();
    dispatch(scheduleSlice.actions.toggleWeakPartStage(id));
    setTimeout(() => syncScheduleTasks(), 0);
  };

  const handlePromoteToMedium = (item: WeakPartItem) => {
    hapticSuccess();
    if (item.surahNumber) {
      const linked = progressEntries.find((pe) => pe.surah === item.surahNumber);
      if (linked) {
        dispatch(
          progressSlice.actions.updateEntry({
            id: linked.id,
            patch: { strength: 'medium' },
          }),
        );
      }
    }
    dispatch(scheduleSlice.actions.removeWeakPart(item.id));
    setTimeout(() => syncScheduleTasks(), 0);
  };

  const handleDeleteWeakPart = (id: string) => {
    if (window.confirm('هل تريد حذف هذا الجزء من جدول تثبيت الضعيف؟')) {
      hapticTap();
      dispatch(scheduleSlice.actions.removeWeakPart(id));
      setTimeout(() => syncScheduleTasks(), 0);
    }
  };

  return (
    <div className="space-y-4">
      {/* Banner */}
      <LogicalStaggerBanner
        dailyQuota={dailyQuota}
        setDailyQuota={setDailyQuota}
        onRestaggerAll={handleRestaggerAll}
      />

      {/* Due Weak Parts Today */}
      <WeakDueList
        dueWeakParts={dueWeakParts}
        totalWeakCount={weakParts.length}
        onRate={handleRate}
        onToggleStage={handleToggleStage}
        onPromoteToMedium={handlePromoteToMedium}
      />

      {/* Visual Timeline Queue */}
      <WeakTimelineQueue
        timelineQueue={timelineQueue}
        onDeleteWeakPart={handleDeleteWeakPart}
      />

      {/* Add Weak Part Form */}
      <AddWeakPartForm
        unimportedWeakEntriesCount={unimportedWeakEntries.length}
        onImportFromProgress={handleImportFromProgress}
        onAddWeakPart={handleAddWeakPart}
      />
    </div>
  );
}
