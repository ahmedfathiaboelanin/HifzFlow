// Mistake tracker (with repeat counts) + bookmarks.
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useAppDispatch, useAppSelector } from '../store/store';
import { mistakesSlice } from '../store/slices';
import { surahAyahCount, surahName, SURAHS } from '../lib/quran';
import { fmtNum, uid } from '../lib/utils';
import type { Mistake } from '../lib/types';
import { MISTAKE_LABEL } from '../lib/types';
import { Badge, Btn, Card, CardBody, CardHead, EmptyState, Input, PageHeader, Pagination, Select, Textarea, usePagination } from '../components/ui';

const mistakeSchema = z.object({
  surah: z.number().int().min(1).max(114),
  ayah: z.number().int().min(1),
  type: z.enum(['tajweed', 'word', 'order', 'forgetting']),
  note: z.string().max(500),
});

export function Mistakes() {
  const items = useAppSelector((s) => s.mistakes.items);
  const bookmarks = useAppSelector((s) => s.mistakes.bookmarks);
  const dispatch = useAppDispatch();
  const [perPage, setPerPage] = useState(8);
  const { page, setPage, totalPages, pageItems, total } = usePagination(items, perPage);
  const [msg, setMsg] = useState('');

  const { register, handleSubmit, watch, setError, reset } = useForm<z.infer<typeof mistakeSchema>>({
    defaultValues: { surah: 10, ayah: 1, type: 'word', note: '' },
  });
  const watchSurah = watch('surah');

  const onAdd = (data: z.infer<typeof mistakeSchema>) => {
    if (data.ayah > surahAyahCount(data.surah)) {
      setError('ayah', { message: `السورة فيها ${fmtNum(surahAyahCount(data.surah))} آية فقط` });
      return;
    }
    const existing = items.find((m) => m.surah === data.surah && m.ayah === data.ayah && m.type === data.type && !m.resolved);
    if (existing) {
      dispatch(mistakesSlice.actions.bumpMistake(existing.id));
      setMsg('خطأ موجود بالفعل — تم زيادة عدّاد التكرار.');
    } else {
      dispatch(mistakesSlice.actions.addMistake({
        id: uid(), surah: data.surah, ayah: data.ayah, type: data.type,
        note: data.note, count: 1, lastSeen: new Date().toISOString(), resolved: false,
      }));
      setMsg('تم تسجيل الخطأ.');
    }
    reset({ surah: data.surah, ayah: data.ayah, type: data.type, note: '' });
  };

  const open = items.filter((m) => !m.resolved);

  return (
    <div>
      <PageHeader
        icon="pen"
        title="الأخطاء"
        sub={`${fmtNum(open.length)} خطأ مفتوح من ${fmtNum(items.length)} — كرّر الخطأ حتى يثبت الصواب.`}
      />

      <Card>
        <CardHead title="تسجيل خطأ جديد" />
        <CardBody>
          <form onSubmit={handleSubmit(onAdd)} className="flex flex-wrap items-end gap-2">
            <label className="text-sm">السورة
              <Select {...register('surah', { valueAsNumber: true })} className="mt-1 block">
                {SURAHS.map((s) => (<option key={s.number} value={s.number}>{s.name}</option>))}
              </Select>
            </label>
            <label className="text-sm">الآية
              <Input type="number" min={1} max={surahAyahCount(watchSurah)} {...register('ayah', { valueAsNumber: true })} className="mt-1 !w-24" />
            </label>
            <label className="text-sm">النوع
              <Select {...register('type')} className="mt-1 block">
                {(Object.keys(MISTAKE_LABEL) as Mistake['type'][]).map((t) => (<option key={t} value={t}>{MISTAKE_LABEL[t]}</option>))}
              </Select>
            </label>
            <Textarea rows={1} placeholder="ملاحظة (اختياري)…" {...register('note')} className="!w-64" />
            <Btn type="submit">تسجيل</Btn>
          </form>
          {msg && <p className="mt-2 text-sm font-semibold text-primary">{msg}</p>}
        </CardBody>
      </Card>

      <Card className="mt-3">
        <CardHead title="سجل الأخطاء" sub="الأحدث أولاً — «+١» عند تكرار نفس الخطأ" />
        {pageItems.length === 0 ? (
          <EmptyState icon="pen" title="لا أخطاء مسجلة" sub="سجّل أول خطأ من النموذج أعلاه أو من القارئ بالضغط على آية." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr className="border-b border-line text-start text-xs text-muted">
                    <th className="px-3 py-2 text-start">الموضع</th>
                    <th className="px-3 py-2 text-start">النوع</th>
                    <th className="px-3 py-2 text-start">الملاحظة</th>
                    <th className="px-3 py-2 text-start">التكرار</th>
                    <th className="px-3 py-2 text-start">آخر مرة</th>
                    <th className="px-3 py-2 text-start">الحالة</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((m) => (
                    <tr key={m.id} className="border-b border-line last:border-0">
                      <td className="px-3 py-2 font-bold">{surahName(m.surah)} — آية {fmtNum(m.ayah)}</td>
                      <td className="px-3 py-2">{MISTAKE_LABEL[m.type]}</td>
                      <td className="px-3 py-2 text-muted">{m.note || '—'}</td>
                      <td className="px-3 py-2">
                        <button className="rounded-lg border border-line px-2 py-0.5 font-bold hover:border-primary" onClick={() => dispatch(mistakesSlice.actions.bumpMistake(m.id))} title="تكرار الخطأ مرة أخرى">
                          {fmtNum(m.count)} +١
                        </button>
                      </td>
                      <td className="px-3 py-2 text-xs text-muted">{new Date(m.lastSeen).toLocaleDateString('ar-EG')}</td>
                      <td className="px-3 py-2">
                        <Badge tone={m.resolved ? 'ok' : 'warn'}>{m.resolved ? 'تم حله' : 'مفتوح'}</Badge>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex gap-2">
                          <button className="text-primary hover:underline" onClick={() => dispatch(mistakesSlice.actions.resolveMistake({ id: m.id, resolved: !m.resolved }))}>
                            {m.resolved ? 'إعادة فتح' : 'حلّ'}
                          </button>
                          <button className="text-red-600 hover:underline" onClick={() => dispatch(mistakesSlice.actions.removeMistake(m.id))}>حذف</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={totalPages} total={total} perPage={perPage} onChange={setPage} perPageOptions={[8, 16]} onPerPage={(n) => { setPerPage(n); setPage(1); }} />
          </>
        )}
      </Card>

      <Card className="mt-3">
        <CardHead title="الإشارات المرجعية" sub={`من القارئ — ${fmtNum(bookmarks.length)} إشارة`} />
        <CardBody>
          {bookmarks.length === 0 ? (
            <p className="text-sm text-muted">لا إشارات بعد — اضغط أي آية في القارئ ثم «حفظ كإشارة».</p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {bookmarks.map((b) => (
                <li key={b.id} className="flex items-center justify-between rounded-xl bg-surface2 px-3 py-2 text-sm">
                  <span>🔖 {surahName(b.surah)} — آية {fmtNum(b.ayah)}{b.note ? ` • ${b.note}` : ''}</span>
                  <button className="text-red-600 hover:underline" onClick={() => dispatch(mistakesSlice.actions.removeBookmark(b.id))}>حذف</button>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
