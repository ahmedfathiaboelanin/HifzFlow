// Small date / id / formatting helpers. Dates are local yyyy-mm-dd strings.

export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayStr(): string {
  return toISODate(new Date());
}

export function addDaysStr(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  return toISODate(new Date(y, m - 1, d + days));
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Days from today to the date (negative = overdue). */
export function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const ms = parseISODate(iso).getTime() - parseISODate(todayStr()).getTime();
  return Math.round(ms / 86400000);
}

const arDateFmt = new Intl.DateTimeFormat('ar-EG', { dateStyle: 'medium' });
const arNumFmt = new Intl.NumberFormat('ar-EG');

export function fmtDateAr(iso: string | null): string {
  if (!iso) return '—';
  return arDateFmt.format(parseISODate(iso));
}

export function fmtNum(n: number): string {
  return arNumFmt.format(n);
}

/** Arabic-Indic digits -> western, for inputs. */
export function arabicDigits(n: number | string): string {
  return String(n).replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
}

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

/** Minutes -> "ساعة و10 دقائق" style. */
export function fmtMinutes(min: number): string {
  if (min < 60) return `${fmtNum(Math.round(min))} دقيقة`;
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return m === 0 ? `${fmtNum(h)} ساعة` : `${fmtNum(h)} ساعة و${fmtNum(m)} دقيقة`;
}
