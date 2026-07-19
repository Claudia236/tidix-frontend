import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { getErrorMessage } from '../../../src/api/client';
import { expensesApi } from '../../../src/api/expenses';
import { showAlert } from '../../../src/components/AppAlert';
import { ExpenseForm, type ExpenseFormOutput } from '../../../src/components/ExpenseForm';
import { useI18n } from '../../../src/i18n/I18nContext';
import type { ColorPalette } from '../../../src/theme/colors';
import { useTheme } from '../../../src/theme/ThemeContext';

export default function NewExpenseScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const createMutation = useMutation({
    mutationFn: (input: ExpenseFormOutput) => expensesApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      router.back();
    },
    onError: (e) => showAlert(t('common.error'), getErrorMessage(e, t)),
  });

  return (
    <View style={styles.container}>
      <ExpenseForm
        submitLabel={t('expenses.saveExpense')}
        submitting={createMutation.isPending}
        onSubmit={(output) => createMutation.mutate(output)}
      />
    </View>
  );
}

function createStyles(COLORS: ColorPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
  });
}
