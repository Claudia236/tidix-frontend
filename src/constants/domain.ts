import type { Category, Unit, WasteType } from '../types';
import { COLORS } from '../theme/colors';

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

// Le posizioni (frigo/freezer/dispensa/...) sono ormai personalizzate per famiglia
// e arrivano dall'API: qui deriviamo solo un colore/codice coerenti e stabili
// a partire dal nome, senza doverli salvare lato server.
const LOCATION_PALETTE = [
  { color: '#2E6E8E', bg: '#E1EDF1' },
  { color: '#1F7A8C', bg: '#DCEFF1' },
  { color: '#96702A', bg: '#F1E8D8' },
  { color: '#5B5A52', bg: '#EAE8E2' },
  { color: '#6B4F8C', bg: '#EAE3F1' },
  { color: '#3F6B52', bg: '#E1EDE5' },
  { color: '#A3572E', bg: '#F3E4D8' },
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function locationColor(id: string): { color: string; bg: string } {
  return LOCATION_PALETTE[hashString(id) % LOCATION_PALETTE.length];
}

export function locationCode(name: string): string {
  const letters = name.trim().toUpperCase().replace(/[^A-ZÀ-Ù]/g, '');
  return (letters.slice(0, 2) || '??').padEnd(2, letters[0] ?? '?');
}

export const WASTE_TYPES: { key: WasteType; label: string; emoji: string }[] = [
  { key: 'ORGANICO', label: 'Organico', emoji: '🍂' },
  { key: 'PLASTICA', label: 'Plastica', emoji: '♻️' },
  { key: 'CARTA_CARTONE', label: 'Carta e cartone', emoji: '📦' },
  { key: 'VETRO', label: 'Vetro', emoji: '🍾' },
  { key: 'INDIFFERENZIATO', label: 'Indifferenziato', emoji: '🗑️' },
  { key: 'ALTRO', label: 'Altro', emoji: '📌' },
];

export function wasteTypeInfo(key: WasteType) {
  return WASTE_TYPES.find((w) => w.key === key) ?? WASTE_TYPES[WASTE_TYPES.length - 1];
}
