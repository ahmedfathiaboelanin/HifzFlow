// قائمة الأجزاء الضعيفة المستحقة اليوم للمراجعة والتقييم
import type { WeakPartItem, WeakRating } from '../../lib/types';
import { cx, fmtNum } from '../../lib/utils';
import { Btn, Card, CardBody, CardHead } from '../ui';

interface WeakDueListProps {
  dueWeakParts: WeakPartItem[];
  totalWeakCount: number;
  onRate: (id: string, rating: WeakRating) => void;
  onToggleStage: (id: string) => void;
  onPromoteToMedium: (item: WeakPartItem) => void;
}

export function WeakDueList({
  dueWeakParts,
  totalWeakCount,
  onRate,
  onToggleStage,
  onPromoteToMedium,
}: WeakDueListProps) {
  return (
    <Card>
      <CardHead
        title={`المستحق اليوم للتثبيت (${fmtNum(dueWeakParts.length)})`}
        sub="راجِع المقطع ثم قيّم صعوبته لتحديد موعد المراجعة القادمة بالتكرار المتباعد."
      />
      <CardBody className="space-y-3">
        {dueWeakParts.length === 0 ? (
          <p className="text-sm text-muted">
            {totalWeakCount === 0
              ? 'لا توجد أجزاء ضعيفة مسجلة بعد. أضف سورة أو مقطعاً في الأسفل لبدء تثبيته.'
              : 'أحسنت! لا توجد أجزاء ضعيفة مستحقة للمراجعة اليوم. موعد المراجعة القادم موضح في طابور التوزيع أدناه.'}
          </p>
        ) : (
          dueWeakParts.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-line bg-surface2/40 p-4 space-y-3 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="text-base font-bold text-ink">{item.title}</h4>
                  <p className="text-xs text-muted">
                    التكرار رقم {fmtNum(item.repetitionCount + 1)} • الفاصل الحالي:{' '}
                    {fmtNum(item.intervalDays)} يوم
                    {item.notes ? ` • ملاحظة: ${item.notes}` : ''}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onToggleStage(item.id)}
                    className={cx(
                      'rounded-full px-2.5 py-1 text-xs font-semibold transition',
                      item.stage === 'sight'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
                    )}
                    title="انقر للتبديل بين النظر والغيب"
                  >
                    {item.stage === 'sight' ? 'قراءة بالنظر 📖' : 'تسميع غيباً 🧠'}
                  </button>
                </div>
              </div>

              {/* Rating Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-line">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-muted">التقييم بعد المراجعة:</span>
                  <Btn
                    size="sm"
                    variant="danger"
                    onClick={() => onRate(item.id, 'hard')}
                    title="يتكرر بعد يوم واحد"
                  >
                    صعب (+١ يوم)
                  </Btn>
                  <Btn
                    size="sm"
                    variant="outline"
                    onClick={() => onRate(item.id, 'ok')}
                    title="يتكرر بعد ٣ أيام"
                  >
                    مقبول (+٣ أيام)
                  </Btn>
                  <Btn
                    size="sm"
                    variant="soft"
                    onClick={() => onRate(item.id, 'easy')}
                    title="يتكرر بعد ٧ أيام"
                  >
                    سهل (+٧ أيام)
                  </Btn>
                </div>

                <Btn
                  size="sm"
                  variant="primary"
                  onClick={() => onPromoteToMedium(item)}
                  title="ترقية السورة إلى مستوى متوسط في جدول الحفظ"
                >
                  ⭐ تم التثبيت (ترقية لمتوسط)
                </Btn>
              </div>
            </div>
          ))
        )}
      </CardBody>
    </Card>
  );
}
