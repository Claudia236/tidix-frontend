import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { getErrorMessage } from '../../../src/api/client';
import { plantsApi } from '../../../src/api/plants';
import { showAlert } from '../../../src/components/AppAlert';
import { PlantForm } from '../../../src/components/PlantForm';
import { useI18n } from '../../../src/i18n/I18nContext';
import { cancelPlantReminder } from '../../../src/notifications/plantReminders';
import type { ColorPalette } from '../../../src/theme/colors';
import { useTheme } from '../../../src/theme/ThemeContext';
import type { Plant, PlantInput } from '../../../src/types';

export default function EditPlantScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Query diretta per id (non dedotta dalla lista 'plants'): stesso motivo
  // gia' in cleaning-task/[id].tsx, una lista in cache-ma-non-in-fetch poteva
  // far scattare un falso "non piu' disponibile".
  const plantQuery = useQuery({
    queryKey: ['plants', id],
    queryFn: () => plantsApi.get(id),
    enabled: !!id,
    placeholderData: () => queryClient.getQueryData<Plant[]>(['plants'])?.find((plant) => plant.id === id),
  });
  const plant = plantQuery.data;

  const updateMutation = useMutation({
    mutationFn: (input: PlantInput) => plantsApi.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plants'] });
      cancelPlantReminder(id);
      router.back();
    },
    onError: (e) => showAlert(t('common.error'), getErrorMessage(e, t)),
  });

  const deleteMutation = useMutation({
    mutationFn: () => plantsApi.remove(id),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ['plants', id], exact: true });
      queryClient.invalidateQueries({ queryKey: ['plants'] });
      cancelPlantReminder(id);
      router.back();
    },
    onError: (e) => showAlert(t('common.error'), getErrorMessage(e, t)),
  });

  function confirmDelete() {
    showAlert(t('plants.confirmDeleteTitle'), t('plants.confirmDeleteMessage', { name: plant?.name ?? '' }), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => deleteMutation.mutate() },
    ]);
  }

  // Se la pianta e' stata eliminata da un altro membro della famiglia mentre
  // questa schermata era aperta, la query per id va in errore (404).
  useEffect(() => {
    if (plantQuery.isError) {
      showAlert(t('common.recordGoneTitle'), t('common.recordGoneMessage'), [{ text: t('common.ok'), onPress: () => router.back() }]);
    }
  }, [plantQuery.isError]);

  if (plantQuery.isLoading || !plant) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.brand} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PlantForm
        initial={{
          name: plant.name,
          location: plant.location,
          wateringFrequencyDays: plant.wateringFrequencyDays,
          lastWateredDate: plant.lastWateredDate,
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
