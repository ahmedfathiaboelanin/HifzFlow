// PWA surfaces: install invitation, iOS instructions, offline notice, update toast.
import { useState } from 'react';
import { Icon } from './icons';
import { Btn, Modal } from './ui';
import { useOnline, usePwaInstall } from '../lib/pwa';
import { cx } from '../lib/utils';

export function InstallCard({ className }: { className?: string }) {
  const pwa = usePwaInstall();
  const [iosHelp, setIosHelp] = useState(false);
  if (!pwa.show) return null;

  const activate = async () => {
    if (pwa.ios) {
      setIosHelp(true);
      return;
    }
    await pwa.promptInstall();
  };

  return (
    <>
      <div className={cx('relative overflow-hidden rounded-2xl border border-primary/25 bg-primarysoft/60 p-3', className)}>
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-white">
            <Icon name="install" size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">ثبّت HifzFlow على جهازك</p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted">
              {pwa.ios
                ? 'من زر المشاركة في سفاري اختر «إضافة إلى الشاشة الرئيسية» — يفتح كتطبيق ويعمل دون إنترنت.'
                : 'يفتح في نافذة مستقلة، أسرع في الفتح، ويعمل دون اتصال.'}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <Btn size="sm" onClick={() => void activate()}>تثبيت التطبيق</Btn>
              <button className="text-xs font-semibold text-muted hover:text-ink" onClick={pwa.dismiss}>
                ليس الآن
              </button>
            </div>
          </div>
          <button
            onClick={pwa.dismiss}
            className="rounded-lg p-1 text-muted hover:bg-surface2 hover:text-ink"
            aria-label="إخفاء دعوة التثبيت"
          >
            <Icon name="x" size={14} />
          </button>
        </div>
      </div>

      {iosHelp && (
        <Modal title="إضافة HifzFlow إلى الشاشة الرئيسية" onClose={() => setIosHelp(false)}>
          <ol className="flex flex-col gap-3 text-sm">
            <li className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primarysoft text-xs font-bold text-primary">١</span>
              <span className="pt-0.5">افتح التطبيق في <b>سفاري</b> (وليس متصفحاً آخر).</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primarysoft text-xs font-bold text-primary">٢</span>
              <span className="flex flex-wrap items-center gap-1.5 pt-0.5">
                اضغط زر المشاركة <Icon name="share" size={16} /> في شريط سفاري.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primarysoft text-xs font-bold text-primary">٣</span>
              <span className="pt-0.5">اختر <b>«إضافة إلى الشاشة الرئيسية»</b> ثم <b>«إضافة»</b>.</span>
            </li>
          </ol>
          <div className="mt-4 flex justify-end">
            <Btn onClick={() => setIosHelp(false)}>فهمت</Btn>
          </div>
        </Modal>
      )}
    </>
  );
}

export function InstallButton() {
  const pwa = usePwaInstall();
  const [iosHelp, setIosHelp] = useState(false);
  if (!pwa.show) return null;
  return (
    <>
      <button
        onClick={() => void (pwa.ios ? setIosHelp(true) : pwa.promptInstall())}
        className="flex w-full items-center gap-2 rounded-xl border border-primary/30 bg-primarysoft/60 px-3 py-2 text-xs font-bold text-primary transition hover:bg-primarysoft"
      >
        <Icon name="install" size={15} />
        تثبيت التطبيق
      </button>
      {iosHelp && (
        <Modal title="إضافة HifzFlow إلى الشاشة الرئيسية" onClose={() => setIosHelp(false)}>
          <p className="text-sm leading-relaxed">
            من سفاري: اضغط زر المشاركة ثم «إضافة إلى الشاشة الرئيسية» ثم «إضافة». بعدها افتح HifzFlow من الأيقونة.
          </p>
          <div className="mt-4 flex justify-end">
            <Btn onClick={() => setIosHelp(false)}>فهمت</Btn>
          </div>
        </Modal>
      )}
    </>
  );
}

export function OfflineBanner() {
  const online = useOnline();
  if (online) return null;
  return (
    <div
      role="status"
      className="mb-3 flex items-center gap-2 rounded-xl border border-amber-300/60 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-200"
    >
      <Icon name="wifi-off" size={15} />
      أنت غير متصل — التطبيق يعمل من نسخته المحفوظة، وكل تعديلاتك تُحفظ على جهازك.
    </div>
  );
}

export function UpdateToast({ onUpdate, onDismiss }: { onUpdate: () => void; onDismiss: () => void }) {
  return (
    <div
      role="status"
      className="fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-50 mx-auto flex max-w-md animate-fade-up items-center gap-3 rounded-2xl border border-line bg-surface p-3 shadow-lift md:bottom-5"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primarysoft text-primary">
        <Icon name="refresh" size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold">نسخة جديدة جاهزة</p>
        <p className="text-xs text-muted">أعد التحميل لتطبيق آخر تحديثات التطبيق.</p>
      </div>
      <Btn size="sm" onClick={onUpdate}>تحديث</Btn>
      <button onClick={onDismiss} className="rounded-lg p-1 text-muted hover:bg-surface2 hover:text-ink" aria-label="لاحقاً">
        <Icon name="x" size={15} />
      </button>
    </div>
  );
}
