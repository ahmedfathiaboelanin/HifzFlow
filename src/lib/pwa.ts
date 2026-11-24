// PWA helpers: install prompt capture, online state, theme-color sync,
// screen wake lock, app badge, haptics, share, and notifications.
import { useEffect, useReducer, useRef, useState } from 'react';

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'hifzflow-install-dismissed';

let deferredPrompt: InstallPromptEvent | null = null;
let appInstalled = false;
const subscribers = new Set<() => void>();

function emit() {
  subscribers.forEach((fn) => fn());
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event as InstallPromptEvent;
    emit();
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    appInstalled = true;
    emit();
  });
}

export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches ||
    // iOS Safari exposes a non-standard flag.
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function isIosDevice(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (ua.includes('Macintosh') && 'ontouchend' in document);
}

function readDismissed(): boolean {
  try {
    return window.localStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}

export function usePwaInstall() {
  const [, force] = useReducer((n: number) => n + 1, 0);
  const [dismissed, setDismissed] = useState(readDismissed);

  useEffect(() => {
    const onChange = () => force();
    subscribers.add(onChange);
    return () => {
      subscribers.delete(onChange);
    };
  }, []);

  const installed = appInstalled || isStandalone();
  const ios = isIosDevice();
  const canPrompt = deferredPrompt !== null;

  return {
    /** True when the browser is ready to show a native install prompt. */
    canPrompt,
    /** True when the app is already running installed. */
    installed,
    /** iOS has no prompt: show Share → Add to Home Screen instructions. */
    ios,
    /** Whether the user hid the install invitation. */
    dismissed,
    /** Chrome/Edge/Android install prompt. */
    promptInstall: async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
      if (!deferredPrompt) return 'unavailable';
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      deferredPrompt = null;
      emit();
      return outcome;
    },
    dismiss: () => {
      try {
        window.localStorage.setItem(DISMISS_KEY, '1');
      } catch {
        /* storage blocked: hide for this session only */
      }
      setDismissed(true);
    },
    /** Only show the invitation when there is something to act on. */
    show: !installed && !dismissed && (canPrompt || ios),
  };
}

export function useOnline(): boolean {
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, []);
  return online;
}

/** Keep the browser/PWA chrome colour in step with the active palette + mode. */
export function syncThemeColor() {
  if (typeof document === 'undefined') return;
  const triplet = getComputedStyle(document.documentElement).getPropertyValue('--c-bg').trim();
  if (!triplet) return;
  const color = `rgb(${triplet})`;
  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'theme-color';
    document.head.appendChild(meta);
  }
  meta.content = color;
  document.documentElement.style.backgroundColor = color;
}

/**
 * Screen Wake Lock API — keeps screen awake during Quran reading & focus sessions.
 * Automatically releases on unmount and re-acquires on visibilitychange.
 */
export function useWakeLock() {
  const [active, setActive] = useState(false);
  const supported = typeof navigator !== 'undefined' && 'wakeLock' in navigator;
  const sentinelRef = useRef<any>(null);
  const requestedRef = useRef(false);

  const request = async () => {
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) return false;
    try {
      requestedRef.current = true;
      const sentinel = await (navigator as any).wakeLock.request('screen');
      sentinelRef.current = sentinel;
      sentinel.addEventListener('release', () => {
        if (!requestedRef.current) {
          setActive(false);
          sentinelRef.current = null;
        }
      });
      setActive(true);
      return true;
    } catch {
      setActive(false);
      return false;
    }
  };

  const release = async () => {
    requestedRef.current = false;
    if (sentinelRef.current) {
      try {
        await sentinelRef.current.release();
      } catch {
        // ignore
      }
      sentinelRef.current = null;
    }
    setActive(false);
  };

  const toggle = async () => {
    if (active) await release();
    else await request();
  };

  useEffect(() => {
    const onVis = async () => {
      if (requestedRef.current && document.visibilityState === 'visible') {
        await request();
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      void release();
    };
  }, []);

  return { supported, active, request, release, toggle };
}

/**
 * App Badging API: updates icon badge number (e.g. unreviewed items + due tasks).
 */
export function updateAppBadge(count: number) {
  if (typeof navigator === 'undefined') return;
  const nav = navigator as any;
  if ('setAppBadge' in nav) {
    if (count > 0) {
      nav.setAppBadge(count).catch(() => {});
    } else {
      nav.clearAppBadge().catch(() => {});
    }
  }
}

/**
 * Haptic feedback vibration for mobile/PWA users.
 */
export function haptic(pattern: number | number[] = 25) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // unsupported / ignored
    }
  }
}

export const hapticTap = () => haptic(20);
export const hapticSuccess = () => haptic([25, 45, 30]);
export const hapticWarn = () => haptic([40, 60, 40]);

/**
 * Web Share API: native share with fallback to clipboard.
 */
export async function shareContent(data: { title: string; text: string; url?: string }): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share(data);
      return true;
    } catch (e: any) {
      if (e?.name === 'AbortError') return false;
    }
  }
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    try {
      const full = `${data.title}\n\n${data.text}${data.url ? `\n\n${data.url}` : ''}`;
      await navigator.clipboard.writeText(full);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Notification helper for daily revision reminders.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'denied';
  try {
    return await Notification.requestPermission();
  } catch {
    return 'denied';
  }
}

export function sendLocalNotification(title: string, options?: NotificationOptions) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        icon: '/icon-192.png',
        badge: '/icon.svg',
        dir: 'rtl',
        lang: 'ar',
        ...options,
      });
    } catch {
      // In mobile standalone PWA, service worker is required for notifications
      navigator.serviceWorker?.ready.then((reg) => {
        reg.showNotification(title, {
          icon: '/icon-192.png',
          badge: '/icon.svg',
          dir: 'rtl',
          lang: 'ar',
          ...options,
        });
      }).catch(() => {});
    }
  }
}
