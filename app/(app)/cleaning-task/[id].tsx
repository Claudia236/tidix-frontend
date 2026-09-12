import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { getErrorMessage } from '../../../src/api/client';
import { cleaningApi } from '../../../src/api/cleaning';
import { showAlert } from '../../../src/components/AppAlert';
import { CleaningTaskForm } from '../../../src/components/CleaningTaskForm';
import { useI18n } from '../../../src/i18n/I18nContext';
import { cancelCleaningReminder } from '../../../src/notifications/cleaningReminders';
import type { ColorPalette } from '../../../src/theme/colors';
import { useTheme } from '../../../src/theme/ThemeContext';
import type { CleaningTask, CleaningTaskInput } from '../../../src/types';

export default function EditCleaningTaskScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Query diretta per id (non dedotta dalla lista 'cleaning-tasks'): una
  // lista in cache-ma-non-in-fetch poteva far scattare un falso "non piu'
  // disponibile" se la schermata veniva raggiunta da una query diversa,
  // ancora fresca ma non aggiornata.
  const taskQuery = useQuery({
    queryKey: ['cleaning-tasks', id],
    queryFn: () => cleaningApi.get(id),
    enabled: !!id,
    // L'attivita' e' quasi sempre gia' nella lista ['cleaning-tasks'] appena
    // lasciata: usarla come placeholder evita uno spinner a schermo intero
    // mentre arriva la stessa identica risposta dalla rete.
    placeholderData: () =>
      queryClient.getQueryData<CleaningTask[]>(['cleaning-tasks'])?.find((task) => task.id === id),
  });
  const task = taskQuery.data;

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
      // Rimossa (non solo invalidata) prima dell'invalidateQueries
      // generico: senza questo, ['cleaning-tasks', id] - ancora osservata
      // mentre router.back() e' in transizione - veniva rifetchata,
      // ottenendo un 404 sull'attivita' appena cancellata di proposito e un
      // alert "non piu' disponibile" spurio sovrapposto all'eliminazione.
      queryClient.removeQueries({ queryKey: ['cleaning-tasks', id], exact: true });
      queryClient.invalidateQueries({ queryKey: ['cleaning-tasks'] });
      cancelCleaningReminder(id);
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

  // Se la pulizia e' stata eliminata da un altro membro della famiglia mentre
  // questa schermata era aperta, la query per id va in errore (404): senza
  // questo, lo spinner sotto girava all'infinito.
  useEffect(() => {
    if (taskQuery.isError) {
      showAlert(t('common.recordGoneTitle'), t('common.recordGoneMessage'), [{ text: t('common.ok'), onPress: () => router.back() }]);
    }
  }, [taskQuery.isError]);

  if (taskQuery.isLoading || !task) {
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
