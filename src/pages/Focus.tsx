// Focus timer + one-tap distraction logging + session history.
import { useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/store';
import { focusSlice } from '../store/slices';
import { fmtMinutes, fmtNum, todayStr, uid, cx } from '../lib/utils';
import { surahName, SURAHS } from '../lib/quran';
import { useWakeLock, hapticTap, hapticSuccess } from '../lib/pwa';
import { Btn, Card, CardBody, CardHead, EmptyState, PageHeader, Pagination, Select, Tabs, Textarea, usePagination } from '../components/ui';
import { Icon } from '../components/icons';

const DISTRACTION_KINDS = ['هاتف', 'أفكار جانبية', 'ضوضاء', 'تعب', 'أخرى'];

export function Focus() {
  const [tab, setTab] = useState<'timer' | 'sessions'>('timer');
  const sessions = useAppSelector((s) => s.focus.sessions);
  const distractions = useAppSelector((s) => s.focus.distractions);
  const dispatch = useAppDispatch();

  const [mode, setMode] = useState<'hifz' | 'revision' | 'reading'>('hifz');
  const [linkedSurah, setLinkedSurah] = useState<number | ''>('');
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [runId, setRunId] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [kind, setKind] = useState(DISTRACTION_KINDS[0]);
  const [note, setNote] = useState('');
  const [msg, setMsg] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const accumulatedRef = useRef<number>(0);
  const wakeLock = useWakeLock();

  useEffect(() => {
    if (running) {
      if (startTimeRef.current === null) {
        startTimeRef.current = Date.now();
      }
      intervalRef.current = setInterval(() => {
        if (startTimeRef.current !== null) {
          const delta = Math.floor((Date.now() - startTimeRef.current) / 1000);
          setSeconds(accumulatedRef.current + delta);
        }
      }, 500);
    } else {
      if (startTimeRef.current !== null) {
        accumulatedRef.current += Math.floor((Date.now() - startTimeRef.current) / 1000);
        startTimeRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  const start = () => {
    hapticTap();
    if (!running && seconds === 0) {
      setRunId(uid());
      setStartedAt(new Date().toISOString());
      accumulatedRef.current = 0;
      startTimeRef.current = Date.now();
    } else if (!running) {
      startTimeRef.current = Date.now();
    }
    if (wakeLock.supported && !wakeLock.active) {
      void wakeLock.request();
    }
    setRunning(true);
  };

  const pause = () => {
    hapticTap();
    setRunning(false);
  };

  const finish = () => {
    hapticSuccess();
    setRunning(false);
    void wakeLock.release();
    if (seconds > 0) {
      dispatch(focusSlice.actions.addFocusSession({
        id: runId ?? uid(),
        startedAt: startedAt ?? new Date().toISOString(),
        endedAt: new Date().toISOString(),
        durationSec: seconds,
        mode,
        linkedSurah: linkedSurah === '' ? null : linkedSurah,
      }));
      setMsg(`تم تسجيل جلسة تركيز ${fmtMinutes(Math.round(seconds / 60))}.`);
    }
    setSeconds(0);
    accumulatedRef.current = 0;
    startTimeRef.current = null;
    setRunId(null);
    setStartedAt(null);
  };

  const cancel = () => {
    hapticTap();
    setRunning(false);
    void wakeLock.release();
    setSeconds(0);
    accumulatedRef.current = 0;
    startTimeRef.current = null;
    setRunId(null);
    setStartedAt(null);
  };

  const logDistraction = () => {
    hapticTap();
    dispatch(focusSlice.actions.addDistraction({
      id: uid(),
      sessionId: runId,
      at: new Date().toISOString(),
      kind,
      note,
    }));
    setNote('');
    setMsg('تم تسجيل التشتت — ارجع لوردك، لا بأس. 🌿');
  };

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  const todayMin = Math.round(
    sessions
      .filter((f) => new Date(f.startedAt).getTime() >= new Date(todayStr()).getTime())
      .reduce((n, f) => n + f.durationSec, 0) / 60,
  );

  const [perPage, setPerPage] = useState(6);
  const { page, setPage, totalPages, pageItems, total } = usePagination(sessions, perPage);

  return (
    <div>
      <PageHeader
        icon="timer"
        title="التركيز"
        sub={`مؤقّت تركيز للحفظ والمراجعة، مع تسجيل التشتت بضغطة واحدة. اليوم: ${fmtNum(todayMin)} دقيقة تركيز.`}
        actions={
          wakeLock.supported ? (
            <Btn
              size="sm"
              variant={wakeLock.active ? 'primary' : 'outline'}
              onClick={() => void wakeLock.toggle()}
              title="إبقاء الشاشة مضاءة أثناء جلسة التركيز"
            >
              <Icon name="eye" size={14} />
              {wakeLock.active ? 'الشاشة نشطة' : 'إبقاء الشاشة مضاءة'}
            </Btn>
          ) : undefined
        }
      />
      <Tabs
        tabs={[{ id: 'timer', label: 'المؤقت' }, { id: 'sessions', label: `الجلسات (${fmtNum(sessions.length)})` }]}
        value={tab}
        onChange={setTab}
      />

      {tab === 'timer' && (
        <div className="mt-3 flex flex-col gap-3">
          <Card>
            <CardBody>
              <div className="flex flex-wrap items-end gap-2">
                <label className="text-sm">الوضع
                  <Select className="mt-1 block" value={mode} onChange={(e) => setMode(e.target.value as typeof mode)}>
                    <option value="hifz">حفظ جديد</option>
                    <option value="revision">مراجعة</option>
                    <option value="reading">قراءة</option>
                  </Select>
                </label>
                <label className="text-sm">السورة (اختياري)
                  <Select className="mt-1 block" value={linkedSurah} onChange={(e) => setLinkedSurah(e.target.value === '' ? '' : Number(e.target.value))}>
                    <option value="">—</option>
                    {SURAHS.map((s) => (<option key={s.number} value={s.number}>{s.name}</option>))}
                  </Select>
                </label>
              </div>
              <p className="mt-4 text-center font-mono text-5xl font-bold tabular-nums tracking-tight text-ink sm:text-6xl" dir="ltr">{mm}:{ss}</p>
              <div className={cx('mx-auto mt-3 flex h-1.5 w-24 overflow-hidden rounded-full bg-surface2', running && 'bg-primary/15')}>
                <span className={cx('h-full rounded-full bg-primary transition-all', running ? 'w-full animate-pulse-soft' : seconds > 0 ? 'w-1/2' : 'w-0')} />
              </div>
              <p className="mt-2 text-center text-sm text-muted">{running ? 'جارٍ التركيز… بالتوفيق 🌿' : seconds > 0 ? 'متوقف مؤقتاً' : 'جاهز؟ ابدأ جلستك'}</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {!running && <Btn size="lg" onClick={start}><Icon name="play" size={15} /> {seconds > 0 ? 'استئناف' : 'بدء التركيز'}</Btn>}
                {running && <Btn size="lg" variant="outline" onClick={pause}><Icon name="pause" size={15} /> إيقاف مؤقت</Btn>}
                <Btn size="lg" variant="soft" disabled={seconds === 0} onClick={finish}><Icon name="square" size={14} /> إنهاء وتسجيل</Btn>
                <Btn size="lg" variant="ghost" disabled={seconds === 0} onClick={cancel}>إلغاء</Btn>
              </div>
              <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                {[15, 25, 45, 60].map((m) => (
                  <button
                    key={m}
                    onClick={() => { setSeconds(m * 60); setRunning(false); setRunId(uid()); setStartedAt(new Date().toISOString()); }}
                    className="rounded-full border border-line bg-surface px-2.5 py-1 text-[11px] font-semibold text-muted transition hover:border-primary/40 hover:text-ink"
                  >
                    {fmtNum(m)} دقيقة
                  </button>
                ))}
              </div>
              {msg && <p className="mt-3 text-center text-sm font-semibold text-primary">{msg}</p>}
            </CardBody>
          </Card>

          <Card>
            <CardHead title="تسجيل تشتت بضغطة واحدة" sub="لا تحاسب نفسك — سجّل وارجع" />
            <CardBody>
              <div className="flex flex-wrap items-end gap-2">
                <label className="text-sm">نوع التشتت
                  <Select className="mt-1 block" value={kind} onChange={(e) => setKind(e.target.value)}>
                    {DISTRACTION_KINDS.map((k) => (<option key={k} value={k}>{k}</option>))}
                  </Select>
                </label>
                <Textarea rows={1} placeholder="ملاحظة (اختياري)…" value={note} onChange={(e) => setNote(e.target.value)} className="!w-64" />
                <Btn variant="outline" onClick={logDistraction}>📵 سجّل تشتتاً</Btn>
              </div>
              <p className="mt-2 text-xs text-muted">سُجلت {fmtNum(distractions.length)} مرة تشتت — أكثرها: {mostCommon(distractions.map((d) => d.kind))}</p>
            </CardBody>
          </Card>
        </div>
      )}

      {tab === 'sessions' && (
        <Card className="mt-3">
          <CardHead title="جلسات التركيز" sub="الأحدث أولاً" />
          {pageItems.length === 0 ? (
            <EmptyState title="لا جلسات بعد" sub="ابدأ أول جلسة تركيز من تبويب المؤقت." />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr className="border-b border-line text-start text-xs text-muted">
                      <th className="px-3 py-2 text-start">التاريخ</th>
                      <th className="px-3 py-2 text-start">المدة</th>
                      <th className="px-3 py-2 text-start">الوضع</th>
                      <th className="px-3 py-2 text-start">السورة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.map((f) => (
                      <tr key={f.id} className="border-b border-line last:border-0">
                        <td className="px-3 py-2">{new Date(f.startedAt).toLocaleString('ar-EG')}</td>
                        <td className="px-3 py-2">{fmtMinutes(Math.round(f.durationSec / 60))}</td>
                        <td className="px-3 py-2">{f.mode === 'hifz' ? 'حفظ جديد' : f.mode === 'revision' ? 'مراجعة' : 'قراءة'}</td>
                        <td className="px-3 py-2">{f.linkedSurah ? surahName(f.linkedSurah) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={page} totalPages={totalPages} total={total} perPage={perPage} onChange={setPage} perPageOptions={[6, 12]} onPerPage={(n) => { setPerPage(n); setPage(1); }} />
            </>
          )}
        </Card>
      )}
    </div>
  );
}

function mostCommon(items: string[]): string {
  if (items.length === 0) return '—';
  const counts = new Map<string, number>();
  for (const i of items) counts.set(i, (counts.get(i) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}
