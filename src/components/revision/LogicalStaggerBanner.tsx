// شريط التوزيع المنطقي للأجزاء الضعيفة
import { cx, fmtNum } from '../../lib/utils';
import { Btn, Card, CardBody } from '../ui';
import { Icon } from '../icons';

interface LogicalStaggerBannerProps {
  dailyQuota: number;
  setDailyQuota: (q: number) => void;
  onRestaggerAll: () => void;
}

export function LogicalStaggerBanner({
  dailyQuota,
  setDailyQuota,
  onRestaggerAll,
}: LogicalStaggerBannerProps) {
  return (
    <Card className="border-primary/30 bg-primarysoft/30">
      <CardBody className="space-y-2">
        <div className="flex items-start gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary text-white">
            <Icon name="target" size={17} />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-sm text-ink">التوزيع المنطقي للأجزاء الضعيفة مفعّل</h3>
            <p className="mt-0.5 text-xs text-muted leading-relaxed">
              إذا كان لديك عدة سور أو أجزاء ضعيفة، <strong>لا يتم تكديسها في يوم واحد</strong>، بل تُقسّم وتُوزّع تلقائياً بمعدل ({fmtNum(dailyQuota)} مقطع يومياً) لضمان التركيز والتثبيت المتين.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-primary/20">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted">معدل الإدخال اليومي:</span>
            <button
              type="button"
              onClick={() => setDailyQuota(1)}
              className={cx(
                'rounded-lg px-2.5 py-1 font-semibold transition',
                dailyQuota === 1 ? 'bg-primary text-white' : 'bg-surface text-ink hover:bg-surface2',
              )}
            >
              مقطع واحد يومياً (مستحسن)
            </button>
            <button
              type="button"
              onClick={() => setDailyQuota(2)}
              className={cx(
                'rounded-lg px-2.5 py-1 font-semibold transition',
                dailyQuota === 2 ? 'bg-primary text-white' : 'bg-surface text-ink hover:bg-surface2',
              )}
            >
              مقطعان يومياً
            </button>
          </div>

          <Btn size="sm" variant="outline" onClick={onRestaggerAll}>
            <Icon name="refresh" size={13} className="me-1" />
            إعادة التوزيع المنطقي
          </Btn>
        </div>
      </CardBody>
    </Card>
  );
}
