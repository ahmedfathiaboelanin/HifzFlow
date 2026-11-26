// Revision (المراجعة):
// صفحة المراجعة الرئيسية مقسمة إلى مكونات مستقلة:
// ١. تقسيم المحفوظ على عدد الأيام (KhatmaSection)
// ٢. تثبيت الأجزاء الضعيفة بالتكرار المتباعد (WeakPartsSection)
import { useEffect, useMemo, useState } from 'react';
import { fmtNum, todayStr } from '../lib/utils';
import { PageHeader, Tabs } from '../components/ui';
import { useAppSelector } from '../store/store';
import { syncScheduleTasks } from '../store/store';
import { KhatmaSection } from '../components/revision/KhatmaSection';
import { WeakPartsSection } from '../components/revision/WeakPartsSection';

export function Revision() {
  const schedule = useAppSelector((s) => s.schedule);
  const progressEntries = useAppSelector((s) => s.progress.entries);
  const config = schedule.config;
  const days = schedule.days;
  const weakParts = schedule.weakParts;

  const [activeTab, setActiveTab] = useState<'khatma' | 'weak'>('khatma');
  const today = todayStr();

  // Sync revision due items to daily tasks on mount
  useEffect(() => {
    syncScheduleTasks();
  }, []);

  // Due weak parts count for tab badge
  const dueWeakCount = useMemo(() => {
    return weakParts.filter((wp) => wp.nextReviewDate <= today).length;
  }, [weakParts, today]);

  return (
    <div className="space-y-4">
      <PageHeader
        icon="repeat"
        title="المراجعة"
        sub="تقسيم المحفوظ على عدد الأيام وتثبيت الأجزاء الضعيفة بالتكرار المتباعد والتوزيع المنطقي."
      />

      <Tabs
        tabs={[
          {
            id: 'khatma',
            label: 'تقسيم المحفوظ على الأيام',
          },
          {
            id: 'weak',
            label: `تثبيت الأجزاء الضعيفة${dueWeakCount > 0 ? ` (${fmtNum(dueWeakCount)})` : ''}`,
          },
        ]}
        value={activeTab}
        onChange={(t) => setActiveTab(t as 'khatma' | 'weak')}
      />

      {activeTab === 'khatma' && (
        <KhatmaSection
          config={config}
          days={days}
          progressEntries={progressEntries}
          today={today}
        />
      )}

      {activeTab === 'weak' && (
        <WeakPartsSection
          weakParts={weakParts}
          progressEntries={progressEntries}
          today={today}
        />
      )}
    </div>
  );
}
