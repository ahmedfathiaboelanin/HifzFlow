// نموذج إضافة واستيراد الأجزاء الضعيفة
import { useState } from 'react';
import { SURAHS } from '../../data/mushaf';
import { RUB_OPTIONS } from '../../lib/schedule';
import type {
  ProgressEntry,
  WeakPartStage,
  WeakPartType,
} from '../../lib/types';
import { fmtNum } from '../../lib/utils';
import { Btn, Card, CardBody, CardHead, Input, Select } from '../ui';
import { Icon } from '../icons';

interface AddWeakPartFormProps {
  unimportedWeakEntriesCount: number;
  onImportFromProgress: () => void;
  onAddWeakPart: (item: {
    type: WeakPartType;
    surahNumber?: number;
    juzNumber?: number;
    rubName?: string;
    customTitle?: string;
    stage: WeakPartStage;
    notes?: string;
  }) => void;
}

export function AddWeakPartForm({
  unimportedWeakEntriesCount,
  onImportFromProgress,
  onAddWeakPart,
}: AddWeakPartFormProps) {
  const [weakType, setWeakType] = useState<WeakPartType>('surah');
  const [weakSurah, setWeakSurah] = useState<number>(2);
  const [weakJuz, setWeakJuz] = useState<number>(1);
  const [weakRubJuz, setWeakRubJuz] = useState<number>(1);
  const [weakRubIndex, setWeakRubIndex] = useState<number>(0);
  const [weakCustomTitle, setWeakCustomTitle] = useState<string>('');
  const [weakStage, setWeakStage] = useState<WeakPartStage>('sight');
  const [weakNotes, setWeakNotes] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddWeakPart({
      type: weakType,
      surahNumber: weakType === 'surah' ? weakSurah : undefined,
      juzNumber:
        weakType === 'juz' ? weakJuz : weakType === 'rub' ? weakRubJuz : undefined,
      rubName: weakType === 'rub' ? RUB_OPTIONS[weakRubIndex] : undefined,
      customTitle: weakType === 'custom' ? weakCustomTitle : undefined,
      stage: weakStage,
      notes: weakNotes.trim() || undefined,
    });
    setWeakCustomTitle('');
    setWeakNotes('');
  };

  return (
    <div className="space-y-4">
      {/* Auto-import notification if weak entries exist in progress */}
      {unimportedWeakEntriesCount > 0 && (
        <Card className="border-amber-300 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
          <CardBody className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-bold text-sm text-ink">
                لديك {fmtNum(unimportedWeakEntriesCount)} سور مصنفة «ضعيف» في جدول الحفظ
              </p>
              <p className="text-xs text-muted">
                يمكنك جلبها بنقرة واحدة ليتم توزيعها منطقياً بمعدل مقطع يومياً في جدول التثبيت.
              </p>
            </div>
            <Btn size="sm" variant="primary" onClick={onImportFromProgress}>
              <Icon name="download" size={14} className="me-1" />
              جلب السور وتوزيعها تلقائياً
            </Btn>
          </CardBody>
        </Card>
      )}

      {/* Add Weak Part Form */}
      <Card>
        <CardHead
          title="إضافة مقطع أو سورة ضعيفة للتثبيت"
          sub="أضف السور أو الأرباع التي تشعر بضعفها وسيتولى النظام جدولتها بالتكرار المتباعد."
        />
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="text-xs font-bold text-muted">نوع الجزء الضعيف</label>
                <Select
                  value={weakType}
                  onChange={(e) => setWeakType(e.target.value as WeakPartType)}
                  className="mt-1"
                >
                  <option value="surah">سورة كاملة</option>
                  <option value="rub">ربع حزب</option>
                  <option value="juz">جزء كامل</option>
                  <option value="custom">مقطع مخصص (كتابة يدوية)</option>
                </Select>
              </div>

              {weakType === 'surah' && (
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-muted">اختر السورة</label>
                  <Select
                    value={weakSurah}
                    onChange={(e) => setWeakSurah(Number(e.target.value))}
                    className="mt-1"
                  >
                    {SURAHS.map((s) => (
                      <option key={s.number} value={s.number}>
                        {s.number}. {s.name} ({fmtNum(s.ayahs)} آية)
                      </option>
                    ))}
                  </Select>
                </div>
              )}

              {weakType === 'juz' && (
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-muted">رقم الجزء</label>
                  <Select
                    value={weakJuz}
                    onChange={(e) => setWeakJuz(Number(e.target.value))}
                    className="mt-1"
                  >
                    {Array.from({ length: 30 }, (_, i) => i + 1).map((j) => (
                      <option key={j} value={j}>الجزء {fmtNum(j)}</option>
                    ))}
                  </Select>
                </div>
              )}

              {weakType === 'rub' && (
                <>
                  <div>
                    <label className="text-xs font-bold text-muted">الجزء</label>
                    <Select
                      value={weakRubJuz}
                      onChange={(e) => setWeakRubJuz(Number(e.target.value))}
                      className="mt-1"
                    >
                      {Array.from({ length: 30 }, (_, i) => i + 1).map((j) => (
                        <option key={j} value={j}>الجزء {fmtNum(j)}</option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted">الربع</label>
                    <Select
                      value={weakRubIndex}
                      onChange={(e) => setWeakRubIndex(Number(e.target.value))}
                      className="mt-1"
                    >
                      {RUB_OPTIONS.map((name, i) => (
                        <option key={i} value={i}>{name}</option>
                      ))}
                    </Select>
                  </div>
                </>
              )}

              {weakType === 'custom' && (
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-muted">عنوان المقطع المخصص</label>
                  <Input
                    type="text"
                    value={weakCustomTitle}
                    onChange={(e) => setWeakCustomTitle(e.target.value)}
                    placeholder="مثال: أوائل سورة البقرة، آية الدين..."
                    className="mt-1"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-bold text-muted">مرحلة البداية للتثبيت</label>
                <Select
                  value={weakStage}
                  onChange={(e) => setWeakStage(e.target.value as WeakPartStage)}
                  className="mt-1"
                >
                  <option value="sight">قراءة بالنظر أولاً (لتأكيد الحفظ)</option>
                  <option value="memory">تسميع غيباً مباشرة</option>
                </Select>
              </div>

              <div>
                <label className="text-xs font-bold text-muted">ملاحظة اختيارية</label>
                <Input
                  type="text"
                  value={weakNotes}
                  onChange={(e) => setWeakNotes(e.target.value)}
                  placeholder="مثال: التركيز على متشابهات الربع الثاني"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Btn type="submit" variant="primary">
                <Icon name="plus" size={16} className="me-1.5" />
                إضافة لطابور التثبيت
              </Btn>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
