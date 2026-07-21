import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { householdApi } from '../api/household';
import { useI18n, type TranslateFn } from '../i18n/I18nContext';
import type { ColorPalette, ColorScheme } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import type { Category, DayOfWeek, Unit, WasteSchedule, WasteType } from '../types';

export interface CategoryInfo {
  key: Category;
  label: string;
  short: string;
  emoji: string;
}

const CATEGORY_KEYS: Category[] = [
  'AVANZI', 'PIATTI_PRONTI', 'ORTOFRUTTA', 'PASTA_CEREALI', 'LEGUMI', 'CARNE_PESCE', 'LATTICINI_UOVA', 'SOSTITUTI_VEGETALI',
  'CONSERVE', 'CONDIMENTI', 'DOLCI', 'SNACK_SALATI', 'FORNO_PASTICCERIA', 'BEVANDE',
  'IGIENE', 'CASA_PULIZIA', 'ANIMALI', 'BEBE', 'FARMACIA', 'ALTRO',
];

// Categorie senza una data di scadenza stampata: nel form prodotto viene
// chiesto "consumare entro N giorni" invece della data, che viene poi
// convertita in expirationDate = oggi + N giorni.
export const CONSUME_WITHIN_DAYS_CATEGORIES: ReadonlySet<Category> = new Set(['AVANZI', 'ORTOFRUTTA']);

const CATEGORY_EMOJI: Record<Category, string> = {
  AVANZI: '🍝',
  PIATTI_PRONTI: '🍱',
  ORTOFRUTTA: '🍊',
  PASTA_CEREALI: '🍝',
  LEGUMI: '🫘',
  CARNE_PESCE: '🥩',
  LATTICINI_UOVA: '🥛',
  SOSTITUTI_VEGETALI: '🌱',
  CONSERVE: '🥫',
  CONDIMENTI: '🧂',
  DOLCI: '🍪',
  SNACK_SALATI: '🥨',
  FORNO_PASTICCERIA: '🥐',
  BEVANDE: '🥤',
  IGIENE: '🧴',
  CASA_PULIZIA: '🧹',
  ANIMALI: '🐾',
  BEBE: '🍼',
  FARMACIA: '💊',
  ALTRO: '📌',
};

export function buildCategories(t: TranslateFn): CategoryInfo[] {
  return CATEGORY_KEYS.map((key) => ({
    key,
    label: t(`category.${key}.label`),
    short: t(`category.${key}.short`),
    emoji: CATEGORY_EMOJI[key],
  }));
}

export function findCategoryInfo(categories: CategoryInfo[], key: Category): CategoryInfo {
  return categories.find((c) => c.key === key) ?? categories[categories.length - 1];
}

export function useCategories(): CategoryInfo[] {
  const { t } = useI18n();
  return useMemo(() => buildCategories(t), [t]);
}

export function useCategoryInfo(key: Category): CategoryInfo {
  const categories = useCategories();
  return findCategoryInfo(categories, key);
}

/**
 * Come useCategories(), ma esclude le categorie disattivate dalla famiglia
 * corrente: da usare nei selettori (ItemForm, lista spesa, filtri) cosi' le
 * categorie disattivate non sono piu' scelte per nuovi elementi. ALTRO non
 * e' mai disattivabile, quindi resta sempre come categoria di fallback.
 */
export function useSelectableCategories(): CategoryInfo[] {
  const categories = useCategories();
  const householdQuery = useQuery({ queryKey: ['household', 'me'], queryFn: householdApi.me });
  const disabled = householdQuery.data?.disabledCategories;
  return useMemo(() => {
    if (!disabled || disabled.length === 0) return categories;
    const disabledSet = new Set(disabled);
    return categories.filter((c) => !disabledSet.has(c.key));
  }, [categories, disabled]);
}

export const UNITS: Unit[] = ['PZ', 'KG', 'G', 'L', 'ML', 'CONF'];

export function useUnitLabel(): (unit: Unit) => string {
  const { t } = useI18n();
  return (unit: Unit) => t(`unit.${unit}`);
}

export interface ExpiryStatusColors {
  critico: { fg: string; bg: string };
  attenzione: { fg: string; bg: string };
  presto: { fg: string; bg: string };
  ok: { fg: string; bg: string };
}

export function buildExpiryStatusColors(COLORS: ColorPalette): ExpiryStatusColors {
  return {
    critico: { fg: COLORS.danger, bg: COLORS.dangerBg },
    attenzione: { fg: COLORS.danger, bg: COLORS.dangerBg },
    presto: { fg: COLORS.danger, bg: COLORS.dangerBg },
    ok: { fg: COLORS.inkSoft, bg: COLORS.okBg },
  };
}

export function useExpiryStatusColors(): ExpiryStatusColors {
  const { colors } = useTheme();
  return useMemo(() => buildExpiryStatusColors(colors), [colors]);
}

// Le posizioni (frigo/freezer/dispensa/...) sono ormai personalizzate per famiglia
// e arrivano dall'API: qui deriviamo solo un colore/codice coerenti e stabili
// a partire dal nome, senza doverli salvare lato server.
const LOCATION_PALETTE: Record<ColorScheme, { color: string; bg: string }[]> = {
  light: [
    { color: '#2E6E8E', bg: '#E1EDF1' },
    { color: '#1F7A8C', bg: '#DCEFF1' },
    { color: '#96702A', bg: '#F1E8D8' },
    { color: '#5B5A52', bg: '#EAE8E2' },
    { color: '#6B4F8C', bg: '#EAE3F1' },
    { color: '#3F6B52', bg: '#E1EDE5' },
    { color: '#A3572E', bg: '#F3E4D8' },
  ],
  dark: [
    { color: '#7FB8D8', bg: '#1E2C33' },
    { color: '#6FCBDB', bg: '#1B2E30' },
    { color: '#D9B463', bg: '#312A1B' },
    { color: '#B7B4A8', bg: '#292825' },
    { color: '#BBA3E0', bg: '#2A2333' },
    { color: '#7FBF9C', bg: '#1E2C25' },
    { color: '#E0A06F', bg: '#332419' },
  ],
};

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

// id puo' essere null/undefined per prodotti creati prima dell'introduzione
// delle posizioni personalizzabili, mai riassegnati a una posizione valida
export function locationColor(id: string | null | undefined, scheme: ColorScheme = 'light'): { color: string; bg: string } {
  const palette = LOCATION_PALETTE[scheme];
  if (!id) return palette[0];
  return palette[hashString(id) % palette.length];
}

export function useLocationColor(): (id: string | null | undefined) => { color: string; bg: string } {
  const { scheme } = useTheme();
  return (id) => locationColor(id, scheme);
}

export function locationCode(name: string): string {
  const letters = name.trim().toUpperCase().replace(/[^A-ZÀ-Ù]/g, '');
  return (letters.slice(0, 2) || '??').padEnd(2, letters[0] ?? '?');
}

export interface WasteTypeInfo {
  key: WasteType;
  label: string;
  emoji: string;
}

const WASTE_TYPE_KEYS: WasteType[] = ['ORGANICO', 'PLASTICA', 'CARTA_CARTONE', 'VETRO', 'INDIFFERENZIATO', 'ALTRO'];

const WASTE_TYPE_EMOJI: Record<WasteType, string> = {
  ORGANICO: '🍎',
  PLASTICA: '🧴',
  CARTA_CARTONE: '📦',
  VETRO: '🍾',
  INDIFFERENZIATO: '⚫',
  ALTRO: '📌',
};

export function getWasteTypeEmoji(key: WasteType): string {
  return WASTE_TYPE_EMOJI[key];
}

export function buildWasteTypes(t: TranslateFn): WasteTypeInfo[] {
  return WASTE_TYPE_KEYS.map((key) => ({ key, label: t(`waste.${key}.label`), emoji: WASTE_TYPE_EMOJI[key] }));
}

export function findWasteTypeInfo(types: WasteTypeInfo[], key: WasteType): WasteTypeInfo {
  return types.find((w) => w.key === key) ?? types[types.length - 1];
}

export function useWasteTypes(): WasteTypeInfo[] {
  const { t } = useI18n();
  return useMemo(() => buildWasteTypes(t), [t]);
}

export function useWasteTypeInfo(key: WasteType): WasteTypeInfo {
  const types = useWasteTypes();
  return findWasteTypeInfo(types, key);
}

export interface DayOfWeekInfo {
  key: DayOfWeek;
  short: string;
  label: string;
}

// Ordine lunedì -> domenica, coerente con java.time.DayOfWeek usato dal backend
const DAY_KEYS: DayOfWeek[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

export function buildDaysOfWeek(t: TranslateFn): DayOfWeekInfo[] {
  return DAY_KEYS.map((key) => ({ key, short: t(`day.${key}.short`), label: t(`day.${key}.label`) }));
}

export function findDayOfWeekLabel(days: DayOfWeekInfo[], key: DayOfWeek): string {
  return days.find((d) => d.key === key)?.label ?? key;
}

export function useDaysOfWeek(): DayOfWeekInfo[] {
  const { t } = useI18n();
  return useMemo(() => buildDaysOfWeek(t), [t]);
}

export function useDayOfWeekLabel(): (key: DayOfWeek) => string {
  const days = useDaysOfWeek();
  return (key) => findDayOfWeekLabel(days, key);
}

// Ordine domenica -> sabato, coerente con Date.getDay() (0 = domenica)
const DAY_ORDER_FROM_SUNDAY: DayOfWeek[] = [
  'SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY',
];

export function jsWeekdayToDay(jsWeekday: number): DayOfWeek {
  return DAY_ORDER_FROM_SUNDAY[jsWeekday];
}

export function dayToJsWeekday(day: DayOfWeek): number {
  return DAY_ORDER_FROM_SUNDAY.indexOf(day);
}

export function wasteTypesCollectedOn(schedules: WasteSchedule[], day: DayOfWeek): WasteType[] {
  return schedules.filter((s) => s.daysOfWeek.includes(day)).map((s) => s.type);
}

export interface CleaningSuggestion {
  name: string;
  emoji: string;
  frequencyDays: number;
}

const CLEANING_SUGGESTION_KEYS: { key: string; emoji: string; frequencyDays: number }[] = [
  { key: 'bagno', emoji: '🚽', frequencyDays: 7 },
  { key: 'lenzuola', emoji: '🛏️', frequencyDays: 7 },
  { key: 'cameraDaLetto', emoji: '🛋️', frequencyDays: 7 },
  { key: 'cucina', emoji: '🍽️', frequencyDays: 7 },
  { key: 'pavimenti', emoji: '🧹', frequencyDays: 7 },
  { key: 'frigorifero', emoji: '🧊', frequencyDays: 30 },
  { key: 'forno', emoji: '🔥', frequencyDays: 30 },
  { key: 'lavatrice', emoji: '🧺', frequencyDays: 30 },
  { key: 'tappeti', emoji: '🟫', frequencyDays: 14 },
  { key: 'vetriEFinestre', emoji: '🪟', frequencyDays: 30 },
  { key: 'divano', emoji: '🛋️', frequencyDays: 30 },
  { key: 'cappaCucina', emoji: '💨', frequencyDays: 30 },
];

export function buildCleaningSuggestions(t: TranslateFn): CleaningSuggestion[] {
  return CLEANING_SUGGESTION_KEYS.map((s) => ({
    name: t(`cleaningSuggestion.${s.key}`),
    emoji: s.emoji,
    frequencyDays: s.frequencyDays,
  }));
}

export function useCleaningSuggestions(): CleaningSuggestion[] {
  const { t } = useI18n();
  return useMemo(() => buildCleaningSuggestions(t), [t]);
}
