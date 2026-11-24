// Backup & restore (Zod-validated JSON, import-compatible with the hosted
// app) + theme gallery + storage status + sample-data controls.
import { useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/store';
import { clearAllData, clearSampleData } from '../store/store';
import { prefsSlice } from '../store/slices';
import { downloadBackup, validateBackup } from '../lib/backup';
import { importBackupData } from '../store/store';
import { PALETTES, resolveMode } from '../lib/themes';
import { fmtNum } from '../lib/utils';
import { Btn, Card, CardBody, CardHead, Modal, PageHeader } from '../components/ui';
import { InstallCard } from '../components/Pwa';

export function BackupPage() {
  const state = useAppSelector((s) => s);
  const prefs = useAppSelector((s) => s.prefs);
  const storage = useAppSelector((s) => s.meta.storage);
  const dispatch = useAppDispatch();
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);

  const counts: Array<[string, number]> = [
    ['نطاقات محفوظة', state.progress.entries.length],
    ['سجل مراجعات', state.revision.history.length],
    ['أخطاء', state.mistakes.items.length],
    ['جلسات تركيز', state.focus.sessions.length],
    ['مهام يومية', state.tasks.daily.length],
    ['مهام متكررة', state.tasks.recurring.length],
    ['إشارات مرجعية', state.mistakes.bookmarks.length],
    ['أيام ورد منجزة', state.wird.items.length],
  ];

  const onImportFile = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      const result = validateBackup(parsed);
      if (!result.ok) {
        setMsg(`❌ ملف النسخة غير صالح: ${result.errors.slice(0, 3).join('؛ ')}`);
        return;
      }
      if (!window.confirm('سيتم استبدال كل بياناتك الحالية بنسخة الاحتياطي. متابعة؟')) return;
      importBackupData(result.backup);
      setMsg('✅ تم استيراد النسخة الاحتياطية بنجاح — بياناتك الآن من الملف.');
    } catch {
      setMsg('❌ تعذّرت قراءة الملف — تأكد أنه ملف JSON مصدَّر من HifzFlow.');
    }
  };

  return (
    <div>
      <PageHeader
        icon="database"
        title="النسخ الاحتياطي"
        sub="بياناتك على جهازك فقط — صدّر نسخة دورياً واحتفظ بها في مكان آمن."
      />

      <InstallCard className="mb-3" />

      <div className="flex flex-col gap-3">
        <Card>
          <CardHead title="نسخة احتياطية JSON" sub="نفس صيغة النسخة المستضافة — تصديرها من هناك يستورد هنا مباشرة" />
          <CardBody>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {counts.map(([label, n]) => (
                <div key={label} className="rounded-xl bg-surface2 p-2 text-center">
                  <p className="text-lg font-bold">{fmtNum(n)}</p>
                  <p className="text-xs text-muted">{label}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Btn onClick={() => { downloadBackup(state); setMsg('تم تنزيل ملف النسخة الاحتياطية.'); }}>⬇️ تصدير نسخة احتياطية</Btn>
              <Btn variant="outline" onClick={() => fileRef.current?.click()}>⬆️ استيراد نسخة احتياطية</Btn>
              <input
                ref={fileRef} type="file" accept="application/json,.json" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) void onImportFile(f); e.target.value = ''; }}
              />
            </div>
            {msg && <p className="mt-2 text-sm font-semibold">{msg}</p>}
            <p className="mt-2 text-xs leading-relaxed text-muted">
              الاستيراد يتحقق من بنية الملف (Zod) قبل استبدال أي بيانات، ويطلب تأكيدك أولاً — لا فقدان صامت للبيانات.
              التخزين: {storage === 'indexeddb' ? 'IndexedDB على جهازك' : '⚠️ ذاكرة مؤقتة فقط — فعّل التخزين المحلي في المتصفح'}.
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardHead title="المظهر — معرض الثيمات" sub="٥ لوحات، كل منها فاتح وداكن وتلقائي — تُحفظ وتُصدَّر مع النسخة الاحتياطية" />
          <CardBody>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {PALETTES.map((p) => {
                const active = prefs.palette === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => dispatch(prefsSlice.actions.setPrefs({ palette: p.id }))}
                    className={'overflow-hidden rounded-2xl border-2 text-start transition ' + (active ? 'border-primary shadow-soft' : 'border-line hover:border-primary/50')}
                  >
                    <div className="flex h-16" style={{ background: `linear-gradient(135deg, ${p.swatch}, ${p.swatch}88)` }}>
                      <span className="m-auto text-xl text-white">{active ? '✓' : ''}</span>
                    </div>
                    <div className="bg-surface p-2">
                      <p className="text-sm font-bold">{p.name}</p>
                      <p className="text-[11px] text-muted">{p.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="mt-3 flex gap-1">
              {([['light', '☀️ فاتح'], ['dark', '🌙 داكن'], ['system', '🖥️ تلقائي (حسب الجهاز)']] as const).map(([m, label]) => (
                <Btn key={m} variant={prefs.mode === m ? 'primary' : 'outline'} onClick={() => dispatch(prefsSlice.actions.setPrefs({ mode: m }))}>
                  {label}
                </Btn>
              ))}
              <span className="ms-2 self-center text-xs text-muted">الوضع الحالي الفعلي: {resolveMode(prefs.mode) === 'dark' ? 'داكن' : 'فاتح'}</span>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHead title="البيانات التجريبية" sub="البيانات الوهمية التي جاءت مع التطبيق أول مرة" />
          <CardBody>
            {prefs.sampleLoaded ? (
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm">البيانات التجريبية موجودة حالياً (سور وأخطاء ومهام وهمية).</p>
                <Btn variant="outline" onClick={() => { clearSampleData(); setMsg('تم مسح البيانات التجريبية — أنت الآن فارغ.'); }}>مسح البيانات التجريبية والبدء فارغاً</Btn>
              </div>
            ) : (
              <p className="text-sm text-muted">لا توجد بيانات تجريبية — بياناتك كلها حقيقية. 🎉</p>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHead title="منطقة الخطر" sub="إجراءات لا يمكن التراجع عنها" />
          <CardBody>
            <Btn variant="danger" onClick={() => setConfirmClear(true)}>مسح كل البيانات والبدء من الصفر</Btn>
          </CardBody>
        </Card>
      </div>

      {confirmClear && (
        <Modal title="مسح كل البيانات؟" onClose={() => setConfirmClear(false)}>
          <p className="text-sm leading-relaxed">
            سيتم حذف كل محفوظك ومراجعاتك وأخطائك ومهامك وجلستك من هذا الجهاز نهائياً.
            صدّر نسخة احتياطية أولاً إن أردت الاحتفاظ بها.
          </p>
          <div className="mt-4 flex gap-2">
            <Btn variant="danger" onClick={() => { void clearAllData(); setConfirmClear(false); setMsg('تم مسح كل البيانات.'); }}>نعم، امسح كل شيء</Btn>
            <Btn variant="outline" onClick={() => setConfirmClear(false)}>إلغاء</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
