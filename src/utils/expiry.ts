export type ExpiryStatusKey = 'critico' | 'attenzione' | 'presto' | 'ok';

export interface ExpiryInfo {
  status: ExpiryStatusKey;
  label: string;
}

export function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${dateStr}T00:00:00`);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export function formatShortDate(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
}

export function getExpiryInfo(expirationDate: string | null): ExpiryInfo | null {
  if (!expirationDate) return null;
  const days = daysUntil(expirationDate);
  if (days < 0) return { status: 'critico', label: days === -1 ? 'Scaduto ieri' : `Scaduto da ${Math.abs(days)} giorni` };
  if (days === 0) return { status: 'attenzione', label: 'Scade oggi' };
  if (days === 1) return { status: 'attenzione', label: 'Scade domani' };
  if (days <= 3) return { status: 'attenzione', label: `Scade tra ${days} giorni` };
  if (days <= 7) return { status: 'presto', label: `Scade tra ${days} giorni` };
  return { status: 'ok', label: formatShortDate(expirationDate) };
}
