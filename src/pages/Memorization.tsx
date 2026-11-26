// Memorization tracker: table (status + strength dropdowns), add form,
// bulk memorized-range entry with undo, strength guide.
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useAppDispatch, useAppSelector } from '../store/store';
import { progressSlice } from '../store/slices';
import { firstDue } from '../lib/fixation';
import { entryAyahCount, rangeAyahCount, surahAyahCount, surahName, SURAHS } from '../lib/quran';
import { fmtDateAr, fmtNum, todayStr, uid } from '../lib/utils';
import type { MemStatus, Strength } from '../lib/types';
import { STATUS_LABEL, STRENGTH_LABEL } from '../lib/types';
import { Btn, Card, CardBody, CardHead, EmptyState, Input, PageHeader, Pagination, Select, Tabs, usePagination } from '../components/ui';
import { INTERVALS } from '../lib/fixation';

const addSchema = z.object({
  surah: z.number().int().min(1).max(114),
  fromAyah: z.number().int().min(1),
  toAyah: z.number().int().min(1),
  strength: z.enum(['weak', 'medium', 'strong']),
});

type AddForm = z.infer<typeof addSchema>;

const THREE_STRENGTHS: Array<{ value: Strength; label: string }> = [
  { value: 'weak', label: 'ضعيف' },
  { value: 'medium', label: 'متوسط' },
  { value: 'strong', label: 'قوي' },
];

export function Memorization() {
  const [tab, setTab] = useState<'table' | 'add' | 'guide'>('table');
  const entries = useAppSelector((s) => s.progress.entries);
  const dispatch = useAppDispatch();
  const [perPage, setPerPage] = useState(10);
  const sorted = useMemo(
    () => [...entries].sort((a, b) => a.surah - b.surah || a.fromAyah - b.fromAyah),
    [entries],
  );
  const { page, setPage, totalPages, pageItems, total } = usePagination(sorted, perPage);

  // ---- Add form (React Hook Form + Zod, validated on submit) ----
  const { register, handleSubmit, watch, setError, formState: { errors }, reset } = useForm<AddForm>({
    defaultValues: { surah: 2, fromAyah: 1, toAyah: 5, strength: 'weak' },
  });
  const watchSurah = watch('surah');
  const [addedMsg, setAddedMsg] = useState('');

  const onAdd = (data: AddForm) => {
    const parsed = addSchema.safeParse(data);
    if (!parsed.success) {
      parsed.error.issues.forEach((i) => {
        const field = i.path[0] as keyof AddForm;
        setError(field, { message: i.message });
      });
      return;
    }
    const maxAyah = surahAyahCount(data.surah);
    if (data.fromAyah > maxAyah || data.toAyah > maxAyah) {
      setError('toAyah', { message: `السورة فيها ${fmtNum(maxAyah)} آية فقط` });
      return;
    }
    if (data.fromAyah > data.toAyah) {
      setError('toAyah', { message: 'آية النهاية يجب أن تكون بعد آية البداية' });
      return;
    }
    dispatch(progressSlice.actions.addEntry({
      id: uid(),
      surah: data.surah,
      fromAyah: data.fromAyah,
      toAyah: data.toAyah,
      status: 'memorized',
      strength: data.strength,
      srStage: 0,
      srDue: firstDue(data.strength),
      easyStreak: 0,
      stabilizedAt: null,
      createdAt: todayStr(),
    }));
    setAddedMsg(`تمت إضافة ${surahName(data.surah)} ${fmtNum(data.fromAyah)}–${fmtNum(data.toAyah)} — أول مراجعة ${fmtDateAr(firstDue(data.strength))}`);
    reset();
  };

  // ---- Bulk range ----
  const [bulk, setBulk] = useState({ fromSurah: 2, fromAyah: 1, toSurah: 2, toAyah: 5 });
  const [lastBulkIds, setLastBulkIds] = useState<string[] | null>(null);
  const bulkCount = useMemo(
    () => rangeAyahCount(bulk.fromSurah, bulk.fromAyah, bulk.toSurah, bulk.toAyah),
    [bulk],
  );
  const bulkValid = bulk.fromSurah <= bulk.toSurah && bulkCount > 0
    && bulk.fromAyah >= 1 && bulk.toAyah >= 1
    && bulk.fromAyah <= surahAyahCount(bulk.fromSurah) && bulk.toAyah <= surahAyahCount(bulk.toSurah);

  const confirmBulk = () => {
    if (!bulkValid) return;
    const ids: string[] = [];
    const now = todayStr();
    for (let s = bulk.fromSurah; s <= bulk.toSurah; s++) {
      const from = s === bulk.fromSurah ? bulk.fromAyah : 1;
      const to = s === bulk.toSurah ? bulk.toAyah : surahAyahCount(s);
      const id = uid();
      ids.push(id);
      dispatch(progressSlice.actions.addEntry({
        id, surah: s, fromAyah: from, toAyah: to,
        status: 'memorized', strength: 'weak', srStage: 0,
        srDue: firstDue('weak'), easyStreak: 0, stabilizedAt: null, createdAt: now,
      }));
    }
    setLastBulkIds(ids);
  };

  const changeStrength = (id: string, strength: Strength) => {
    dispatch(progressSlice.actions.updateEntry({
      id,
      patch: { strength, srStage: 0, easyStreak: 0, srDue: firstDue(strength), stabilizedAt: null },
    }));
  };

  return (
    <div>
      <PageHeader
        icon="layers"
        title="الحفظ"
        sub="سجّل السور التي حفظتها ومستوى كل منها. لا يوجد محفوظ مفترض — أنت تدخل محفوظك بنفسك."
        actions={<Btn variant="soft" onClick={() => setTab('add')}>إضافة محفوظ</Btn>}
      />

      <Tabs
        tabs={[
          { id: 'table', label: `الجدول (${fmtNum(entries.length)})` },
          { id: 'add', label: 'إضافة ونطاق' },
          { id: 'guide', label: 'دليل القوة' },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === 'table' && (
        <Card className="mt-3">
          <CardHead title="السور المحفوظة" sub="حدّد مستوى القوة (ضعيف، متوسط، قوي) — تغيير القوة يعيد جدولة المراجعة" />
          {pageItems.length === 0 ? (
            <EmptyState title="لا يوجد محفوظ بعد" sub="أضف أول نطاق من تبويب «إضافة ونطاق»." />
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr className="border-b border-line text-start text-xs text-muted">
                    <th className="px-3 py-2 text-start">السورة</th>
                    <th className="px-3 py-2 text-start">الآيات</th>
                    <th className="px-3 py-2 text-start">القوة</th>
                    <th className="px-3 py-2 text-start">المراجعة القادمة</th>
                    <th className="px-3 py-2 text-start">المرحلة</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((e) => {
                    const currentStrength: Strength = e.strength === 'veryStrong' ? 'strong' : e.strength;
                    return (
                      <tr key={e.id} className="border-b border-line last:border-0">
                        <td className="px-3 py-2 font-bold">{surahName(e.surah)}</td>
                        <td className="px-3 py-2">{fmtNum(e.fromAyah)}–{fmtNum(e.toAyah)} ({fmtNum(entryAyahCount(e))} آية)</td>
                        <td className="px-3 py-2">
                          <Select value={currentStrength} onChange={(ev) => changeStrength(e.id, ev.target.value as Strength)}>
                            {THREE_STRENGTHS.map((s) => (<option key={s.value} value={s.value}>{s.label}</option>))}
                          </Select>
                        </td>
                        <td className="px-3 py-2">{fmtDateAr(e.srDue)}</td>
                        <td className="px-3 py-2">{fmtNum(e.srStage + 1)} / {fmtNum(INTERVALS[e.strength]?.length ?? 1)}</td>
                        <td className="px-3 py-2">
                          <button
                            className="text-red-600 hover:underline"
                            onClick={() => { if (window.confirm('حذف هذا النطاق من المحفوظ؟')) dispatch(progressSlice.actions.removeEntry(e.id)); }}
                          >
                            حذف
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <Pagination page={page} totalPages={totalPages} total={total} perPage={perPage} onChange={setPage} perPageOptions={[5, 10, 20]} onPerPage={(n) => { setPerPage(n); setPage(1); }} />
        </Card>
      )}

      {tab === 'add' && (
        <div className="mt-3 flex flex-col gap-3">
          <Card>
            <CardHead title="إضافة نطاق محفوظ" sub="سورة واحدة أو جزء منها" />
            <CardBody>
              <form onSubmit={handleSubmit(onAdd)} className="flex flex-col gap-3">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
                  <label className="text-sm">السورة
                    <Select {...register('surah', { valueAsNumber: true })} className="mt-1 w-full">
                      {SURAHS.map((s) => (<option key={s.number} value={s.number}>{s.name} ({fmtNum(s.ayahs)})</option>))}
                    </Select>
                  </label>
                  <label className="text-sm">من آية
                    <Input type="number" min={1} max={surahAyahCount(watchSurah)} {...register('fromAyah', { valueAsNumber: true })} className="mt-1" />
                  </label>
                  <label className="text-sm">إلى آية
                    <Input type="number" min={1} max={surahAyahCount(watchSurah)} {...register('toAyah', { valueAsNumber: true })} className="mt-1" />
                  </label>
                  <label className="text-sm">القوة
                    <Select {...register('strength')} className="mt-1 w-full">
                      {THREE_STRENGTHS.map((s) => (<option key={s.value} value={s.value}>{s.label}</option>))}
                    </Select>
                  </label>
                </div>
                {Object.entries(errors).map(([k, e]) => (
                  <p key={k} className="text-sm text-red-600">{(e as { message?: string }).message ?? 'خطأ في الإدخال'}</p>
                ))}
                <div><Btn type="submit">إضافة إلى المحفوظ</Btn></div>
                {addedMsg && <p className="text-sm font-semibold text-primary">{addedMsg}</p>}
              </form>
            </CardBody>
          </Card>

          <Card>
            <CardHead title="إدخال نطاق محفوظ دفعة واحدة" sub="من سورة/آية إلى سورة/آية — يُقسَّم تلقائياً سورة سورة" />
            <CardBody>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <label className="text-sm">من سورة
                  <Select value={bulk.fromSurah} onChange={(e) => setBulk({ ...bulk, fromSurah: Number(e.target.value) })} className="mt-1 w-full">
                    {SURAHS.map((s) => (<option key={s.number} value={s.number}>{s.name}</option>))}
                  </Select>
                </label>
                <label className="text-sm">من آية
                  <Input type="number" min={1} value={bulk.fromAyah} onChange={(e) => setBulk({ ...bulk, fromAyah: Number(e.target.value) })} className="mt-1" />
                </label>
                <label className="text-sm">إلى سورة
                  <Select value={bulk.toSurah} onChange={(e) => setBulk({ ...bulk, toSurah: Number(e.target.value) })} className="mt-1 w-full">
                    {SURAHS.map((s) => (<option key={s.number} value={s.number}>{s.name}</option>))}
                  </Select>
                </label>
                <label className="text-sm">إلى آية
                  <Input type="number" min={1} value={bulk.toAyah} onChange={(e) => setBulk({ ...bulk, toAyah: Number(e.target.value) })} className="mt-1" />
                </label>
              </div>
              <p className="mt-2 text-sm">
                {bulkValid
                  ? <>النطاق يحتوي <b>{fmtNum(bulkCount)} آية</b> — من {surahName(bulk.fromSurah)} {fmtNum(bulk.fromAyah)} إلى {surahName(bulk.toSurah)} {fmtNum(bulk.toAyah)}</>
                  : <span className="text-red-600">النطاق غير صحيح — تحقق من السور والآيات.</span>}
              </p>
              <div className="mt-2 flex gap-2">
                <Btn disabled={!bulkValid} onClick={confirmBulk}>تأكيد وإضافة النطاق</Btn>
                {lastBulkIds && (
                  <Btn variant="outline" onClick={() => { dispatch(progressSlice.actions.removeEntries(lastBulkIds)); setLastBulkIds(null); }}>
                    تراجع عن آخر إضافة
                  </Btn>
                )}
              </div>
              <p className="mt-2 text-xs text-muted">القوة الافتراضية للنطاق المُدخل دفعة واحدة: ضعيف — عدّلها من الجدول بعد الإضافة حسب مستواك الحقيقي.</p>
            </CardBody>
          </Card>
        </div>
      )}

      {tab === 'guide' && (
        <Card className="mt-3">
          <CardHead title="دليل قوة الحفظ والتكرار المتباعد" sub="كل قوة لها فواصل مراجعة خاصة بها" />
          <CardBody>
            <table className="data-table">
              <thead>
                <tr className="border-b border-line text-start text-xs text-muted">
                  <th className="px-2 py-2 text-start">القوة</th>
                  <th className="px-2 py-2 text-start">فواصل المراجعة (أيام)</th>
                  <th className="px-2 py-2 text-start">ملاحظة</th>
                </tr>
              </thead>
              <tbody>
                {THREE_STRENGTHS.map((st) => {
                  const s = st.value;
                  return (
                    <tr key={s} className="border-b border-line last:border-0">
                      <td className="px-2 py-2 font-bold">{st.label}</td>
                      <td className="px-2 py-2">{INTERVALS[s].map(fmtNum).join(' ، ')}</td>
                      <td className="px-2 py-2 text-muted">
                        {s === 'weak'
                          ? 'مراحل تثبيت متدرجة — تكرار متباعد لحين إتقان السورة وترقيتها إلى متوسط.'
                          : s === 'medium'
                          ? 'مستوى متوسط — مراجعة دورية لتثبيت الحفظ ونقله لمستوى قوي.'
                          : 'مستوى متقن — مراجعة متباعدة للحفاظ على جودة الإتقان.'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="mt-3 text-sm leading-relaxed">
              <b>قاعدة التقييم:</b> «أعد» تعيد السورة إلى ضعيف وتبدأ الدورة من الأول. «جيد» يقدّمك مرحلة. «سهل» مرتين متتاليتين يرفع القوة درجة — ما عدا الضعيف، فترقيته مشروطة بإكمال دورته كاملة.
            </p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
