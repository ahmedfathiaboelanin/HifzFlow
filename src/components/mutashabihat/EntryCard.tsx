// One mutashabih card: refs, verified verse text, rule, tashabuh/farq notes,
// expandable source detail, and the trust markers from the source dataset.
import { useState } from 'react';
import { Badge } from '../ui';
import { Icon } from '../icons';
import { cx, fmtNum } from '../../lib/utils';
import type { IndexedEntry, MutashabihRef } from '../../lib/mutashabihat';
import { formatPage } from '../../lib/mutashabihat';

function RefChip({ entry, reference }: { entry: IndexedEntry; reference: MutashabihRef }) {
  const ayahs = (reference.ayahs ?? []).filter((n) => n != null);
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-1 rounded-lg border border-line bg-appbg px-2 py-1 text-[12px] leading-5">
      <span className="font-semibold">{reference.surah}</span>
      {ayahs.length > 0 ? (
        <>
          <span className="text-muted">:</span>
          {ayahs.map((n) => {
            const verified = entry.verseKeys.has(`${reference.surah}|${n}`);
            return (
              <span
                key={n}
                title={
                  verified
                    ? 'نص الآية موثّق من المصحف'
                    : 'رقم الآية كما ورد في المصدر، ونصها غير موثوق — راجع المصحف'
                }
                className={cx(
                  'tabular-nums',
                  verified
                    ? 'text-ink'
                    : 'text-amber-700 underline decoration-dotted underline-offset-2 dark:text-amber-300',
                )}
              >
                {fmtNum(n)}
              </span>
            );
          })}
        </>
      ) : (
        <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">(بلا رقم آية)</span>
      )}
    </span>
  );
}

export function EntryCard({ entry }: { entry: IndexedEntry }) {
  const [open, setOpen] = useState(false);
  const verifiedVerses = entry.verses?.length ?? 0;
  const posLabel = entry.pos === 2 ? 'موضعان' : `${fmtNum(entry.pos)} مواضع`;

  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4 shadow-soft transition hover:border-primary/30 sm:rounded-3xl">
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge tone="soft">{entry.sec}</Badge>
        <span className="ms-auto font-mono text-[10px] text-muted/80">{entry.id}</span>
      </div>

      <h3 className="text-[15px] font-bold leading-relaxed">{entry.topic || '—'}</h3>

      <div className="flex flex-wrap items-center gap-1.5">
        {entry.juz && (
          <span className="rounded-full border border-line bg-surface2 px-2 py-0.5 text-[11px] font-semibold text-muted">
            الجزء {fmtNum(entry.juz)}
          </span>
        )}
        {entry.prophet && (
          <span className="rounded-full border border-accent/40 px-2 py-0.5 text-[11px] font-semibold text-accent">
            قصة {entry.prophet}
          </span>
        )}
        {entry.pos > 0 && (
          <span className="rounded-full border border-line bg-surface2 px-2 py-0.5 text-[11px] font-semibold text-muted">
            {posLabel}
          </span>
        )}
        {entry.ayahs.length === 0 && <Badge tone="danger">بلا أرقام آيات</Badge>}
        {entry.unv ? (
          <Badge tone="warn" dot>غير موثوق — راجع المصحف</Badge>
        ) : verifiedVerses > 0 ? (
          <Badge tone="ok" dot>الآيات موثّقة من المصحف</Badge>
        ) : null}
      </div>

      {entry.refs?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {entry.refs.map((reference, i) => (
            <RefChip key={`${reference.surah}-${i}`} entry={entry} reference={reference} />
          ))}
        </div>
      )}

      {verifiedVerses > 0 && (
        <div className="flex flex-col gap-2">
          {entry.verses.map((v) => (
            <div key={`${v.s}-${v.a}`}>
              <p className="mb-0.5 text-[11px] font-bold text-primary">
                {v.s} : {fmtNum(v.a)}
              </p>
              <p
                dir="rtl"
                lang="ar"
                className="rounded-xl border border-primary/10 bg-primarysoft/60 px-3 py-2 font-quran text-[1.05rem] leading-[2.05]"
              >
                ﴿{v.t}﴾
              </p>
            </div>
          ))}
        </div>
      )}

      {entry.rule && (
        <p className="text-[13px] leading-relaxed">
          <span className="font-bold text-muted">الضابط: </span>
          {entry.rule}
        </p>
      )}

      {(entry.sim || entry.diff) && (
        <div className="flex flex-col gap-1 text-[13px] leading-relaxed text-muted">
          {entry.sim && (
            <p><span className="font-bold text-ink">وجه التشابه: </span>{entry.sim}</p>
          )}
          {entry.diff && (
            <p><span className="font-bold text-ink">وجه الاختلاف: </span>{entry.diff}</p>
          )}
        </div>
      )}

      <div className="border-t border-dashed border-line pt-2">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-1 py-1 text-[13px] font-bold text-primary"
        >
          {open ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}
          <Icon name="chevron-down" size={14} className={cx('transition-transform', open && 'rotate-180')} />
        </button>
        {open && (
          <div className="mt-1 animate-fade-in">
            <p className="whitespace-pre-line font-quran text-[1.02rem] leading-[2.05]">{entry.detail}</p>
            <p className="mt-2 text-[11px] leading-relaxed text-amber-700 dark:text-amber-300">
              {entry.unv
                ? 'النص كما ورد في الملف بعد المراجعة: الآيات الموثّقة بنص المصحف، والمقاطع غير الموثّقة كما استُخرجت آليًا وقد تكون مشوَّهة — راجع المصحف.'
                : 'الآيات في هذا النص موثّقة بنص المصحف الأصلي؛ وباقي الكلام رُوجع صفحةً صفحةً مقابل الملف الأصلي.'}
            </p>
          </div>
        )}
      </div>

      <div className="mt-auto flex flex-wrap justify-between gap-2 border-t border-line pt-2 text-[10px] text-muted">
        <span>المصدر: {entry.src}</span>
        <span>صفحة {formatPage(entry.page)} من الملف</span>
      </div>
    </article>
  );
}
