import type { Category, StorageZone, Unit } from '../types';
import { COLORS } from '../theme/colors';

export const ZONES: Record<StorageZone, { label: string; code: string; color: string; bg: string; emoji: string }> = {
  FRIGO: { label: 'Frigo', code: 'FR', color: '#2E6E8E', bg: '#E1EDF1', emoji: '🧊' },
  FREEZER: { label: 'Freezer', code: 'FZ', color: '#1F7A8C', bg: '#DCEFF1', emoji: '❄️' },
  DISPENSA: { label: 'Dispensa', code: 'DI', color: '#96702A', bg: '#F1E8D8', emoji: '🥫' },
  SGABUZZINO: { label: 'Sgabuzzino', code: 'SG', color: '#5B5A52', bg: '#EAE8E2', emoji: '📦' },
};

export const ZONE_ORDER: StorageZone[] = ['FRIGO', 'FREEZER', 'DISPENSA', 'SGABUZZINO'];

export const CATEGORIES: { key: Category; label: string; short: string; emoji: string }[] = [
  { key: 'LATTICINI', label: 'Latticini', short: 'Latticini', emoji: '🥛' },
  { key: 'CARNE', label: 'Carne e pesce', short: 'Carne/Pesce', emoji: '🥩' },
  { key: 'FRUTTA_VERDURA', label: 'Frutta e verdura', short: 'Frutta/Verdura', emoji: '🥦' },
  { key: 'CEREALI', label: 'Pasta e cereali', short: 'Pasta/Cereali', emoji: '🍝' },
  { key: 'CONSERVE', label: 'Conserve', short: 'Conserve', emoji: '🥫' },
  { key: 'CONDIMENTI', label: 'Condimenti', short: 'Condimenti', emoji: '🧂' },
  { key: 'BEVANDE', label: 'Bevande', short: 'Bevande', emoji: '🧃' },
  { key: 'PIATTI_PRONTI', label: 'Piatti pronti / Avanzi', short: 'Piatti pronti', emoji: '🍱' },
  { key: 'DOLCI', label: 'Dolci e snack', short: 'Dolci/Snack', emoji: '🍪' },
  { key: 'PULIZIA', label: 'Pulizia e igiene', short: 'Pulizia', emoji: '🧴' },
  { key: 'ALTRO', label: 'Altro', short: 'Altro', emoji: '📌' },
];

export const UNITS: Unit[] = ['PZ', 'KG', 'G', 'L', 'ML', 'CONF'];

export function categoryInfo(key: Category) {
  return CATEGORIES.find((c) => c.key === key) ?? CATEGORIES[CATEGORIES.length - 1];
}

export const EXPIRY_STATUS_COLORS = {
  critico: { fg: COLORS.danger, bg: COLORS.dangerBg },
  attenzione: { fg: COLORS.warn, bg: COLORS.warnBg },
  presto: { fg: COLORS.gold, bg: COLORS.goldBg },
  ok: { fg: COLORS.inkSoft, bg: COLORS.okBg },
} as const;
