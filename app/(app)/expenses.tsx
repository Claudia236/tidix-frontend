import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { getErrorMessage } from '../../src/api/client';
import { expensesApi } from '../../src/api/expenses';
import { householdApi } from '../../src/api/household';
import { showAlert } from '../../src/components/AppAlert';
import { DatePickerField } from '../../src/components/DatePickerField';
import { EmptyState } from '../../src/components/EmptyState';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { TextField } from '../../src/components/TextField';
import { useAuth } from '../../src/context/AuthContext';
import { useI18n, type TranslateFn } from '../../src/i18n/I18nContext';
import type { ColorPalette } from '../../src/theme/colors';
import { useTheme } from '../../src/theme/ThemeContext';
import { webCentered } from '../../src/theme/responsive';
import type { Expense, ExpenseSplitInput, HouseholdMember } from '../../src/types';

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number);
  const date = new Date(y, m - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(month: string, t: TranslateFn): string {
  const [y, m] = month.split('-').map(Number);
  return `${t(`month.${m}`)} ${y}`;
}

function equalPercentages(userIds: string[]): Record<string, number> {
  const n = userIds.length;
  if (n === 0) return {};
  const base = Math.floor((10000 / n)) / 100;
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

export default function ExpensesScreen() {
  const queryClient = useQueryClient();
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { user } = useAuth();
  const [month, setMonth] = useState(currentMonth());
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const expensesQuery = useQuery({ queryKey: ['expenses', month], queryFn: () => expensesApi.list(month) });
  const summaryQuery = useQuery({ queryKey: ['expenses', 'summary', month], queryFn: () => expensesApi.summary(month) });
  const householdQuery = useQuery({ queryKey: ['household', 'me'], queryFn: householdApi.me });
  const members: HouseholdMember[] = householdQuery.data?.members ?? [];

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState<string | null>(new Date().toISOString().slice(0, 10));
  const [paidByUserId, setPaidByUserId] = useState<string>(user?.id ?? '');
  const [participantIds, setParticipantIds] = useState<Set<string>>(() => new Set(members.map((m) => m.id)));
  const [equalSplit, setEqualSplit] = useState(true);
  const [customPercentages, setCustomPercentages] = useState<Record<string, string>>({});
  const [paidAmounts, setPaidAmounts] = useState<Record<string, string>>({});

  const effectivePaidBy = paidByUserId || user?.id || members[0]?.id || '';

  const saveMutation = useMutation({
    mutationFn: (splits: ExpenseSplitInput[]) => {
      const input = {
        description: description.trim(),
        amount: Math.max(0, Number(amount.replace(',', '.')) || 0),
        paidByUserId: effectivePaidBy,
        date: date ?? new Date().toISOString().slice(0, 10),
        splits,
      };
      return editingId ? expensesApi.update(editingId, input) : expensesApi.create(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      closeForm();
    },
    onError: (e) => showAlert(t('common.error'), getErrorMessage(e, t)),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => expensesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      closeForm();
    },
    onError: (e) => showAlert(t('common.error'), getErrorMessage(e, t)),
  });

  function toggleParticipant(id: string) {
    setParticipantIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function openAddForm() {
    setEditingId(null);
    setDescription('');
    setAmount('');
    setDate(new Date().toISOString().slice(0, 10));
    setPaidByUserId(user?.id ?? '');
    setParticipantIds(new Set(members.map((m) => m.id)));
    setEqualSplit(true);
    setCustomPercentages({});
    setPaidAmounts({});
    setAdding(true);
  }

  function openEditForm(expense: Expense) {
    setEditingId(expense.id);
    setDescription(expense.description);
    setAmount(String(expense.amount));
    setDate(expense.date);
    setPaidByUserId(expense.paidByUserId);
    setParticipantIds(new Set(expense.splits.map((s) => s.userId)));
    const percentages = expense.splits.map((s) => s.percentage);
    setEqualSplit(percentages.every((p) => Math.abs(p - percentages[0]) < 0.5));
    const custom: Record<string, string> = {};
    const paid: Record<string, string> = {};
    expense.splits.forEach((s) => {
      custom[s.userId] = String(s.percentage);
      if (s.userId !== expense.paidByUserId) {
        paid[s.userId] = s.paidAmount ? String(s.paidAmount) : '';
      }
    });
    setCustomPercentages(custom);
    setPaidAmounts(paid);
    setAdding(true);
  }

  function closeForm() {
    setAdding(false);
    setEditingId(null);
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
          paidAmount: Number((paidAmounts[id] ?? '0').replace(',', '.')) || 0,
        }));
      } else {
        splits = ids.map((id) => ({
          userId: id,
          percentage: Number((customPercentages[id] ?? '0').replace(',', '.')) || 0,
          paidAmount: Number((paidAmounts[id] ?? '0').replace(',', '.')) || 0,
        }));
        const sum = splits.reduce((s, sp) => s + sp.percentage, 0);
        if (Math.abs(sum - 100) > 0.5) {
          showAlert(t('expenses.percentagesErrorTitle'), t('expenses.percentagesError', { sum: sum.toFixed(1) }));
          return;
        }
      }
    }
    saveMutation.mutate(splits);
  }

  function confirmDelete(id: string) {
    showAlert(t('expenses.confirmDeleteTitle'), t('expenses.confirmDeleteMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => removeMutation.mutate(id) },
    ]);
  }

  const expenses = expensesQuery.data ?? [];
  const summary = summaryQuery.data;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={[styles.scroll, webCentered]}>
        <View style={styles.monthRow}>
          <Pressable onPress={() => setMonth((m) => shiftMonth(m, -1))} hitSlop={8}>
            <Ionicons name="chevron-back" size={20} color={colors.ink} />
          </Pressable>
          <Text style={styles.monthLabel}>{monthLabel(month, t)}</Text>
          <Pressable onPress={() => setMonth((m) => shiftMonth(m, 1))} hitSlop={8}>
            <Ionicons name="chevron-forward" size={20} color={colors.ink} />
          </Pressable>
        </View>

        {summary ? (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTotal}>{t('expenses.total')}: {summary.totalAmount.toFixed(2)} €</Text>
            {summary.byUser.map((b) => (
              <View key={b.userId} style={styles.balanceRow}>
                <Text style={styles.balanceName}>{b.userId === user?.id ? t('common.you') : b.userName}</Text>
                <Text
                  style={[
                    styles.balanceNet,
                    { color: b.netBalance > 0.01 ? colors.brand : b.netBalance < -0.01 ? colors.danger : colors.inkSoft },
                  ]}
                >
                  {b.netBalance > 0.01
                    ? t('expenses.deveRicevere', { amount: b.netBalance.toFixed(2) })
                    : b.netBalance < -0.01
                      ? t('expenses.deveDare', { amount: Math.abs(b.netBalance).toFixed(2) })
                      : t('expenses.inPari')}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.addSection}>
          <Pressable onPress={() => (adding ? closeForm() : openAddForm())} style={styles.addToggle}>
            <Ionicons name={adding ? 'remove-circle-outline' : 'add-circle-outline'} size={18} color={colors.brand} />
            <Text style={styles.addToggleText}>{adding ? t('common.cancel') : t('expenses.addToggleAdd')}</Text>
          </Pressable>

          {adding ? (
            <View style={styles.form}>
              <TextField label={t('expenses.descriptionLabel')} placeholder={t('expenses.descriptionPlaceholder')} value={description} onChangeText={setDescription} />
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
                      <Pressable
                        key={m.id}
                        onPress={() => setPaidByUserId(m.id)}
                        style={[styles.chip, active && styles.chipActive]}
                      >
                        <Text style={[styles.chipText, active && styles.chipTextActive]}>
                          {m.id === user?.id ? t('common.you') : m.name}
                        </Text>
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
                      <Pressable
                        key={m.id}
                        onPress={() => toggleParticipant(m.id)}
                        style={[styles.chip, active && styles.chipActive]}
                      >
                        <Text style={[styles.chipText, active && styles.chipTextActive]}>
                          {m.id === user?.id ? t('common.you') : m.name}
                        </Text>
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
                      return (
                        <View key={id} style={styles.percentRow}>
                          <Text style={styles.percentName}>{id === user?.id ? t('common.you') : m?.name ?? id}</Text>
                          <TextInput
                            value={paidAmounts[id] ?? ''}
                            onChangeText={(v) => setPaidAmounts((prev) => ({ ...prev, [id]: v }))}
                            keyboardType="numeric"
                            placeholder="0.00"
                            placeholderTextColor={colors.inkSoft}
                            style={styles.percentInput}
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

              <View style={styles.formActions}>
                {editingId ? (
                  <PrimaryButton
                    label={t('common.delete')}
                    variant="danger"
                    onPress={() => confirmDelete(editingId)}
                    loading={removeMutation.isPending}
                    style={{ flex: 0 }}
                  />
                ) : null}
                <PrimaryButton
                  label={editingId ? t('common.saveChanges') : t('expenses.saveExpense')}
                  onPress={handleSubmit}
                  disabled={!description.trim() || !amount.trim()}
                  loading={saveMutation.isPending}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          ) : null}
        </View>

        <FlatList
          data={expenses}
          keyExtractor={(e) => e.id}
          scrollEnabled={false}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState icon="cash-outline" title={t('expenses.emptyTitle')} subtitle={t('expenses.emptySubtitle')} />
          }
          renderItem={({ item }) => (
            <View style={styles.expenseCard}>
              <View style={styles.expenseTopRow}>
                <Pressable style={styles.expenseCardInfo} onPress={() => openEditForm(item)}>
                  <View style={styles.expenseHeader}>
                    <Text style={styles.expenseDescription}>{item.description}</Text>
                    <Text style={styles.expenseAmount}>{item.amount.toFixed(2)} €</Text>
                  </View>
                  <Text style={styles.expenseMeta}>
                    {item.paidByUserId === user?.id ? t('common.you') : item.paidByName} · {item.date}
                  </Text>
                </Pressable>
                <Pressable onPress={() => confirmDelete(item.id)} hitSlop={8}>
                  <Ionicons name="trash-outline" size={16} color={colors.inkSoft} />
                </Pressable>
              </View>

              <View style={styles.splitsList}>
                {item.splits.map((s) => {
                  const isPayer = s.userId === item.paidByUserId;
                  const settled = !isPayer && s.paidAmount >= s.amount - 0.01;
                  return (
                    <View key={s.userId} style={styles.splitRow}>
                      <Ionicons
                        name={isPayer ? 'wallet-outline' : settled ? 'checkmark-circle' : 'ellipse-outline'}
                        size={16}
                        color={isPayer ? colors.inkSoft : settled ? colors.brand : colors.danger}
                      />
                      <Text style={styles.splitName}>{s.userId === user?.id ? t('common.you') : s.userName}</Text>
                      <Text style={styles.splitAmount}>
                        {s.percentage.toFixed(0)}% · {s.amount.toFixed(2)} €
                      </Text>
                      {!isPayer ? (
                        <Text style={[styles.splitPaidStatus, { color: settled ? colors.brand : colors.danger }]}>
                          {t('expenses.paidOfTotal', { paid: s.paidAmount.toFixed(2), total: s.amount.toFixed(2) })}
                        </Text>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        />
      </ScrollView>
    </View>
  );
}

function createStyles(COLORS: ColorPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    scroll: { padding: 20, gap: 16, paddingBottom: 60 },
    monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16 },
    monthLabel: { fontSize: 15, fontWeight: '700', color: COLORS.ink, textTransform: 'capitalize' },
    summaryCard: {
      backgroundColor: COLORS.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: COLORS.line,
      padding: 16,
      gap: 10,
    },
    summaryTotal: { fontSize: 15, fontWeight: '800', color: COLORS.ink },
    balanceRow: { borderTopWidth: 1, borderColor: COLORS.line, paddingTop: 8, marginTop: 2, gap: 2 },
    balanceName: { fontSize: 13, fontWeight: '700', color: COLORS.ink },
    balanceNet: { fontSize: 12, fontWeight: '700' },
    addSection: { gap: 12 },
    addToggle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    addToggleText: { fontSize: 14, fontWeight: '700', color: COLORS.brand },
    form: {
      gap: 14,
      backgroundColor: COLORS.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: COLORS.line,
      padding: 16,
    },
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
    percentSign: { fontSize: 13, color: COLORS.inkSoft },
    helperText: { fontSize: 11, color: COLORS.inkSoft, marginTop: -4 },
    formActions: { flexDirection: 'row', gap: 10 },
    list: { gap: 10 },
    expenseCard: {
      backgroundColor: COLORS.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: COLORS.line,
      padding: 14,
      gap: 10,
    },
    expenseTopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    expenseCardInfo: { flex: 1, gap: 4 },
    expenseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    expenseDescription: { fontSize: 14, fontWeight: '700', color: COLORS.ink, flexShrink: 1 },
    expenseAmount: { fontSize: 14, fontWeight: '800', color: COLORS.ink },
    expenseMeta: { fontSize: 12, color: COLORS.inkSoft },
    splitsList: { gap: 6, borderTopWidth: 1, borderColor: COLORS.line, paddingTop: 10 },
    splitRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    splitName: { flex: 1, fontSize: 12, fontWeight: '600', color: COLORS.ink },
    splitAmount: { fontSize: 11, color: COLORS.inkSoft },
    splitPaidStatus: { fontSize: 11, fontWeight: '700' },
  });
}
