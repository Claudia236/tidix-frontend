import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { getErrorMessage } from '../../../src/api/client';
import { storageLocationsApi } from '../../../src/api/storageLocations';
import { showAlert } from '../../../src/components/AppAlert';
import { ZoneForm, type ZoneFormInput } from '../../../src/components/ZoneForm';
import { useStorageLocations } from '../../../src/hooks/useStorageLocations';
import { useI18n } from '../../../src/i18n/I18nContext';
import type { ColorPalette } from '../../../src/theme/colors';
import { useTheme } from '../../../src/theme/ThemeContext';

export default function EditZoneScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { byId, isLoading } = useStorageLocations();
  const zone = byId.get(id);

  function invalidateZones() {
    queryClient.invalidateQueries({ queryKey: ['storage-locations'] });
    queryClient.invalidateQueries({ queryKey: ['items', 'summary'] });
  }

  const updateMutation = useMutation({
    mutationFn: (input: ZoneFormInput) => storageLocationsApi.update(id, input),
    onSuccess: () => {
      invalidateZones();
      router.back();
    },
    onError: (e) => showAlert(t('common.error'), getErrorMessage(e, t)),
  });

  const deleteMutation = useMutation({
    mutationFn: () => storageLocationsApi.remove(id),
    onSuccess: () => {
      invalidateZones();
      router.back();
    },
    onError: (e) => showAlert(t('common.error'), getErrorMessage(e, t)),
  });

  function confirmDelete() {
    showAlert(t('zone.confirmDeleteTitle'), t('zone.confirmDeleteMessage', { name: zone?.name ?? '' }), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => deleteMutation.mutate() },
    ]);
  }

  if (isLoading || !zone) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.brand} />
      </View>
    );
  }

  return (
    <ZoneForm
      initial={{ name: zone.name, emoji: zone.emoji, colorIndex: zone.colorIndex }}
      submitLabel={t('common.saveChanges')}
      submitting={updateMutation.isPending}
      onSubmit={(input) => updateMutation.mutate(input)}
      onDelete={confirmDelete}
      deleting={deleteMutation.isPending}
    />
  );
}

function createStyles(COLORS: ColorPalette) {
  return StyleSheet.create({
    loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg },
  });
}
