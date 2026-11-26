// نموذج ضبط وتعديل خطة الختمة وتقسيم المحفوظ
import { SURAHS } from '../../data/mushaf';
import type { MemorizedScope, MemorizedScopeType } from '../../lib/types';
import { addDaysStr, cx, fmtDateAr, fmtNum } from '../../lib/utils';
import { Btn, Input, Select } from '../ui';
import { Icon } from '../icons';

interface KhatmaConfigFormProps {
  scopeType: MemorizedScopeType;
  setScopeType: (t: MemorizedScopeType) => void;
  manualCount: number;
  setManualCount: (n: number) => void;
  targetDays: number;
  setTargetDays: (n: number) => void;
  ajzaCount: number;
  setAjzaCount: (n: number) => void;
  ajzaStart: MemorizedScope['ajzaStart'];
  setAjzaStart: (s: MemorizedScope['ajzaStart']) => void;
  customFromJuz: number;
  setCustomFromJuz: (n: number) => void;
  customToJuz: number;
  setCustomToJuz: (n: number) => void;
  fromSurah: number;
  setFromSurah: (n: number) => void;
  toSurah: number;
  setToSurah: (n: number) => void;
  progressPagesCount: number;
  totalPages: number;
  dailyRate: number;
  today: string;
  onGeneratePlan: () => void;
}

export function KhatmaConfigForm({
  scopeType,
  setScopeType,
  manualCount,
  setManualCount,
  targetDays,
  setTargetDays,
  ajzaCount,
  setAjzaCount,
  ajzaStart,
  setAjzaStart,
  customFromJuz,
  setCustomFromJuz,
  customToJuz,
  setCustomToJuz,
  fromSurah,
  setFromSurah,
  toSurah,
  setToSurah,
  progressPagesCount,
  totalPages,
  dailyRate,
  today,
  onGeneratePlan,
}: KhatmaConfigFormProps) {
  return (
    <div className="space-y-4 border-b border-line bg-surface2/30 p-4">
      {/* Scope type selection */}
      <div>
        <label className="text-xs font-bold text-muted">طريقة تحديد المحفوظ</label>
        <div className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <button
            type="button"
            onClick={() => setScopeType('manual')}
            className={cx(
              'rounded-xl border p-2.5 text-start text-xs transition',
              scopeType === 'manual'
                ? 'border-primary bg-primarysoft font-bold text-primary shadow-sm'
                : 'border-line bg-surface hover:bg-surface2 text-ink',
            )}
          >
            <p className="font-bold">إدخال مباشر (صفحات)</p>
            <p className="text-[11px] text-muted">مثل: ١٠ صفحات</p>
          </button>

          <button
            type="button"
            onClick={() => setScopeType('progress')}
            className={cx(
              'rounded-xl border p-2.5 text-start text-xs transition',
              scopeType === 'progress'
                ? 'border-primary bg-primarysoft font-bold text-primary shadow-sm'
                : 'border-line bg-surface hover:bg-surface2 text-ink',
            )}
          >
            <p className="font-bold">من سجل الحفظ</p>
            <p className="text-[11px] text-muted">
              المحفوظ بالتطبيق ({fmtNum(progressPagesCount)} ص)
            </p>
          </button>

          <button
            type="button"
            onClick={() => setScopeType('ajza')}
            className={cx(
              'rounded-xl border p-2.5 text-start text-xs transition',
              scopeType === 'ajza'
                ? 'border-primary bg-primarysoft font-bold text-primary shadow-sm'
                : 'border-line bg-surface hover:bg-surface2 text-ink',
            )}
          >
            <p className="font-bold">بالأجزاء</p>
            <p className="text-[11px] text-muted">مثل: ١٠ أجزاء</p>
          </button>

          <button
            type="button"
            onClick={() => setScopeType('surahs')}
            className={cx(
              'rounded-xl border p-2.5 text-start text-xs transition',
              scopeType === 'surahs'
                ? 'border-primary bg-primarysoft font-bold text-primary shadow-sm'
                : 'border-line bg-surface hover:bg-surface2 text-ink',
            )}
          >
            <p className="font-bold">بالسور</p>
            <p className="text-[11px] text-muted">من سورة إلى سورة</p>
          </button>
        </div>
      </div>

      {/* Scope Inputs */}
      {scopeType === 'manual' && (
        <div className="rounded-xl border border-line bg-surface p-3">
          <label className="text-xs font-bold text-muted">
            كم صفحة تحفظ؟ (إدخال مباشر)
          </label>
          <div className="mt-1.5 flex items-center gap-3">
            <Input
              type="number"
              min={1}
              max={604}
              value={manualCount}
              onChange={(e) => setManualCount(Math.max(1, Number(e.target.value)))}
              className="w-32 text-center text-base font-bold"
            />
            <span className="text-sm font-semibold text-muted">صفحة محفوظة</span>
          </div>
        </div>
      )}

      {scopeType === 'progress' && (
        <div className="rounded-xl border border-line bg-surface p-3 text-xs leading-relaxed text-muted">
          {progressPagesCount > 0 ? (
            <p>
              تم استيراد <strong className="font-bold text-ink">{fmtNum(progressPagesCount)} صفحة</strong> من السور المسجلة في جدول الحفظ لديك. سيتم تقسيمها بالتساوي على الأيام المحددة.
            </p>
          ) : (
            <p className="text-amber-600 dark:text-amber-400">
              لم تقم بتسجيل أي سور في صفحة الحفظ بعد. يمكنك استخدام خيار «إدخال مباشر (صفحات)» لكتابة عدد الصفحات مباشرة.
            </p>
          )}
        </div>
      )}

      {scopeType === 'ajza' && (
        <div className="grid grid-cols-1 gap-3 rounded-xl border border-line bg-surface p-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-bold text-muted">عدد الأجزاء المحفوظة</label>
            <Input
              type="number"
              min={1}
              max={30}
              value={ajzaCount}
              onChange={(e) =>
                setAjzaCount(Math.min(30, Math.max(1, Number(e.target.value))))
              }
              className="mt-1 text-center font-bold"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-muted">موضع الأجزاء</label>
            <Select
              value={ajzaStart}
              onChange={(e) => setAjzaStart(e.target.value as any)}
              className="mt-1"
            >
              <option value="start">من أول المصحف (الجزء ١ فصاعداً)</option>
              <option value="end">من آخر المصحف (جزء عم والنزول تنازلياً)</option>
              <option value="custom">نطاق مخصص بأرقام الأجزاء</option>
            </Select>
          </div>
          {ajzaStart === 'custom' && (
            <div className="grid grid-cols-2 gap-2 sm:col-span-2">
              <label className="text-xs">
                من الجزء
                <Input
                  type="number"
                  min={1}
                  max={30}
                  value={customFromJuz}
                  onChange={(e) => setCustomFromJuz(Number(e.target.value))}
                  className="mt-1"
                />
              </label>
              <label className="text-xs">
                إلى الجزء
                <Input
                  type="number"
                  min={1}
                  max={30}
                  value={customToJuz}
                  onChange={(e) => setCustomToJuz(Number(e.target.value))}
                  className="mt-1"
                />
              </label>
            </div>
          )}
        </div>
      )}

      {scopeType === 'surahs' && (
        <div className="grid grid-cols-1 gap-3 rounded-xl border border-line bg-surface p-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-bold text-muted">من سورة</label>
            <Select
              value={fromSurah}
              onChange={(e) => setFromSurah(Number(e.target.value))}
              className="mt-1"
            >
              {SURAHS.map((s) => (
                <option key={s.number} value={s.number}>
                  {s.number}. {s.name} ({fmtNum(s.ayahs)} آية)
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="text-xs font-bold text-muted">إلى سورة</label>
            <Select
              value={toSurah}
              onChange={(e) => setToSurah(Number(e.target.value))}
              className="mt-1"
            >
              {SURAHS.map((s) => (
                <option key={s.number} value={s.number}>
                  {s.number}. {s.name} ({fmtNum(s.ayahs)} آية)
                </option>
              ))}
            </Select>
          </div>
        </div>
      )}

      {/* Target Days Input */}
      <div>
        <label className="text-xs font-bold text-muted">
          في كم يوم تريد ختم مراجعة هذا المحفوظ؟ (مدة الختمة)
        </label>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <Input
            type="number"
            min={1}
            max={365}
            value={targetDays}
            onChange={(e) => setTargetDays(Math.max(1, Number(e.target.value)))}
            className="w-28 text-center text-base font-bold"
          />
          <span className="text-sm font-semibold text-muted">يوم</span>

          <div className="ms-auto flex flex-wrap gap-1.5">
            {[3, 5, 7, 10, 15, 30].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setTargetDays(d)}
                className={cx(
                  'rounded-lg px-2.5 py-1 text-xs font-semibold transition',
                  targetDays === d
                    ? 'bg-primary text-white'
                    : 'bg-surface2 text-ink hover:bg-surface2/80',
                )}
              >
                {fmtNum(d)} أيام
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Instant Calculation Box */}
      <div className="rounded-2xl border border-primary/20 bg-primarysoft/40 p-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-primary">المعادلة والحسبة اليومية:</p>
            <p className="mt-0.5 text-sm font-bold text-ink">
              {fmtNum(totalPages)} صفحة ÷ {fmtNum(targetDays)} يوم ={' '}
              <span className="text-primary underline">
                {dailyRate < 1
                  ? 'صفحة كل عدة أيام'
                  : `${fmtNum(dailyRate % 1 === 0 ? dailyRate : Number(dailyRate.toFixed(1)))} صفحة يومياً`}
              </span>
            </p>
          </div>
          <div className="text-end text-xs text-muted">
            <p>إجمالي الصفحات: {fmtNum(totalPages)}</p>
            <p>تاريخ الانتهاء المتوقع: {fmtDateAr(addDaysStr(today, targetDays - 1))}</p>
          </div>
        </div>
      </div>

      {/* Action button */}
      <div className="flex justify-end pt-1">
        <Btn onClick={onGeneratePlan} className="w-full sm:w-auto">
          <Icon name="check" size={16} className="me-1.5" />
          تطبيق وحفظ الخطة
        </Btn>
      </div>
    </div>
  );
}
