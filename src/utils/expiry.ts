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
  return d.toLocaleDateString(LOCALE_MAP[language] ?? 'it-IT', { day: 'numeric', month: 'short' });
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
