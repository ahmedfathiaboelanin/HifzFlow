// Analytics: per-juz coverage, strength distribution, focus minutes, mistakes.
import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useAppSelector } from '../store/store';
import { juzCoverage, totalMemorizedAyahs } from '../lib/quran';
import { fmtNum, todayStr } from '../lib/utils';
import { STRENGTH_LABEL } from '../lib/types';
import { Card, CardBody, CardHead, PageHeader, Stat } from '../components/ui';

const PIE_COLORS = ['#d97706', '#2f7d5b', '#0e7490', '#7c3aed'];
const TOOLTIP_STYLE = {
  background: 'rgb(var(--c-surface))',
  border: '1px solid rgb(var(--c-border))',
  borderRadius: 12,
  fontSize: 12,
  color: 'rgb(var(--c-text))',
  boxShadow: '0 10px 30px -18px rgb(0 0 0 / 0.35)',
};

export function Analytics() {
  const entries = useAppSelector((s) => s.progress.entries);
  const mistakes = useAppSelector((s) => s.mistakes.items);
  const focusSessions = useAppSelector((s) => s.focus.sessions);
  const history = useAppSelector((s) => s.revision.history);

  const coverage = useMemo(() => juzCoverage(entries), [entries]);
  const strengthData = useMemo(() => {
    const counts: Record<string, number> = { weak: 0, medium: 0, strong: 0, veryStrong: 0 };
    for (const e of entries) counts[e.strength] = (counts[e.strength] ?? 0) + 1;
    return (Object.keys(counts) as Array<'weak' | 'medium' | 'strong' | 'veryStrong'>)
      .filter((k) => counts[k] > 0)
      .map((k) => ({ name: STRENGTH_LABEL[k], value: counts[k] }));
  }, [entries]);

  const focusWeek = useMemo(() => {
    const days: Array<{ day: string; minutes: number }> = [];
    const now = new Date(todayStr());
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const start = d.getTime();
      const end = start + 86400000;
      const min = Math.round(
        focusSessions
          .filter((f) => {
            const t = new Date(f.startedAt).getTime();
            return t >= start && t < end;
          })
          .reduce((n, f) => n + f.durationSec, 0) / 60,
      );
      days.push({ day: d.toLocaleDateString('ar-EG', { weekday: 'short' }), minutes: min });
    }
    return days;
  }, [focusSessions]);

  const mistakesByType = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const m of mistakes) counts[m.type] = (counts[m.type] ?? 0) + m.count;
    return Object.entries(counts).map(([type, value]) => ({
      name: type === 'tajweed' ? 'تجويد' : type === 'word' ? 'كلمة' : type === 'order' ? 'ترتيب' : 'نسيان',
      value,
    }));
  }, [mistakes]);

  const totalAyahs = totalMemorizedAyahs(entries);
  const totalFocusMin = Math.round(focusSessions.reduce((n, f) => n + f.durationSec, 0) / 60);

  return (
    <div>
      <PageHeader
        icon="chart"
        title="الإحصائيات"
        sub="تقدّمك في الحفظ والمراجعة والتركيز — من بياناتك المحلية فقط."
      />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="آيات محفوظة" value={`${fmtNum(totalAyahs)} / ٦٬٢٣٦`} sub={`${fmtNum(Math.round((totalAyahs / 6236) * 100))}٪ من المصحف`} icon="book" />
        <Stat label="سور/نطاقات" value={fmtNum(entries.length)} sub="في جدول الحفظ" icon="layers" />
        <Stat label="مراجعات مسجلة" value={fmtNum(history.length)} sub="منذ البداية" icon="repeat" />
        <Stat label="دقائق تركيز" value={fmtNum(totalFocusMin)} sub="إجمالي الجلسات" icon="timer" />
      </div>

      <Card className="mt-3">
        <CardHead title="التغطية حسب الجزء" sub="آيات محفوظة من كل جزء (٣٠ جزءاً)" />
        <CardBody>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={coverage.map((c) => ({ juz: `ج${fmtNum(c.juz)}`, محفوظ: c.memorized, الكل: c.total }))}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="juz" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: 'rgb(var(--c-text))' }} itemStyle={{ color: 'rgb(var(--c-text))' }} />
                <Bar dataKey="محفوظ" fill="rgb(var(--c-primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardBody>
      </Card>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <Card>
          <CardHead title="توزيع قوة الحفظ" sub="عدد النطاقات بكل مستوى" />
          <CardBody>
            {strengthData.length === 0 ? (
              <p className="text-sm text-muted">لا بيانات بعد.</p>
            ) : (
              <div style={{ width: '100%', height: 220 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={strengthData} dataKey="value" nameKey="name" outerRadius={80} label>
                      {strengthData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: 'rgb(var(--c-text))' }} itemStyle={{ color: 'rgb(var(--c-text))' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHead title="دقائق التركيز — آخر ٧ أيام" />
          <CardBody>
            <div style={{ width: '100%', height: 220 }}>
              <ResponsiveContainer>
                <BarChart data={focusWeek}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: 'rgb(var(--c-text))' }} itemStyle={{ color: 'rgb(var(--c-text))' }} />
                  <Bar dataKey="minutes" name="دقائق" fill="rgb(var(--c-accent))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>
      </div>

      <Card className="mt-3">
        <CardHead title="الأخطاء حسب النوع" sub="مجموع التكرارات" />
        <CardBody>
          {mistakesByType.length === 0 ? (
            <p className="text-sm text-muted">لا أخطاء مسجلة — أحسنت!</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {mistakesByType.map((m) => (
                <li key={m.name} className="flex items-center gap-2 text-sm">
                  <span className="w-16 font-bold">{m.name}</span>
                  <span className="h-3 rounded-full bg-primary" style={{ width: `${Math.min(100, m.value * 12)}%`, minWidth: 12 }} />
                  <span className="text-muted">{fmtNum(m.value)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
