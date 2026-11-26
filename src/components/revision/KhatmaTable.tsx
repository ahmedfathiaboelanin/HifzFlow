// جدول الأيام بالكامل مرتب تصاعدياً بترتيب الأيام (اليوم ١، اليوم ٢، اليوم ٣...)
import { useMemo } from 'react';
import type { ScheduleDayItem } from '../../lib/types';
import { cx, fmtDateAr, fmtNum } from '../../lib/utils';
import { Card, CardHead } from '../ui';
import { Icon } from '../icons';

interface KhatmaTableProps {
  days: ScheduleDayItem[];
  today: string;
  onToggleDay: (id: string) => void;
}

export function KhatmaTable({ days, today, onToggleDay }: KhatmaTableProps) {
  // فرز الأيام دائماً بترتيب اليوم (اليوم ١، ٢، ٣...) تصاعدياً
  const sortedDays = useMemo(() => {
    return [...days].sort((a, b) => a.dayIndex - b.dayIndex);
  }, [days]);

  if (sortedDays.length === 0) return null;

  return (
    <Card>
      <CardHead
        title="جدول الأيام بالكامل"
        sub="تفصيل ورد كل يوم من بداية الختمة إلى نهايتها مرتباً بالأيام. يمكنك تعليم أي يوم كمكتمل."
      />
      <div className="max-h-[500px] overflow-y-auto">
        <table className="w-full border-collapse text-xs">
          <thead className="sticky top-0 bg-surface2 text-muted shadow-sm">
            <tr className="border-b border-line text-start">
              <th className="px-3 py-2 text-start">اليوم</th>
              <th className="px-3 py-2 text-start">التاريخ</th>
              <th className="px-3 py-2 text-start">المقدار</th>
              <th className="px-3 py-2 text-start">الصفحات</th>
              <th className="px-3 py-2 text-center">الإنجاز</th>
            </tr>
          </thead>
          <tbody>
            {sortedDays.map((d) => {
              const isToday = d.date === today;
              return (
                <tr
                  key={d.id}
                  className={cx(
                    'border-b border-line transition hover:bg-surface2/50',
                    isToday ? 'bg-primarysoft/30 font-semibold' : '',
                    d.done ? 'opacity-70 bg-surface2/20' : '',
                  )}
                >
                  <td className="px-3 py-2.5">
                    <span className="font-bold">اليوم {fmtNum(d.dayIndex)}</span>
                    {isToday && (
                      <span className="ms-1.5 rounded bg-primary px-1.5 py-0.5 text-[10px] text-white">
                        اليوم
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-muted">{fmtDateAr(d.date)}</td>
                  <td className="px-3 py-2.5">
                    <p className="font-bold">{d.title}</p>
                    <p className="text-[11px] text-muted">{d.details}</p>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="rounded bg-surface2 px-1.5 py-0.5 font-mono text-[11px]">
                      {fmtNum(d.pageCount)} ص
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <button
                      type="button"
                      onClick={() => onToggleDay(d.id)}
                      className={cx(
                        'inline-flex h-7 w-7 items-center justify-center rounded-lg border transition',
                        d.done
                          ? 'border-emerald-500 bg-emerald-500 text-white'
                          : 'border-line bg-surface hover:border-primary/40',
                      )}
                      title={d.done ? 'مكتمل' : 'غير مكتمل'}
                    >
                      {d.done && <Icon name="check" size={14} />}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
