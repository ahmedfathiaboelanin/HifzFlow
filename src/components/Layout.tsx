// App shell: manuscript-quiet sidebar (desktop), compact top bar + thumb nav
// (mobile), theme controls, storage status, install invitation.
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { PALETTES } from '../lib/themes';
import { useAppDispatch, useAppSelector } from '../store/store';
import { prefsSlice } from '../store/slices';
import { revisionDueCount } from '../lib/review';
import { cx, todayStr } from '../lib/utils';
import { Icon } from './icons';
import type { IconName } from './icons';
import { InstallButton, OfflineBanner } from './Pwa';
import { useOnline } from '../lib/pwa';

export type PageId =
  | 'dashboard' | 'reader' | 'memorization' | 'revision' | 'focus'
  | 'mistakes' | 'mutashabihat' | 'analytics' | 'planner' | 'backup' | 'howto'
  | 'schedule';

export const NAV: Array<{ id: PageId; label: string; icon: IconName; group: string }> = [
  { id: 'dashboard', label: 'لوحة التحكم', icon: 'home', group: 'اليوم' },
  { id: 'revision', label: 'المراجعة', icon: 'repeat', group: 'اليوم' },
  { id: 'planner', label: 'المهام', icon: 'calendar', group: 'اليوم' },
  { id: 'reader', label: 'المصحف', icon: 'book', group: 'الدراسة' },
  { id: 'memorization', label: 'الحفظ', icon: 'layers', group: 'الدراسة' },
  { id: 'mistakes', label: 'الأخطاء', icon: 'pen', group: 'الدراسة' },
  { id: 'mutashabihat', label: 'المتشابهات', icon: 'copy', group: 'الدراسة' },
  { id: 'focus', label: 'التركيز', icon: 'timer', group: 'الدراسة' },
  { id: 'analytics', label: 'الإحصائيات', icon: 'chart', group: 'التقدّم' },
  { id: 'backup', label: 'النسخ الاحتياطي', icon: 'database', group: 'بياناتك' },
  { id: 'howto', label: 'طريقة الاستخدام', icon: 'help', group: 'بياناتك' },
];

export const PAGE_TITLE: Record<PageId, string> = {
  ...Object.fromEntries(NAV.map((n) => [n.id, n.label])),
  schedule: 'المراجعة',
} as Record<PageId, string>;

const GROUPS = ['اليوم', 'الدراسة', 'التقدّم', 'بياناتك'];

function ThemeControl({ compact = false }: { compact?: boolean }) {
  const prefs = useAppSelector((s) => s.prefs);
  const dispatch = useAppDispatch();
  const modes = [
    { id: 'light' as const, label: 'فاتح', icon: 'sun' as IconName },
    { id: 'system' as const, label: 'تلقائي', icon: 'monitor' as IconName },
    { id: 'dark' as const, label: 'داكن', icon: 'moon' as IconName },
  ];
  return (
    <div className={cx(compact ? '' : 'border-t border-line pt-3')}>
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold text-muted">
          <Icon name="palette" size={13} /> المظهر
        </p>
        <span className="text-[10px] text-muted">{PALETTES.find((p) => p.id === prefs.palette)?.name}</span>
      </div>
      <div className="mt-2 grid grid-cols-5 gap-1.5">
        {PALETTES.map((p) => {
          const active = prefs.palette === p.id;
          return (
            <button
              key={p.id}
              title={p.name}
              aria-label={`لوحة ${p.name}`}
              aria-pressed={active}
              onClick={() => dispatch(prefsSlice.actions.setPrefs({ palette: p.id }))}
              className={cx(
                'flex h-7 items-center justify-center rounded-lg border-2 transition',
                active ? 'border-ink/70' : 'border-transparent hover:border-line',
              )}
              style={{ backgroundColor: p.swatch }}
            >
              {active && <Icon name="check" size={13} className="text-white" />}
            </button>
          );
        })}
      </div>
      <div className="mt-1.5 grid grid-cols-3 gap-1 rounded-xl bg-surface2 p-0.5">
        {modes.map((m) => {
          const active = prefs.mode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => dispatch(prefsSlice.actions.setPrefs({ mode: m.id }))}
              aria-pressed={active}
              className={cx(
                'flex h-7 items-center justify-center gap-1 rounded-[10px] text-[11px] font-semibold transition',
                active ? 'bg-surface text-ink shadow-soft' : 'text-muted hover:text-ink',
              )}
            >
              <Icon name={m.icon} size={12} /> {m.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StorageLine({ compact = false }: { compact?: boolean }) {
  const storage = useAppSelector((s) => s.meta.storage);
  if (storage === 'indexeddb') {
    return (
      <p className={cx('flex items-center gap-1.5 text-[10px] leading-relaxed text-muted', compact && 'justify-center')}>
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        محفوظ على جهازك — IndexedDB
      </p>
    );
  }
  return (
    <p className="rounded-lg bg-amber-100 p-2 text-[10px] font-semibold leading-relaxed text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
      التخزين المحلي محظور — البيانات في الذاكرة فقط وستضيع عند إغلاق الصفحة. جرّب متصفحاً آخر أو اسمح بالتخزين.
    </p>
  );
}

function NavButton({
  item, current, badge, onClick,
}: { item: (typeof NAV)[number]; current: PageId; badge?: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-current={current === item.id ? 'page' : undefined}
      className="nav-item"
    >
      <Icon name={item.icon} size={17} className="shrink-0 opacity-80" />
      <span className="min-w-0 flex-1 truncate text-start">{item.label}</span>
      {badge ? (
        <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
          {badge > 99 ? '٩٩+' : new Intl.NumberFormat('ar-EG').format(badge)}
        </span>
      ) : null}
    </button>
  );
}

export function Layout({ page, onNavigate, children }: { page: PageId; onNavigate: (p: PageId) => void; children: ReactNode }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const today = todayStr();
  const todayTasks = useAppSelector((s) => s.tasks.daily.filter((t) => t.date <= today && !t.done).length);
  const revisionDue = useAppSelector((s) =>
    revisionDueCount(s.progress.entries, s.tasks.daily, s.prefs, s.wird.items, today),
  );
  const scheduleDue = useAppSelector((s) => {
    const weakDue = s.schedule?.weakParts?.filter((wp) => wp.nextReviewDate <= today).length ?? 0;
    const khatmaPending = s.schedule?.days?.find((d) => d.date === today && !d.done) ? 1 : 0;
    return weakDue + khatmaPending;
  });
  const online = useOnline();
  const current = NAV.find((n) => n.id === page) ?? NAV[0];

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [page]);

  useEffect(() => {
    if (!moreOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMoreOpen(false);
    };
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [moreOpen]);

  const go = (id: PageId) => {
    setMoreOpen(false);
    onNavigate(id);
  };

  const badgeFor = (id: PageId) => {
    if (id === 'planner') return todayTasks;
    if (id === 'revision') return revisionDue;
    if (id === 'schedule') return scheduleDue;
    return 0;
  };

  return (
    <div className="min-h-dvh">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:right-3 focus:top-3 focus:z-[60] focus:rounded-xl focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:font-bold focus:text-white"
      >
        تخطَّ إلى المحتوى
      </a>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 right-0 z-30 hidden w-[264px] flex-col border-l border-line bg-surface/95 backdrop-blur-md md:flex">
        <div className="flex items-center gap-2.5 px-4 pb-3 pt-5">
          <img src="/icon.svg" alt="" className="h-10 w-10 rounded-xl shadow-soft" />
          <div className="min-w-0">
            <p className="font-display text-[1.35rem] font-bold leading-none tracking-tight">HifzFlow</p>
            <p className="mt-1 text-[10px] leading-none text-muted">حفظ القرآن • محلي أولاً</p>
          </div>
          <span
            className={cx('ms-auto h-2 w-2 shrink-0 rounded-full', online ? 'bg-emerald-500' : 'bg-amber-500')}
            title={online ? 'متصل' : 'دون اتصال'}
          />
        </div>

        <nav className="flex-1 overflow-y-auto px-2.5 pb-3" aria-label="التنقل الرئيسي">
          {GROUPS.map((group) => {
            const items = NAV.filter((n) => n.group === group);
            if (items.length === 0) return null;
            return (
              <div key={group} className="mb-3">
                <p className="mb-1 px-3 text-[10px] font-bold text-muted/80">{group}</p>
                <div className="flex flex-col gap-0.5">
                  {items.map((n) => (
                    <NavButton key={n.id} item={n} current={page} badge={badgeFor(n.id)} onClick={() => go(n.id)} />
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="shrink-0 border-t border-line px-3 py-3">
          <InstallButton />
          <div className="mt-3"><ThemeControl /></div>
          <div className="mt-3">
            <StorageLine />
          </div>
          <p className="mt-2 text-[10px] leading-relaxed text-muted/80">
            راجع الآيات من المصحف نفسه — النص هنا مرجع للمراجعة.
          </p>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-line bg-surface/95 px-4 backdrop-blur-md md:hidden">
        <img src="/icon.svg" alt="" className="h-8 w-8 rounded-lg" />
        <div className="min-w-0 leading-tight">
          <p className="font-display text-[1.15rem] font-bold leading-none">HifzFlow</p>
          <p className="mt-1 truncate text-[10px] text-muted">{current.label}</p>
        </div>
        <span
          className={cx('ms-auto h-1.5 w-1.5 rounded-full', online ? 'bg-emerald-500' : 'bg-amber-500')}
          title={online ? 'متصل' : 'دون اتصال'}
        />
        <span className="text-[10px] text-muted">{online ? 'محلي أولاً' : 'دون اتصال'}</span>
      </header>

      {/* Content */}
      <main id="main" className="mx-auto w-full max-w-5xl px-4 pb-28 pt-5 md:ms-[264px] md:px-7 md:pb-12">
        <OfflineBanner />
        {children}
      </main>

      {/* Mobile thumb nav */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
        aria-label="التنقل السريع"
      >
        <div className="mx-auto flex max-w-md items-stretch justify-around">
          {NAV.filter((n) => ['dashboard', 'revision', 'reader', 'focus'].includes(n.id)).map((n) => {
            const active = page === n.id;
            const badge = badgeFor(n.id);
            return (
              <button
                key={n.id}
                onClick={() => go(n.id)}
                aria-current={active ? 'page' : undefined}
                className={cx(
                  'relative flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-semibold transition',
                  active ? 'text-primary' : 'text-muted',
                )}
              >
                {active && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-accent" />}
                <span className={cx('flex h-6 w-6 items-center justify-center rounded-lg', active && 'bg-primarysoft')}>
                  <Icon name={n.icon} size={18} />
                </span>
                {n.label}
                {badge > 0 && (
                  <span className="absolute right-[calc(50%-1.45rem)] top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold text-white">
                    {badge > 9 ? '٩+' : new Intl.NumberFormat('ar-EG').format(badge)}
                  </span>
                )}
              </button>
            );
          })}
          <button
            onClick={() => setMoreOpen(true)}
            aria-expanded={moreOpen}
            className={cx(
              'flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-semibold transition',
              !['dashboard', 'revision', 'reader', 'focus'].includes(page) ? 'text-primary' : 'text-muted',
            )}
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-lg">
              <Icon name="more" size={18} />
            </span>
            المزيد
          </button>
        </div>
      </nav>

      {/* More sheet */}
      {moreOpen && (
        <div className="fixed inset-0 z-40 md:hidden" role="presentation">
          <div className="absolute inset-0 animate-fade-in bg-black/40 backdrop-blur-[2px]" onClick={() => setMoreOpen(false)} />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="كل الأقسام"
            className="absolute inset-x-0 bottom-0 max-h-[86dvh] animate-slide-up overflow-y-auto rounded-t-3xl border-t border-line bg-surface p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-lift"
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line" />
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-xl font-bold">كل الأقسام</h2>
              <button onClick={() => setMoreOpen(false)} aria-label="إغلاق" className="rounded-lg p-1.5 text-muted hover:bg-surface2">
                <Icon name="x" size={18} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {NAV.map((n) => {
                const active = page === n.id;
                const badge = badgeFor(n.id);
                return (
                  <button
                    key={n.id}
                    onClick={() => go(n.id)}
                    aria-current={active ? 'page' : undefined}
                    className={cx(
                      'relative flex flex-col items-center gap-1.5 rounded-2xl border p-3 text-center text-[11px] font-semibold transition',
                      active ? 'border-primary/40 bg-primarysoft text-primary' : 'border-line bg-surface2/60 text-ink',
                    )}
                  >
                    <Icon name={n.icon} size={21} />
                    <span className="leading-tight">{n.label}</span>
                    {badge > 0 && (
                      <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold text-white">
                        {badge > 9 ? '٩+' : new Intl.NumberFormat('ar-EG').format(badge)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="mt-4 rounded-2xl border border-line bg-surface2/50 p-3">
              <ThemeControl compact />
            </div>
            <div className="mt-3"><InstallButton /></div>
            <div className="mt-3"><StorageLine compact /></div>
          </div>
        </div>
      )}
    </div>
  );
}
