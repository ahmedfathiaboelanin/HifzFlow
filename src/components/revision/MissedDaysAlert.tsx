// تنبيه معالجة الأيام الفائتة في خطة الختمة
import { fmtNum } from '../../lib/utils';
import { Btn, Card, CardBody } from '../ui';
import { Icon } from '../icons';

interface MissedDaysAlertProps {
  missedCount: number;
  onApplyDelay: () => void;
  onApplyRecalculate: () => void;
}

export function MissedDaysAlert({
  missedCount,
  onApplyDelay,
  onApplyRecalculate,
}: MissedDaysAlertProps) {
  return (
    <Card className="border-amber-300 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
      <CardBody className="space-y-2">
        <div className="flex items-start gap-2 text-amber-900 dark:text-amber-200">
          <Icon name="alert" size={18} className="mt-0.5 shrink-0 text-amber-600" />
          <div>
            <p className="font-bold text-sm">
              لديك {fmtNum(missedCount)} أيام فائتة لم يتم تعليم إنجازها
            </p>
            <p className="mt-0.5 text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
              حسب سياستك، لا يتم تفويت أي جزء من المحفوظ. اختر كيف تود متابعة الخطة من اليوم:
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <Btn size="sm" variant="primary" onClick={onApplyDelay}>
            <Icon name="calendar" size={14} className="me-1" />
            ترحيل الخطة للأمام (الحفاظ على نفس الورد اليومي)
          </Btn>
          <Btn size="sm" variant="outline" onClick={onApplyRecalculate}>
            <Icon name="refresh" size={14} className="me-1" />
            إعادة توزيع الباقي على الأيام المتبقية
          </Btn>
        </div>
      </CardBody>
    </Card>
  );
}
