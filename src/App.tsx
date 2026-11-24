// App shell: hydration before first render, hash routing (PWA shortcuts +
// back button), theme application, service-worker update toast.
import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { registerSW } from 'virtual:pwa-register';
import { useAppSelector } from './store/store';
import { generateRecurringToday, hydrate } from './store/store';
import { resolveMode } from './lib/themes';
import { syncThemeColor, updateAppBadge } from './lib/pwa';
import { loadQuranData } from './lib/quran';
import { revisionDueCount } from './lib/review';
import { todayStr } from './lib/utils';
import { Layout, NAV } from './components/Layout';
import type { PageId } from './components/Layout';
import { UpdateToast } from './components/Pwa';
import { Icon } from './components/icons';

const Dashboard = lazy(() => import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })));
const Reader = lazy(() => import('./pages/Reader').then((m) => ({ default: m.Reader })));
const Memorization = lazy(() => import('./pages/Memorization').then((m) => ({ default: m.Memorization })));
const Revision = lazy(() => import('./pages/Revision').then((m) => ({ default: m.Revision })));
const Focus = lazy(() => import('./pages/Focus').then((m) => ({ default: m.Focus })));
const Mistakes = lazy(() => import('./pages/Mistakes').then((m) => ({ default: m.Mistakes })));
const Mutashabihat = lazy(() => import('./pages/Mutashabihat').then((m) => ({ default: m.Mutashabihat })));
const Analytics = lazy(() => import('./pages/Analytics').then((m) => ({ default: m.Analytics })));
const Planner = lazy(() => import('./pages/Planner').then((m) => ({ default: m.Planner })));
const BackupPage = lazy(() => import('./pages/BackupPage').then((m) => ({ default: m.BackupPage })));
const HowTo = lazy(() => import('./pages/HowTo').then((m) => ({ default: m.HowTo })));

const VALID_PAGES = new Set<string>(NAV.map((n) => n.id));

function pageFromHash(): PageId {
  const raw = window.location.hash.replace(/^#\/?/, '');
  return VALID_PAGES.has(raw) ? (raw as PageId) : 'dashboard';
}

function PageSkeleton() {
  return (
    <div className="animate-fade-in">
      <div className="h-8 w-44 rounded-lg bg-surface2" />
      <div className="mt-2 h-4 w-72 max-w-full rounded bg-surface2/70" />
      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl border border-line bg-surface" />
        ))}
      </div>
      <div className="mt-3 h-56 rounded-3xl border border-line bg-surface" />
    </div>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [page, setPage] = useState<PageId>(pageFromHash);
  const [swUpdate, setSwUpdate] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const updateSW = useRef<((reloadPage?: boolean) => Promise<void>) | null>(null);
  const prefs = useAppSelector((s) => s.prefs);
  const today = todayStr();
  const openTasks = useAppSelector((s) =>
    s.tasks.daily.filter((t) => t.date <= today && !t.done && t.kind !== 'fixation').length,
  );
  const revisionDue = useAppSelector((s) =>
    revisionDueCount(s.progress.entries, s.tasks.daily, s.prefs, s.wird.items, today),
  );
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (ready) {
      updateAppBadge(openTasks + revisionDue);
    }
  }, [ready, openTasks, revisionDue]);

  useEffect(() => {
    let live = true;
    Promise.all([hydrate(), loadQuranData()])
      .catch(() => {
        // The shell still opens; verse text retries on the next launch.
      })
      .then(() => {
        if (!live) return;
        generateRecurringToday();
        setReady(true);
      });
    return () => {
      live = false;
    };
  }, []);

  // Hash keeps the current page in the URL: works with the browser back
  // button, PWA shortcuts, and a reload on the same screen.
  useEffect(() => {
    const onHash = () => setPage(pageFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const navigate = (next: PageId) => {
    setPage(next);
    if (window.location.hash !== `#${next}`) window.location.hash = next;
  };

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.palette = prefs.palette;
    const apply = () => {
      root.dataset.mode = resolveMode(prefs.mode);
      requestAnimationFrame(() => syncThemeColor());
    };
    apply();
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [prefs.palette, prefs.mode]);

  useEffect(() => {
    updateSW.current = registerSW({
      immediate: true,
      onNeedRefresh() {
        setSwUpdate(true);
      },
      onOfflineReady() {
        setOfflineReady(true);
      },
      onRegisteredSW(_url, registration) {
        if (!registration) return;
        const check = () => {
          if (navigator.onLine) void registration.update();
        };
        window.setInterval(check, 60 * 60 * 1000);
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') check();
        });
      },
    });
    return () => {
      updateSW.current = null;
    };
  }, []);

  useEffect(() => {
    if (!offlineReady) return;
    const timer = window.setTimeout(() => setOfflineReady(false), 4500);
    return () => window.clearTimeout(timer);
  }, [offlineReady]);

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-appbg px-6">
        <div className="animate-fade-up text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-line bg-surface shadow-lift">
            <img src="/icon.svg" alt="" className="h-14 w-14 rounded-2xl" />
          </div>
          <p className="mt-4 font-display text-2xl font-bold">HifzFlow</p>
          <p className="mt-1 text-sm text-muted">جارٍ فتح مصحفك من جهازك…</p>
          <div className="mx-auto mt-4 h-1 w-36 overflow-hidden rounded-full bg-surface2">
            <div className="h-full w-1/2 animate-pulse-soft rounded-full bg-primary" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout page={page} onNavigate={navigate}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={page}
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <Suspense fallback={<PageSkeleton />}>
            {page === 'dashboard' && <Dashboard go={navigate} />}
            {page === 'reader' && <Reader />}
            {page === 'memorization' && <Memorization />}
            {page === 'revision' && <Revision />}
            {page === 'focus' && <Focus />}
            {page === 'mistakes' && <Mistakes />}
            {page === 'mutashabihat' && <Mutashabihat />}
            {page === 'analytics' && <Analytics />}
            {page === 'planner' && <Planner />}
            {page === 'backup' && <BackupPage />}
            {page === 'howto' && <HowTo />}
          </Suspense>
        </motion.div>
      </AnimatePresence>

      {swUpdate && (
        <UpdateToast
          onUpdate={() => {
            void updateSW.current?.(true);
          }}
          onDismiss={() => setSwUpdate(false)}
        />
      )}

      {!swUpdate && offlineReady && (
        <div
          role="status"
          className="fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-50 mx-auto flex max-w-md animate-fade-up items-center gap-2 rounded-2xl border border-line bg-surface p-3 text-sm shadow-lift md:bottom-5"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primarysoft text-primary">
            <Icon name="check-circle" size={17} />
          </span>
          <div>
            <p className="font-bold">جاهز للعمل دون اتصال</p>
            <p className="text-xs text-muted">التطبيق محفوظ على جهازك ويفتح بدون إنترنت.</p>
          </div>
        </div>
      )}
    </Layout>
  );
}
