import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getErrorMessage } from '../../src/api/client';
import { expensesApi } from '../../src/api/expenses';
import { settlementsApi } from '../../src/api/settlements';
import { showAlert } from '../../src/components/AppAlert';
import { AddFab } from '../../src/components/AddFab';
import { EmptyState } from '../../src/components/EmptyState';
import { SettlePaymentDialog } from '../../src/components/SettlePaymentDialog';
import { useAuth } from '../../src/context/AuthContext';
import { useI18n, type TranslateFn } from '../../src/i18n/I18nContext';
import type { ColorPalette } from '../../src/theme/colors';
import { useTheme } from '../../src/theme/ThemeContext';
import { webCentered } from '../../src/theme/responsive';
import type { UserBalance } from '../../src/types';
import { computeAllTimeNetBalances, totalOwedByUser } from '../../src/utils/expenseSettlement';
import { formatDashDate } from '../../src/utils/expiry';

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

export default function ExpensesScreen() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [month, setMonth] = useState(currentMonth());
  const [settleTarget, setSettleTarget] = useState<UserBalance | null>(null);
  const [showAll, setShowAll] = useState(false);

  const expensesQuery = useQuery({ queryKey: ['expenses', month], queryFn: () => expensesApi.list(month) });
  const summaryQuery = useQuery({ queryKey: ['expenses', 'summary', month], queryFn: () => expensesApi.summary(month) });
  const allExpensesQuery = useQuery({ queryKey: ['expenses', 'all'], queryFn: () => expensesApi.list() });
  const settlementsQuery = useQuery({ queryKey: ['settlements'], queryFn: () => settlementsApi.list() });

  const removeMutation = useMutation({
    mutationFn: (id: string) => expensesApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expenses'] }),
    onError: (e) => showAlert(t('common.error'), getErrorMessage(e, t)),
  });

  const settleMutation = useMutation({
    mutationFn: ({ debtorUserId, amount }: { debtorUserId: string; amount: number }) =>
      settlementsApi.create(debtorUserId, amount),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['settlements'] });
      setSettleTarget(null);
      showAlert(
        t('expenses.settleTitle', { name: settleTarget?.userName ?? '' }),
        result.leftover > 0.01
          ? t('expenses.settleSuccessWithLeftover', { n: result.allocations.length, leftover: result.leftover.toFixed(2) })
          : t('expenses.settleSuccess', { n: result.allocations.length })
      );
    },
    onError: (e) => showAlert(t('common.error'), getErrorMessage(e, t)),
  });

  function confirmDelete(id: string) {
    showAlert(t('expenses.confirmDeleteTitle'), t('expenses.confirmDeleteMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => removeMutation.mutate(id) },
    ]);
  }

  // "Vedi tutte" mostra le stesse spese usate per calcolare il saldo
  // complessivo (allExpensesQuery, senza filtro mese): serve a trovare
  // spese che per qualche motivo non compaiono nella vista mensile pur
  // contribuendo al saldo, cosa che altrimenti le renderebbe introvabili.
  const expenses = showAll ? allExpensesQuery.data ?? [] : expensesQuery.data ?? [];
  const summary = summaryQuery.data;
  // Il saldo (chi deve dare/ricevere) e' complessivo su tutte le spese di
  // sempre, non solo su quelle del mese selezionato: solo il totale speso
  // mostrato sopra resta filtrato per mese.
  const netBalanceByUser = useMemo(
    () => computeAllTimeNetBalances(allExpensesQuery.data ?? [], settlementsQuery.data ?? []),
    [allExpensesQuery.data, settlementsQuery.data]
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={expenses}
        keyExtractor={(e) => e.id}
        contentContainerStyle={[styles.scroll, styles.list, webCentered, { paddingBottom: 60 + insets.bottom }]}
        ListHeaderComponent={
          <>
            <View style={styles.monthRow}>
              <Pressable onPress={() => setMonth((m) => shiftMonth(m, -1))} hitSlop={8} disabled={showAll}>
                <Ionicons name="chevron-back" size={20} color={showAll ? colors.line : colors.ink} />
              </Pressable>
              <Text style={styles.monthLabel}>{showAll ? t('expenses.allMonths') : monthLabel(month, t)}</Text>
              <Pressable onPress={() => setMonth((m) => shiftMonth(m, 1))} hitSlop={8} disabled={showAll}>
                <Ionicons name="chevron-forward" size={20} color={showAll ? colors.line : colors.ink} />
              </Pressable>
            </View>

            <Pressable onPress={() => setShowAll((v) => !v)} style={styles.showAllToggle}>
              <Text style={styles.showAllToggleText}>
                {showAll ? t('expenses.showMonthToggle') : t('expenses.showAllToggle')}
              </Text>
            </Pressable>

            {summary ? (
              <View style={styles.summaryCard}>
                <View style={styles.summaryTotalRow}>
                  <Text style={styles.summaryTotal}>{t('expenses.total')}: {summary.totalAmount.toFixed(2)} €</Text>
                  <Pressable
                    onPress={() => router.push('/(app)/settlements')}
                    hitSlop={8}
                    accessibilityLabel={t('expenses.settlementsInfoLabel')}
                  >
                    <Ionicons name="information-circle-outline" size={20} color={colors.inkSoft} />
                  </Pressable>
                </View>
                {summary.byUser.map((b) => {
                  const netBalance = netBalanceByUser.get(b.userId) ?? 0;
                  const owesMoney = netBalance < -0.01;
                  return (
                    <View key={b.userId} style={styles.balanceRow}>
                      <View style={styles.balanceRowText}>
                        <Text style={styles.balanceName}>{b.userId === user?.id ? t('common.you') : b.userName}</Text>
                        <Text
                          style={[
                            styles.balanceNet,
                            { color: netBalance > 0.01 ? colors.positive : owesMoney ? colors.danger : colors.inkSoft },
                          ]}
                        >
                          {netBalance > 0.01
                            ? t('expenses.deveRicevere', { amount: netBalance.toFixed(2) })
                            : owesMoney
                              ? t('expenses.deveDare', { amount: Math.abs(netBalance).toFixed(2) })
                              : t('expenses.inPari')}
                        </Text>
                      </View>
                      {owesMoney ? (
                        <Pressable style={styles.settleButton} onPress={() => setSettleTarget(b)}>
                          <Ionicons name="cash-outline" size={14} color={colors.white} />
                          <Text style={styles.settleButtonText}>{t('expenses.markPaymentButton')}</Text>
                        </Pressable>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            ) : null}
          </>
        }
        ListEmptyComponent={
          <EmptyState icon="cash-outline" title={t('expenses.emptyTitle')} subtitle={t('expenses.emptySubtitle')} />
        }
        renderItem={({ item }) => (
            <View style={styles.expenseCard}>
              <View style={styles.expenseTopRow}>
                <Pressable
                  style={styles.expenseCardInfo}
                  onPress={() => router.push({ pathname: '/(app)/expense/[id]', params: { id: item.id } })}
                >
                  <View style={styles.expenseHeader}>
                    <Text style={styles.expenseDescription}>{item.description}</Text>
                    <Text style={styles.expenseAmount}>{item.amount.toFixed(2)} €</Text>
                  </View>
                  <Text style={styles.expenseMeta}>
                    {item.paidByUserId === user?.id ? t('common.you') : item.paidByName} · {formatDashDate(item.date)}
                  </Text>
                </Pressable>
                <Pressable onPress={() => confirmDelete(item.id)} hitSlop={8}>
                  <Ionicons name="trash-outline" size={16} color={colors.inkSoft} />
                </Pressable>
              </View>

              <View style={styles.splitsList}>
                {item.splits.map((s) => {
                  const isPayer = s.userId === item.paidByUserId;
                  const actuallyPaid = s.paidAmount >= s.amount - 0.01;
                  const netSettled = (netBalanceByUser.get(s.userId) ?? 0) >= -0.01;
                  const settled = !isPayer && (actuallyPaid || netSettled);
                  return (
                    <View key={s.userId} style={styles.splitRow}>
                      <Ionicons
                        name={isPayer ? 'wallet-outline' : settled ? 'checkmark-circle' : 'ellipse-outline'}
                        size={16}
                        color={isPayer ? colors.inkSoft : settled ? colors.positive : colors.danger}
                      />
                      <Text style={styles.splitName}>{s.userId === user?.id ? t('common.you') : s.userName}</Text>
                      <Text style={styles.splitAmount}>
                        {s.percentage.toFixed(0)}% · {s.amount.toFixed(2)} €
                      </Text>
                      {!isPayer ? (
                        <Text style={[styles.splitPaidStatus, { color: settled ? colors.positive : colors.danger }]}>
                          {actuallyPaid || !netSettled
                            ? t('expenses.paidOfTotal', { paid: s.paidAmount.toFixed(2), total: s.amount.toFixed(2) })
                            : t('expenses.settledByBalance')}
                        </Text>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        />

      <AddFab onPress={() => router.push('/(app)/expense/new')} bottom={24 + insets.bottom} />

      <SettlePaymentDialog
        visible={settleTarget !== null}
        personName={settleTarget ? (settleTarget.userId === user?.id ? t('common.you') : settleTarget.userName) : ''}
        totalOwed={settleTarget ? totalOwedByUser(allExpensesQuery.data ?? [], settleTarget.userId) : 0}
        submitting={settleMutation.isPending}
        onCancel={() => setSettleTarget(null)}
        onConfirm={(amount) => {
          if (!settleTarget) return;
          settleMutation.mutate({ debtorUserId: settleTarget.userId, amount });
        }}
      />
    </View>
  );
}

function createStyles(COLORS: ColorPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    scroll: { padding: 20, gap: 16, paddingBottom: 60 },
    monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 8 },
    monthLabel: { fontSize: 15, fontWeight: '700', color: COLORS.ink, textTransform: 'capitalize' },
    showAllToggle: { alignItems: 'center', marginBottom: 8 },
    showAllToggleText: { fontSize: 12, fontWeight: '700', color: COLORS.brand },
    summaryCard: {
      backgroundColor: COLORS.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: COLORS.line,
      padding: 16,
      gap: 10,
    },
    summaryTotalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
    summaryTotal: { fontSize: 15, fontWeight: '800', color: COLORS.ink },
    balanceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderTopWidth: 1,
      borderColor: COLORS.line,
      paddingTop: 8,
      marginTop: 2,
    },
    balanceRowText: { gap: 2 },
    balanceName: { fontSize: 13, fontWeight: '700', color: COLORS.ink },
    balanceNet: { fontSize: 12, fontWeight: '700' },
    settleButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: COLORS.brand,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 7,
    },
    settleButtonText: { fontSize: 12, fontWeight: '700', color: COLORS.white },
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
