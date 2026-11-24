// Quiz mode over the same dataset: 10 multiple-choice questions drawn from
// rules, prophet stories, and the surahs where each passage occurs.
import { useState } from 'react';
import { Badge, Btn, Card, CardBody, CardHead, ProgressBar } from '../ui';
import { cx, fmtNum } from '../../lib/utils';
import type { IndexedEntry } from '../../lib/mutashabihat';
import {
  INDEXED_ENTRIES, RULE_ENTRIES, SECTIONS, SECTION_COUNTS,
} from '../../lib/mutashabihat';

const QUESTION_COUNT = 10;

type Question = {
  entry: IndexedEntry;
  ask: string;
  correct: string;
  options: string[];
};

function shuffle<T>(items: T[]): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function surahsOf(entry: IndexedEntry): string {
  if (entry.surahNames.length > 0) return entry.surahNames.join('، ');
  return entry.surah ?? '—';
}

function buildQuestion(pool: IndexedEntry[], scope: string): Question {
  const entries = scope ? pool.filter((e) => e.sec === scope) : pool;
  const source = entries.length > 0 ? entries : pool;
  const entry = source[Math.floor(Math.random() * source.length)];

  const types: Array<'rule' | 'prophet' | 'surahs'> = [];
  if (entry.rule) types.push('rule');
  if (entry.prophet) types.push('prophet');
  if (entry.surahNames.length >= 2 || (!types.length && entry.surah)) types.push('surahs');
  const type = types[Math.floor(Math.random() * types.length)] ?? 'surahs';

  if (type === 'rule' && entry.rule) {
    const others = Array.from(
      new Set(RULE_ENTRIES.map((e) => e.rule).filter((r): r is string => Boolean(r) && r !== entry.rule)),
    );
    return {
      entry,
      ask: 'ما الضابط الذي يساعد على ضبط هذا التشابه؟',
      correct: entry.rule,
      options: shuffle([entry.rule, ...shuffle(others).slice(0, 3)]),
    };
  }

  if (type === 'prophet' && entry.prophet) {
    const others = Array.from(
      new Set(pool.map((e) => e.prophet).filter((p): p is string => Boolean(p) && p !== entry.prophet)),
    );
    return {
      entry,
      ask: 'هذا التشابه من متشابهات قصة أي نبي؟',
      correct: entry.prophet,
      options: shuffle([entry.prophet, ...shuffle(others).slice(0, 3)]),
    };
  }

  const correct = surahsOf(entry);
  const alternatives = new Set<string>();
  let tries = 0;
  while (alternatives.size < 3 && tries < 60) {
    tries++;
    const other = source[Math.floor(Math.random() * source.length)];
    const value = surahsOf(other);
    if (value && value !== correct) alternatives.add(value);
  }
  return {
    entry,
    ask: 'في أي سور وردت مواضع هذا التشابه؟',
    correct,
    options: shuffle([correct, ...Array.from(alternatives)]),
  };
}

export function QuizTab() {
  const [scope, setScope] = useState('');
  const [phase, setPhase] = useState<'intro' | 'playing' | 'done'>('intro');
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [question, setQuestion] = useState<Question | null>(null);
  const [chosen, setChosen] = useState<string | null>(null);

  const start = () => {
    setPhase('playing');
    setIndex(0);
    setScore(0);
    setChosen(null);
    setQuestion(buildQuestion(INDEXED_ENTRIES, scope));
  };

  const next = () => {
    const nextIndex = index + 1;
    if (nextIndex >= QUESTION_COUNT) {
      setPhase('done');
      return;
    }
    setIndex(nextIndex);
    setChosen(null);
    setQuestion(buildQuestion(INDEXED_ENTRIES, scope));
  };

  const choose = (option: string) => {
    if (chosen !== null || !question) return;
    setChosen(option);
    if (option === question.correct) setScore((s) => s + 1);
  };

  if (phase === 'intro') {
    return (
      <Card>
        <CardHead
          title="اختبر نفسك في ضبط المتشابهات"
          sub={`${fmtNum(QUESTION_COUNT)} أسئلة اختيار من متعدد: الضابط، أو قصة النبي، أو السور التي وردت فيها المواضع.`}
        />
        <CardBody className="flex flex-col gap-4">
          <p className="text-sm leading-relaxed text-muted">
            بعض المدخلات ما زالت غير موثوقة؛ الهدف من الاختبار هو التدرّب على الضبط،
            وراجع المصحف دائمًا.
          </p>
          <div>
            <p className="mb-2 text-[11px] font-semibold text-muted">نطاق الاختبار</p>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                aria-pressed={scope === ''}
                onClick={() => setScope('')}
                className={cx(
                  'rounded-full border px-3 py-1.5 text-[12px] font-semibold transition',
                  scope === ''
                    ? 'border-primary bg-primary text-white'
                    : 'border-line bg-surface text-muted hover:border-primary/40 hover:text-ink',
                )}
              >
                كل المدخلات
              </button>
              {SECTIONS.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  aria-pressed={scope === s.key}
                  onClick={() => setScope(s.key)}
                  className={cx(
                    'rounded-full border px-3 py-1.5 text-[12px] font-semibold transition',
                    scope === s.key
                      ? 'border-primary bg-primary text-white'
                      : 'border-line bg-surface text-muted hover:border-primary/40 hover:text-ink',
                  )}
                >
                  {s.label} ({fmtNum(SECTION_COUNTS[s.key] ?? 0)})
                </button>
              ))}
            </div>
          </div>
          <div>
            <Btn onClick={start} className="px-6">ابدأ الاختبار</Btn>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (phase === 'done') {
    const message =
      score >= 9 ? 'ممتاز — ضبطك قوي، واصل المراجعة مع المصحف.'
        : score >= 6 ? 'جيد — ركّز على المدخلات التي أخطأت فيها وراجعها.'
          : score >= 4 ? 'بداية طيبة — تصفّح البطاقات وراجع الضوابط ثم حاول ثانية.'
            : 'لا بأس — تصفّح قسم البحث أولًا وتدرّب على الضوابط، ثم أعد المحاولة.';
    return (
      <Card>
        <CardBody className="flex flex-col items-center gap-3 py-8 text-center">
          <Badge tone="soft">انتهى الاختبار</Badge>
          <p className="font-display text-4xl font-bold tabular-nums">
            {fmtNum(score)} / {fmtNum(QUESTION_COUNT)}
          </p>
          <p className="max-w-md text-sm leading-relaxed text-muted">{message}</p>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            <Btn onClick={start}>اختبار جديد</Btn>
            <Btn variant="outline" onClick={() => { setPhase('intro'); setQuestion(null); }}>
              تغيير النطاق
            </Btn>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (!question) return null;
  const entry = question.entry;
  const sub = [
    entry.juz ? `الجزء ${fmtNum(entry.juz)}` : '',
    entry.pos ? (entry.pos === 2 ? 'موضعان' : `${fmtNum(entry.pos)} مواضع`) : '',
    entry.sec,
  ].filter(Boolean).join(' · ');
  const isCorrect = chosen !== null && chosen === question.correct;

  return (
    <Card>
      <CardBody className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted">
          <span>السؤال {fmtNum(index + 1)} من {fmtNum(QUESTION_COUNT)}</span>
          <span>النقاط: {fmtNum(score)}</span>
        </div>
        <ProgressBar value={index} max={QUESTION_COUNT} label="تقدم الاختبار" />

        <div>
          <p className="text-[15px] font-bold leading-relaxed">{entry.topic || '—'}</p>
          <p className="mt-0.5 text-[11px] text-muted">{sub}</p>
          <p className="mt-3 text-[13px] font-bold text-primary">{question.ask}</p>
        </div>

        <div className="flex flex-col gap-2" role="group" aria-label="خيارات الإجابة">
          {question.options.map((option) => {
            const right = chosen !== null && option === question.correct;
            const wrong = chosen !== null && option === chosen && option !== question.correct;
            return (
              <button
                key={option}
                type="button"
                disabled={chosen !== null}
                onClick={() => choose(option)}
                className={cx(
                  'min-h-11 rounded-xl border px-3 py-2 text-start text-[13px] font-semibold leading-relaxed transition',
                  right
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100'
                    : wrong
                      ? 'border-red-500 bg-red-50 text-red-900 dark:bg-red-950/40 dark:text-red-100'
                      : 'border-line bg-appbg hover:border-primary/50',
                )}
              >
                {option}
              </button>
            );
          })}
        </div>

        <p
          aria-live="polite"
          className={cx(
            'min-h-5 text-sm font-bold',
            chosen === null ? 'text-muted' : isCorrect ? 'text-emerald-600 dark:text-emerald-300' : 'text-red-600 dark:text-red-300',
          )}
        >
          {chosen === null
            ? ''
            : isCorrect
              ? 'أحسنت! إجابة صحيحة.'
              : 'ليست الإجابة الصحيحة — الصواب مظلَّل بالأخضر.'}
        </p>

        <div className="flex flex-wrap gap-2">
          {chosen !== null && (
            <Btn onClick={next}>{index + 1 === QUESTION_COUNT ? 'عرض النتيجة' : 'السؤال التالي'}</Btn>
          )}
          <Btn variant="ghost" onClick={() => { setPhase('intro'); setQuestion(null); }}>
            إنهاء الاختبار
          </Btn>
        </div>
      </CardBody>
    </Card>
  );
}
