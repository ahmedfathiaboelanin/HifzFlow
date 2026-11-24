// Local primitives (shadcn-style API, hand-built for this project).
// Button / Card / Input / Select / Tabs / Dialog / Badge / Progress / PageHeader.
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';
import { cx, fmtNum } from '../lib/utils';
import { Icon } from './icons';
import type { IconName } from './icons';

type BtnVariant = 'primary' | 'outline' | 'ghost' | 'danger' | 'soft';
type BtnSize = 'sm' | 'md' | 'lg' | 'icon';

const BTN_VARIANTS: Record<BtnVariant, string> = {
  primary:
    'bg-primary text-white shadow-soft hover:brightness-[1.06] active:brightness-95 disabled:hover:brightness-100',
  outline: 'border border-line bg-surface text-ink hover:border-primary/40 hover:bg-surface2',
  ghost: 'text-ink hover:bg-surface2',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  soft: 'bg-primarysoft text-primary hover:brightness-[0.98]',
};

const BTN_SIZES: Record<BtnSize, string> = {
  sm: 'h-8 gap-1 rounded-lg px-2.5 text-xs',
  md: 'h-10 gap-1.5 rounded-xl px-3.5 text-sm',
  lg: 'h-11 gap-2 rounded-xl px-5 text-sm',
  icon: 'h-9 w-9 rounded-xl',
};

export function Btn({
  variant = 'primary', size = 'md', className, type = 'button', ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: BtnSize }) {
  return (
    <button
      type={type}
      className={cx(
        'inline-flex select-none items-center justify-center font-semibold transition duration-150 active:scale-[0.985] disabled:pointer-events-none disabled:opacity-50',
        BTN_VARIANTS[variant],
        BTN_SIZES[size],
        className,
      )}
      {...rest}
    />
  );
}

export function IconButton({
  label, name, className, size = 16, ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; name: IconName; size?: number }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cx('inline-flex h-9 w-9 items-center justify-center rounded-xl text-muted transition hover:bg-surface2 hover:text-ink', className)}
      {...rest}
    >
      <Icon name={name} size={size} />
    </button>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx('rounded-2xl border border-line bg-surface shadow-soft sm:rounded-3xl', className)}>{children}</div>;
}

export function CardHead({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-2 border-b border-line px-4 py-3.5">
      <div className="min-w-0">
        <h3 className="text-[15px] font-bold leading-snug">{title}</h3>
        {sub && <p className="mt-0.5 text-xs leading-relaxed text-muted">{sub}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function CardBody({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx('px-4 py-3.5', className)}>{children}</div>;
}

const FIELD =
  'w-full rounded-xl border border-line bg-surface px-3 text-sm text-ink outline-none transition placeholder:text-muted/70 hover:border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/20';

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cx(FIELD, 'h-10', props.className)} />;
}

export function Select({ children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cx(FIELD, 'h-10 cursor-pointer appearance-none bg-[left_0.65rem_center] bg-no-repeat pe-8 ps-3', props.className)}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%23607064' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m4 6.2 4 4 4-4'/%3E%3C/svg%3E\")",
        ...props.style,
      }}
    >
      {children}
    </select>
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cx(FIELD, 'min-h-[2.5rem] py-2 leading-relaxed', props.className)} />;
}

export function Badge({ tone = 'soft', children, dot = false }: { tone?: 'soft' | 'warn' | 'ok' | 'danger'; children: ReactNode; dot?: boolean }) {
  const tones = {
    soft: 'bg-primarysoft text-primary',
    warn: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
    ok: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
    danger: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
  };
  const dots = {
    soft: 'bg-primary',
    warn: 'bg-amber-500',
    ok: 'bg-emerald-500',
    danger: 'bg-red-500',
  };
  return (
    <span className={cx('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold', tones[tone])}>
      {dot && <span className={cx('h-1.5 w-1.5 rounded-full', dots[tone])} />}
      {children}
    </span>
  );
}

export function ProgressBar({ value, max = 100, label }: { value: number; max?: number; label?: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div>
      {label && <p className="mb-1 text-[11px] font-semibold text-muted">{label}</p>}
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-surface2"
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? 'التقدم'}
      >
        <div
          className="h-full rounded-full bg-gradient-to-l from-primary to-primary/75 transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function ProgressRing({
  value, max = 100, size = 104, stroke = 9, children,
}: { value: number; max?: number; size?: number; stroke?: number; children?: ReactNode }) {
  const pct = Math.max(0, Math.min(1, value / max));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-white/15" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          className="text-white transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center leading-tight">{children}</div>
    </div>
  );
}

export function Tabs<T extends string>({
  tabs, value, onChange, label,
}: {
  tabs: Array<{ id: T; label: string }>;
  value: T;
  onChange: (id: T) => void;
  label?: string;
}) {
  return (
    <div className="sticky top-[57px] z-20 -mx-4 border-b border-line/80 bg-appbg/90 px-4 py-2 backdrop-blur-md md:top-0">
      <div className="no-scrollbar flex gap-1 overflow-x-auto" role="tablist" aria-label={label ?? 'أقسام الصفحة'}>
        {tabs.map((t) => {
          const active = value === t.id;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={active}
              onClick={() => onChange(t.id)}
              className={cx(
                'whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition',
                active ? 'bg-primary text-white shadow-soft' : 'text-muted hover:bg-surface2 hover:text-ink',
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-3 backdrop-blur-[2px] sm:items-center"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="max-h-[90dvh] w-full max-w-lg animate-scale-in overflow-y-auto rounded-3xl border border-line bg-surface p-4 shadow-lift outline-none sm:p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-base font-bold">{title}</h3>
          <IconButton label="إغلاق" name="x" size={15} onClick={onClose} />
        </div>
        {children}
      </div>
    </div>
  );
}

export function PageHeader({
  title, sub, actions, icon, meta,
}: { title: string; sub?: string; actions?: ReactNode; icon?: IconName; meta?: ReactNode }) {
  return (
    <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {icon && (
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primarysoft text-primary">
              <Icon name={icon} size={19} />
            </span>
          )}
          <h1 className="page-title">{title}</h1>
        </div>
        {sub && <p className="page-sub">{sub}</p>}
        {meta && <div className="mt-2 flex flex-wrap items-center gap-2">{meta}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

// ---- Pagination -------------------------------------------------------------
export function usePagination<T>(items: T[], perPage: number, initialPage = 1) {
  const [page, setPage] = useState(initialPage);
  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  const safePage = Math.min(page, totalPages);
  const pageItems = useMemo(
    () => items.slice((safePage - 1) * perPage, safePage * perPage),
    [items, safePage, perPage],
  );
  return { page: safePage, setPage, totalPages, pageItems, total: items.length, perPage };
}

export function Pagination({
  page, totalPages, total, perPage, onChange, perPageOptions, onPerPage,
}: {
  page: number; totalPages: number; total: number; perPage: number;
  onChange: (p: number) => void;
  perPageOptions?: number[];
  onPerPage?: (n: number) => void;
}) {
  if (total === 0) return null;
  const start = (page - 1) * perPage + 1;
  const end = Math.min(total, page * perPage);
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-2.5 text-xs text-muted">
      <span>عرض {fmtNum(start)}–{fmtNum(end)} من {fmtNum(total)}</span>
      <div className="flex items-center gap-1.5">
        <button
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          className="flex h-8 items-center gap-1 rounded-lg border border-line bg-surface px-2.5 transition hover:border-primary/40 disabled:opacity-40"
        >
          <Icon name="chevron-right" size={13} /> السابق
        </button>
        <span className="px-1 tabular-nums">صفحة {fmtNum(page)} من {fmtNum(totalPages)}</span>
        <button
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
          className="flex h-8 items-center gap-1 rounded-lg border border-line bg-surface px-2.5 transition hover:border-primary/40 disabled:opacity-40"
        >
          التالي <Icon name="chevron-left" size={13} />
        </button>
        {perPageOptions && onPerPage && (
          <select
            value={perPage}
            onChange={(e) => onPerPage(Number(e.target.value))}
            className="h-8 rounded-lg border border-line bg-surface px-1.5 text-xs"
            aria-label="عدد العناصر في الصفحة"
          >
            {perPageOptions.map((n) => (<option key={n} value={n}>{fmtNum(n)} / صفحة</option>))}
          </select>
        )}
      </div>
    </div>
  );
}

export function EmptyState({
  title, sub, action, icon = 'leaf',
}: { title: string; sub?: string; action?: ReactNode; icon?: IconName }) {
  return (
    <div className="px-4 py-9 text-center">
      <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-line bg-surface2 text-muted">
        <Icon name={icon} size={22} />
      </span>
      <p className="font-bold">{title}</p>
      {sub && <p className="mx-auto mt-1 max-w-sm text-sm leading-relaxed text-muted">{sub}</p>}
      {action && <div className="mt-3 flex justify-center">{action}</div>}
    </div>
  );
}

export function Stat({
  label, value, sub, icon,
}: { label: string; value: string; sub?: string; icon?: IconName }) {
  return (
    <Card className="p-3.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold leading-snug text-muted">{label}</p>
          <p className="stat-value mt-1.5">{value}</p>
          {sub && <p className="mt-1 truncate text-[11px] text-muted">{sub}</p>}
        </div>
        {icon && (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface2 text-muted">
            <Icon name={icon} size={16} />
          </span>
        )}
      </div>
    </Card>
  );
}
