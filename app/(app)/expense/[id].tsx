import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { getErrorMessage } from '../../../src/api/client';
import { expensesApi } from '../../../src/api/expenses';
import { showAlert } from '../../../src/components/AppAlert';
import { ExpenseForm, type ExpenseFormOutput } from '../../../src/components/ExpenseForm';
import { useI18n } from '../../../src/i18n/I18nContext';
import type { ColorPalette } from '../../../src/theme/colors';
import { useTheme } from '../../../src/theme/ThemeContext';

export default function EditExpenseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const expensesQuery = useQuery({ queryKey: ['expenses', 'all'], queryFn: () => expensesApi.list() });
  const expense = expensesQuery.data?.find((e) => e.id === id);

  const updateMutation = useMutation({
    mutationFn: (input: ExpenseFormOutput) => expensesApi.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      router.back();
    },
    onError: (e) => showAlert(t('common.error'), getErrorMessage(e, t)),
  });

  const deleteMutation = useMutation({
    mutationFn: () => expensesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      router.back();
    },
    onError: (e) => showAlert(t('common.error'), getErrorMessage(e, t)),
  });

  function confirmDelete() {
    showAlert(t('expenses.confirmDeleteTitle'), t('expenses.confirmDeleteMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => deleteMutation.mutate() },
    ]);
  }

  if (expensesQuery.isLoading || !expense) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.brand} />
      </View>
    );
  }

  const percentages = expense.splits.map((s) => s.percentage);
  const equalSplit = percentages.every((p) => Math.abs(p - percentages[0]) < 0.5);
  const customPercentages: Record<string, string> = {};
  const paidAmounts: Record<string, string> = {};
  const paidInFull: Record<string, boolean> = {};
  expense.splits.forEach((s) => {
    customPercentages[s.userId] = String(s.percentage);
    if (s.userId !== expense.paidByUserId) {
      paidAmounts[s.userId] = s.paidAmount ? String(s.paidAmount) : '';
      paidInFull[s.userId] = s.paidAmount >= s.amount - 0.01;
    }
  });

  return (
    <View style={styles.container}>
      <ExpenseForm
        initial={{
          description: expense.description,
          amount: String(expense.amount),
          date: expense.date,
          paidByUserId: expense.paidByUserId,
          participantIds: expense.splits.map((s) => s.userId),
          equalSplit,
          customPercentages,
          paidAmounts,
          paidInFull,
        }}
        submitLabel={t('common.saveChanges')}
        submitting={updateMutation.isPending}
        onSubmit={(output) => updateMutation.mutate(output)}
        onDelete={confirmDelete}
        deleting={deleteMutation.isPending}
      />
    </View>
  );
}

function createStyles(COLORS: ColorPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg },
  });
}
