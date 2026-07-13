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
import { COLORS } from '../../src/theme/colors';
import { webCentered } from '../../src/theme/responsive';
import type { Expense, ExpenseSplitInput, HouseholdMember } from '../../src/types';

const MONTH_LABELS = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
];

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number);
  const date = new Date(y, m - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(month: string): string {
  const [y, m] = month.split('-').map(Number);
  return `${MONTH_LABELS[m - 1]} ${y}`;
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
    onError: (e) => showAlert('Errore', getErrorMessage(e)),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => expensesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      closeForm();
    },
    onError: (e) => showAlert('Errore', getErrorMessage(e)),
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
    expense.splits.forEach((s) => {
      custom[s.userId] = String(s.percentage);
    });
    setCustomPercentages(custom);
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
        splits = ids.map((id) => ({ userId: id, percentage: pct[id] }));
      } else {
        splits = ids.map((id) => ({ userId: id, percentage: Number((customPercentages[id] ?? '0').replace(',', '.')) || 0 }));
        const sum = splits.reduce((s, sp) => s + sp.percentage, 0);
        if (Math.abs(sum - 100) > 0.5) {
          showAlert('Spese', `Le percentuali devono sommare a 100 (attualmente ${sum.toFixed(1)}).`);
          return;
        }
      }
    }
    saveMutation.mutate(splits);
  }

  function confirmDelete(id: string) {
    showAlert('Elimina spesa', 'Vuoi eliminare definitivamente questa spesa?', [
      { text: 'Annulla', style: 'cancel' },
      { text: 'Elimina', style: 'destructive', onPress: () => removeMutation.mutate(id) },
    ]);
  }

  const expenses = expensesQuery.data ?? [];
  const summary = summaryQuery.data;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={[styles.scroll, webCentered]}>
        <View style={styles.monthRow}>
          <Pressable onPress={() => setMonth((m) => shiftMonth(m, -1))} hitSlop={8}>
            <Ionicons name="chevron-back" size={20} color={COLORS.ink} />
          </Pressable>
          <Text style={styles.monthLabel}>{monthLabel(month)}</Text>
          <Pressable onPress={() => setMonth((m) => shiftMonth(m, 1))} hitSlop={8}>
            <Ionicons name="chevron-forward" size={20} color={COLORS.ink} />
          </Pressable>
        </View>

        {summary ? (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTotal}>Totale: {summary.totalAmount.toFixed(2)} €</Text>
            {summary.byUser.map((b) => (
              <View key={b.userId} style={styles.balanceRow}>
                <Text style={styles.balanceName}>{b.userId === user?.id ? 'Tu' : b.userName}</Text>
                <Text style={styles.balanceDetail}>
                  pagato {b.totalPaid.toFixed(2)} € · quota {b.totalShare.toFixed(2)} €
                </Text>
                <Text
                  style={[
                    styles.balanceNet,
                    { color: b.netBalance > 0.01 ? COLORS.brand : b.netBalance < -0.01 ? COLORS.danger : COLORS.inkSoft },
                  ]}
                >
                  {b.netBalance > 0.01
                    ? `+${b.netBalance.toFixed(2)} € (deve ricevere)`
                    : b.netBalance < -0.01
                      ? `${b.netBalance.toFixed(2)} € (deve dare)`
                      : 'In pari'}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.addSection}>
          <Pressable onPress={() => (adding ? closeForm() : openAddForm())} style={styles.addToggle}>
            <Ionicons name={adding ? 'remove-circle-outline' : 'add-circle-outline'} size={18} color={COLORS.brand} />
            <Text style={styles.addToggleText}>{adding ? 'Annulla' : 'Aggiungi spesa'}</Text>
          </Pressable>

          {adding ? (
            <View style={styles.form}>
              <TextField label="Descrizione" placeholder="Es. Spesa supermercato" value={description} onChangeText={setDescription} />
              <TextField label="Importo (€)" placeholder="0.00" keyboardType="numeric" value={amount} onChangeText={setAmount} />

              <View style={styles.field}>
                <Text style={styles.label}>Data della spesa</Text>
                <DatePickerField value={date} onChange={setDate} placeholder="Seleziona una data" allowClear={false} />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Pagato da</Text>
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
                          {m.id === user?.id ? 'Tu' : m.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Dividi con</Text>
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
                          {m.id === user?.id ? 'Tu' : m.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <Pressable onPress={() => setEqualSplit((v) => !v)} style={styles.equalToggle}>
                <Ionicons name={equalSplit ? 'checkbox' : 'square-outline'} size={18} color={COLORS.brand} />
                <Text style={styles.equalToggleText}>Dividi in parti uguali</Text>
              </Pressable>

              {!equalSplit ? (
                <View style={styles.field}>
                  <Text style={styles.label}>Percentuali (devono sommare a 100)</Text>
                  {Array.from(participantIds).map((id) => {
                    const m = members.find((mm) => mm.id === id);
                    return (
                      <View key={id} style={styles.percentRow}>
                        <Text style={styles.percentName}>{id === user?.id ? 'Tu' : m?.name ?? id}</Text>
                        <TextInput
                          value={customPercentages[id] ?? ''}
                          onChangeText={(v) => setCustomPercentages((prev) => ({ ...prev, [id]: v }))}
                          keyboardType="numeric"
                          placeholder="0"
                          placeholderTextColor={COLORS.inkSoft}
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
                    label="Elimina"
                    variant="danger"
                    onPress={() => confirmDelete(editingId)}
                    loading={removeMutation.isPending}
                    style={{ flex: 0 }}
                  />
                ) : null}
                <PrimaryButton
                  label={editingId ? 'Salva modifiche' : 'Salva spesa'}
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
            <EmptyState icon="cash-outline" title="Nessuna spesa questo mese" subtitle="Aggiungi la prima spesa condivisa." />
          }
          renderItem={({ item }) => (
            <View style={styles.expenseCard}>
              <Pressable style={styles.expenseCardInfo} onPress={() => openEditForm(item)}>
                <View style={styles.expenseHeader}>
                  <Text style={styles.expenseDescription}>{item.description}</Text>
                  <Text style={styles.expenseAmount}>{item.amount.toFixed(2)} €</Text>
                </View>
                <Text style={styles.expenseMeta}>
                  {item.paidByUserId === user?.id ? 'Tu' : item.paidByName} · {item.date}
                </Text>
                <Text style={styles.expenseSplits} numberOfLines={1}>
                  {item.splits.map((s) => `${s.userId === user?.id ? 'Tu' : s.userName} ${s.percentage.toFixed(0)}%`).join(' · ')}
                </Text>
              </Pressable>
              <Pressable onPress={() => confirmDelete(item.id)} hitSlop={8}>
                <Ionicons name="trash-outline" size={16} color={COLORS.inkSoft} />
              </Pressable>
            </View>
          )}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: 20, gap: 16, paddingBottom: 60 },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16 },
  monthLabel: { fontSize: 15, fontWeight: '700', color: COLORS.ink, textTransform: 'capitalize' },
  summaryCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.line,
    padding: 16,
    gap: 10,
  },
  summaryTotal: { fontSize: 15, fontWeight: '800', color: COLORS.ink },
  balanceRow: { borderTopWidth: 1, borderColor: COLORS.line, paddingTop: 8, marginTop: 2, gap: 2 },
  balanceName: { fontSize: 13, fontWeight: '700', color: COLORS.ink },
  balanceDetail: { fontSize: 12, color: COLORS.inkSoft },
  balanceNet: { fontSize: 12, fontWeight: '700' },
  addSection: { gap: 12 },
  addToggle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  addToggleText: { fontSize: 14, fontWeight: '700', color: COLORS.brand },
  form: {
    gap: 14,
    backgroundColor: COLORS.white,
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
    backgroundColor: COLORS.white,
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
  formActions: { flexDirection: 'row', gap: 10 },
  list: { gap: 10 },
  expenseCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.line,
    padding: 14,
  },
  expenseCardInfo: { flex: 1, gap: 4 },
  expenseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  expenseDescription: { fontSize: 14, fontWeight: '700', color: COLORS.ink, flexShrink: 1 },
  expenseAmount: { fontSize: 14, fontWeight: '800', color: COLORS.ink },
  expenseMeta: { fontSize: 12, color: COLORS.inkSoft },
  expenseSplits: { fontSize: 11, color: COLORS.inkSoft },
});
