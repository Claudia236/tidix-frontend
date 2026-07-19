import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { householdApi } from '../api/household';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/I18nContext';
import type { ColorPalette } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { webCentered } from '../theme/responsive';
import type { ExpenseSplitInput } from '../types';
import { todayLocalISODate } from '../utils/expiry';
import { showAlert } from './AppAlert';
import { DatePickerField } from './DatePickerField';
import { PrimaryButton } from './PrimaryButton';
import { TextField } from './TextField';

function equalPercentages(userIds: string[]): Record<string, number> {
  const n = userIds.length;
  if (n === 0) return {};
  const base = Math.floor(10000 / n) / 100;
  const result: Record<string, number> = {};
  let assigned = 0;
  userIds.forEach((id, i) => {
    if (i === n - 1) {
      result[id] = Math.round((100 - assigned) * 100) / 100;
    } else {
      result[id] = base;
      assigned += base;
    }
  });
  return result;
}

export interface ExpenseFormInitial {
  description?: string;
  amount?: string;
  date?: string | null;
  paidByUserId?: string;
  participantIds?: string[];
  equalSplit?: boolean;
  customPercentages?: Record<string, string>;
  paidAmounts?: Record<string, string>;
  paidInFull?: Record<string, boolean>;
}

export interface ExpenseFormOutput {
  description: string;
  amount: number;
  paidByUserId: string;
  date: string;
  splits: ExpenseSplitInput[];
}

interface Props {
  initial?: ExpenseFormInitial;
  submitLabel: string;
  submitting?: boolean;
  onSubmit: (output: ExpenseFormOutput) => void;
  onDelete?: () => void;
  deleting?: boolean;
}

export function ExpenseForm({ initial, submitLabel, submitting, onSubmit, onDelete, deleting }: Props) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { user } = useAuth();

  const householdQuery = useQuery({ queryKey: ['household', 'me'], queryFn: householdApi.me });
  const members = householdQuery.data?.members ?? [];

  const [description, setDescription] = useState(initial?.description ?? '');
  const [amount, setAmount] = useState(initial?.amount ?? '');
  const [date, setDate] = useState<string | null>(initial?.date ?? todayLocalISODate());
  const [paidByUserId, setPaidByUserId] = useState(initial?.paidByUserId ?? user?.id ?? '');
  const [participantIds, setParticipantIds] = useState<Set<string>>(
    () => new Set(initial?.participantIds ?? members.map((m) => m.id))
  );
  const [equalSplit, setEqualSplit] = useState(initial?.equalSplit ?? true);
  const [customPercentages, setCustomPercentages] = useState<Record<string, string>>(initial?.customPercentages ?? {});
  const [paidAmounts, setPaidAmounts] = useState<Record<string, string>>(initial?.paidAmounts ?? {});
  const [paidInFull, setPaidInFull] = useState<Record<string, boolean>>(initial?.paidInFull ?? {});

  const effectivePaidBy = paidByUserId || user?.id || members[0]?.id || '';

  function participantShareAmount(id: string): number {
    const totalAmount = Math.max(0, Number(amount.replace(',', '.')) || 0);
    if (equalSplit) {
      const pct = equalPercentages(Array.from(participantIds));
      return (totalAmount * (pct[id] ?? 0)) / 100;
    }
    const pct = Number((customPercentages[id] ?? '0').replace(',', '.')) || 0;
    return (totalAmount * pct) / 100;
  }

  function togglePaidInFull(id: string) {
    setPaidInFull((prev) => {
      const next = !prev[id];
      if (next) {
        setPaidAmounts((amounts) => ({ ...amounts, [id]: participantShareAmount(id).toFixed(2) }));
      }
      return { ...prev, [id]: next };
    });
  }

  function toggleParticipant(id: string) {
    setParticipantIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSubmit() {
    if (!description.trim() || !amount.trim()) return;
    const ids = Array.from(participantIds);
    let splits: ExpenseSplitInput[] = [];
    if (ids.length > 0) {
      if (equalSplit) {
        const pct = equalPercentages(ids);
        splits = ids.map((id) => ({
          userId: id,
          percentage: pct[id],
          paidAmount: paidInFull[id] ? participantShareAmount(id) : Number((paidAmounts[id] ?? '0').replace(',', '.')) || 0,
        }));
      } else {
        splits = ids.map((id) => ({
          userId: id,
          percentage: Number((customPercentages[id] ?? '0').replace(',', '.')) || 0,
          paidAmount: paidInFull[id] ? participantShareAmount(id) : Number((paidAmounts[id] ?? '0').replace(',', '.')) || 0,
        }));
        const sum = splits.reduce((s, sp) => s + sp.percentage, 0);
        if (Math.abs(sum - 100) > 0.5) {
          showAlert(t('expenses.percentagesErrorTitle'), t('expenses.percentagesError', { sum: sum.toFixed(1) }));
          return;
        }
      }
    }
    onSubmit({
      description: description.trim(),
      amount: Math.max(0, Number(amount.replace(',', '.')) || 0),
      paidByUserId: effectivePaidBy,
      date: date ?? todayLocalISODate(),
      splits,
    });
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
      <ScrollView
        contentContainerStyle={[styles.container, webCentered, { paddingBottom: 40 + insets.bottom }]}
        keyboardShouldPersistTaps="handled"
      >
        <TextField label={t('expenses.descriptionLabel')} placeholder={t('expenses.descriptionPlaceholder')} value={description} onChangeText={setDescription} autoFocus />
        <TextField label={t('expenses.amountLabel')} placeholder="0.00" keyboardType="numeric" value={amount} onChangeText={setAmount} />

        <View style={styles.field}>
          <Text style={styles.label}>{t('expenses.dateLabel')}</Text>
          <DatePickerField value={date} onChange={setDate} placeholder={t('expenses.datePlaceholder')} allowClear={false} />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t('expenses.paidByLabel')}</Text>
          <View style={styles.chipRow}>
            {members.map((m) => {
              const active = effectivePaidBy === m.id;
              return (
                <Pressable key={m.id} onPress={() => setPaidByUserId(m.id)} style={[styles.chip, active && styles.chipActive]}>
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{m.id === user?.id ? t('common.you') : m.name}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t('expenses.splitWithLabel')}</Text>
          <View style={styles.chipRow}>
            {members.map((m) => {
              const active = participantIds.has(m.id);
              return (
                <Pressable key={m.id} onPress={() => toggleParticipant(m.id)} style={[styles.chip, active && styles.chipActive]}>
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{m.id === user?.id ? t('common.you') : m.name}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Pressable onPress={() => setEqualSplit((v) => !v)} style={styles.equalToggle}>
          <Ionicons name={equalSplit ? 'checkbox' : 'square-outline'} size={18} color={colors.brand} />
          <Text style={styles.equalToggleText}>{t('expenses.equalSplitToggle')}</Text>
        </Pressable>

        {Array.from(participantIds).filter((id) => id !== effectivePaidBy).length > 0 ? (
          <View style={styles.field}>
            <Text style={styles.label}>{t('expenses.alreadyPaidLabel')}</Text>
            <Text style={styles.helperText}>{t('expenses.alreadyPaidHint')}</Text>
            {Array.from(participantIds)
              .filter((id) => id !== effectivePaidBy)
              .map((id) => {
                const m = members.find((mm) => mm.id === id);
                const full = paidInFull[id] ?? false;
                return (
                  <View key={id} style={styles.percentRow}>
                    <Pressable onPress={() => togglePaidInFull(id)} hitSlop={8}>
                      <Ionicons name={full ? 'checkbox' : 'square-outline'} size={18} color={colors.brand} />
                    </Pressable>
                    <Text style={styles.percentName}>{id === user?.id ? t('common.you') : m?.name ?? id}</Text>
                    <TextInput
                      value={full ? participantShareAmount(id).toFixed(2) : paidAmounts[id] ?? ''}
                      onChangeText={(v) => setPaidAmounts((prev) => ({ ...prev, [id]: v }))}
                      editable={!full}
                      keyboardType="numeric"
                      placeholder="0.00"
                      placeholderTextColor={colors.inkSoft}
                      style={[styles.percentInput, full && styles.percentInputDisabled]}
                    />
                    <Text style={styles.percentSign}>€</Text>
                  </View>
                );
              })}
          </View>
        ) : null}

        {!equalSplit ? (
          <View style={styles.field}>
            <Text style={styles.label}>{t('expenses.percentagesLabel')}</Text>
            {Array.from(participantIds).map((id) => {
              const m = members.find((mm) => mm.id === id);
              return (
                <View key={id} style={styles.percentRow}>
                  <Text style={styles.percentName}>{id === user?.id ? t('common.you') : m?.name ?? id}</Text>
                  <TextInput
                    value={customPercentages[id] ?? ''}
                    onChangeText={(v) => setCustomPercentages((prev) => ({ ...prev, [id]: v }))}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={colors.inkSoft}
                    style={styles.percentInput}
                  />
                  <Text style={styles.percentSign}>%</Text>
                </View>
              );
            })}
          </View>
        ) : null}

        <View style={styles.actions}>
          {onDelete ? (
            <PrimaryButton label={t('common.delete')} variant="danger" onPress={onDelete} loading={deleting} style={{ flex: 0 }} />
          ) : null}
          <PrimaryButton
            label={submitLabel}
            onPress={handleSubmit}
            disabled={!description.trim() || !amount.trim()}
            loading={submitting}
            style={{ flex: 1 }}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function createStyles(COLORS: ColorPalette) {
  return StyleSheet.create({
    container: { padding: 20, gap: 16 },
    field: { gap: 8 },
    label: {
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.4,
      color: COLORS.inkSoft,
    },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
      borderWidth: 1,
      borderColor: COLORS.line,
      backgroundColor: COLORS.card,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 7,
    },
    chipActive: { backgroundColor: COLORS.brand, borderColor: COLORS.brand },
    chipText: { fontSize: 12, fontWeight: '600', color: COLORS.ink },
    chipTextActive: { color: COLORS.white },
    equalToggle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    equalToggleText: { fontSize: 13, color: COLORS.ink },
    percentRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    percentName: { flex: 1, fontSize: 13, color: COLORS.ink },
    percentInput: {
      width: 56,
      borderWidth: 1,
      borderColor: COLORS.line,
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 6,
      fontSize: 13,
      color: COLORS.ink,
      textAlign: 'right',
    },
    percentInputDisabled: { backgroundColor: COLORS.okBg, color: COLORS.inkSoft },
    percentSign: { fontSize: 13, color: COLORS.inkSoft },
    helperText: { fontSize: 11, color: COLORS.inkSoft, marginTop: -4 },
    actions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  });
}
