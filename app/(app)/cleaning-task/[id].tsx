import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { getErrorMessage } from '../../../src/api/client';
import { cleaningApi } from '../../../src/api/cleaning';
import { showAlert } from '../../../src/components/AppAlert';
import { CleaningTaskForm } from '../../../src/components/CleaningTaskForm';
import { useI18n } from '../../../src/i18n/I18nContext';
import { cancelCleaningReminder } from '../../../src/notifications/cleaningReminders';
import type { ColorPalette } from '../../../src/theme/colors';
import { useTheme } from '../../../src/theme/ThemeContext';
import type { CleaningTaskInput } from '../../../src/types';

export default function EditCleaningTaskScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const tasksQuery = useQuery({ queryKey: ['cleaning-tasks'], queryFn: cleaningApi.list });
  const task = tasksQuery.data?.find((tsk) => tsk.id === id);

  const updateMutation = useMutation({
    mutationFn: (input: CleaningTaskInput) => cleaningApi.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cleaning-tasks'] });
      cancelCleaningReminder(id);
      router.back();
    },
    onError: (e) => showAlert(t('common.error'), getErrorMessage(e, t)),
  });

  const deleteMutation = useMutation({
    mutationFn: () => cleaningApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cleaning-tasks'] });
      router.back();
    },
    onError: (e) => showAlert(t('common.error'), getErrorMessage(e, t)),
  });

  function confirmDelete() {
    showAlert(t('cleaning.confirmDeleteTitle'), t('cleaning.confirmDeleteMessage', { name: task?.name ?? '' }), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => deleteMutation.mutate() },
    ]);
  }

  if (tasksQuery.isLoading || !task) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.brand} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CleaningTaskForm
        initial={{
          name: task.name,
          frequencyDays: task.frequencyDays,
          lastCleanedDate: task.lastCleanedDate,
        }}
        submitLabel={t('common.saveChanges')}
        submitting={updateMutation.isPending}
        onSubmit={(input) => updateMutation.mutate(input)}
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
