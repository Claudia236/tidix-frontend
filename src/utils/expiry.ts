import type { TranslateFn } from '../i18n/I18nContext';
import type { Language } from '../i18n/translations';

export type ExpiryStatusKey = 'critico' | 'attenzione' | 'presto' | 'ok';

export interface ExpiryInfo {
  status: ExpiryStatusKey;
  label: string;
}

const LOCALE_MAP: Record<Language, string> = { it: 'it-IT', en: 'en-US', es: 'es-ES' };

export function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${dateStr}T00:00:00`);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export function formatShortDate(dateStr: string, language: Language = 'it'): string {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString(LOCALE_MAP[language] ?? 'it-IT', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatFullDate(dateStr: string, language: Language = 'it'): string {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString(LOCALE_MAP[language] ?? 'it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// Formatta un timestamp ISO completo (es. Instant di createdAt) con data e ora,
// a differenza delle altre formatFn che assumono una data "YYYY-MM-DD" pura.
export function formatDateTime(isoInstant: string, language: Language = 'it'): string {
  const d = new Date(isoInstant);
  return d.toLocaleString(LOCALE_MAP[language] ?? 'it-IT', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Converte "YYYY-MM-DD" in "DD-MM-YYYY".
export function formatDashDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${d}-${m}-${y}`;
}

// Converte un Date in "YYYY-MM-DD" usando i componenti locali: a differenza
// di toISOString() (che passa per UTC) non sposta mai la data di un giorno
// nei fusi orari avanti rispetto a UTC (es. l'Italia).
export function toLocalISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayLocalISODate(): string {
  return toLocalISODate(new Date());
}

export function getExpiryInfo(expirationDate: string | null, t: TranslateFn, language: Language = 'it'): ExpiryInfo | null {
  if (!expirationDate) return null;
  const days = daysUntil(expirationDate);
  if (days < 0) {
    return { status: 'critico', label: days === -1 ? t('expiry.expiredYesterday') : t('expiry.expiredDaysAgo', { n: Math.abs(days) }) };
  }
  if (days === 0) return { status: 'attenzione', label: t('expiry.today') };
  if (days === 1) return { status: 'attenzione', label: t('expiry.tomorrow') };
  if (days <= 3) return { status: 'attenzione', label: t('expiry.inDays', { n: days }) };
  if (days <= 7) return { status: 'presto', label: t('expiry.inDays', { n: days }) };
  return { status: 'ok', label: formatShortDate(expirationDate, language) };
}
