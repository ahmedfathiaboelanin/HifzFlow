// طابور التوزيع المنطقي والجدول الزمني للأجزاء الضعيفة
import type { WeakPartItem } from '../../lib/types';
import { daysUntil, fmtDateAr, fmtNum } from '../../lib/utils';
import { Badge, Card, CardHead } from '../ui';

interface WeakTimelineQueueProps {
  timelineQueue: WeakPartItem[];
  onDeleteWeakPart: (id: string) => void;
}

export function WeakTimelineQueue({
  timelineQueue,
  onDeleteWeakPart,
}: WeakTimelineQueueProps) {
  if (timelineQueue.length === 0) return null;

  return (
    <Card>
      <CardHead
        title="طابور التوزيع المنطقي للضعيف (الجدول الزمني)"
        sub="يعرض كيف تم توزيع الأجزاء الضعيفة على الأيام القادمة بالعدل لمنع التشتت."
      />
      <div className="max-h-72 overflow-y-auto">
        <ul className="divide-y divide-line text-xs">
          {timelineQueue.map((item) => {
            const diff = daysUntil(item.nextReviewDate) ?? 0;
            let timeBadge = '';
            let tone: 'soft' | 'warn' | 'ok' | 'danger' = 'soft';

            if (diff < 0) {
              timeBadge = `متأخر منذ ${fmtNum(Math.abs(diff))} يوم`;
              tone = 'danger';
            } else if (diff === 0) {
              timeBadge = 'مستحق اليوم';
              tone = 'warn';
            } else if (diff === 1) {
              timeBadge = 'غداً';
              tone = 'soft';
            } else if (diff === 2) {
              timeBadge = 'بعد يومين';
              tone = 'soft';
            } else {
              timeBadge = `بعد ${fmtNum(diff)} أيام`;
              tone = 'soft';
            }

            return (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 hover:bg-surface2/50 transition"
              >
                <div className="min-w-0 space-y-0.5">
                  <p className="font-bold text-ink">{item.title}</p>
                  <p className="text-muted text-[11px]">
                    {item.stage === 'sight' ? 'بالنظر' : 'غيباً'} • {fmtDateAr(item.nextReviewDate)}
                    {item.repetitionCount > 0
                      ? ` • أُنجز ${fmtNum(item.repetitionCount)} تكرارات`
                      : ' • ينتظر البدء'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Badge tone={tone}>{timeBadge}</Badge>
                  <button
                    type="button"
                    onClick={() => onDeleteWeakPart(item.id)}
                    className="text-red-500 hover:text-red-700 text-xs px-1"
                    title="حذف"
                  >
                    حذف
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </Card>
  );
}
