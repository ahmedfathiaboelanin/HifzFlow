// بطاقة ورد مراجعة اليوم الخاصة بجدول الختمة
import type { ScheduleDayItem } from '../../lib/types';
import { cx, fmtDateAr, fmtNum } from '../../lib/utils';
import { Badge, Card, CardBody, CardHead } from '../ui';
import { Icon } from '../icons';

interface TodayKhatmaCardProps {
  todayItem: ScheduleDayItem;
  totalDays: number;
  currentDayIndex: number;
  onToggleDay: (id: string) => void;
}

export function TodayKhatmaCard({
  todayItem,
  totalDays,
  currentDayIndex,
  onToggleDay,
}: TodayKhatmaCardProps) {
  return (
    <Card className="border-primary/40 bg-gradient-to-b from-primarysoft/30 to-surface shadow-md">
      <CardHead
        title={`ورد مراجعة اليوم (اليوم ${fmtNum(currentDayIndex)} من ${fmtNum(totalDays)})`}
        sub={fmtDateAr(todayItem.date)}
        action={
          <Badge tone={todayItem.done ? 'ok' : 'warn'} dot>
            {todayItem.done ? 'تمت مراجعة اليوم ✓' : 'مستحق للمراجعة'}
          </Badge>
        }
      />
      <CardBody className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xl font-bold text-ink">{todayItem.title}</p>
            <p className="text-sm text-muted">{todayItem.details}</p>
          </div>

          <div>
            <button
              type="button"
              onClick={() => onToggleDay(todayItem.id)}
              className={cx(
                'flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition shadow-sm',
                todayItem.done
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'border-2 border-primary bg-primary text-white hover:brightness-105 active:scale-95',
              )}
            >
              <Icon name={todayItem.done ? 'check-circle' : 'check'} size={18} />
              {todayItem.done ? 'تمت المراجعة (إلغاء التحديد)' : 'تحديد كمكتمل اليوم'}
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-line bg-surface p-3 text-xs text-muted flex items-center justify-between">
          <span>
            المقدار لليوم: <strong>{fmtNum(todayItem.pageCount)} صفحة</strong>
          </span>
          <span>
            {todayItem.startPage === todayItem.endPage
              ? `صفحة ${fmtNum(todayItem.startPage)}`
              : `من صفحة ${fmtNum(todayItem.startPage)} إلى ${fmtNum(todayItem.endPage)}`}
          </span>
        </div>
      </CardBody>
    </Card>
  );
}
