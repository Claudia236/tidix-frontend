import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { getErrorMessage } from '../../../src/api/client';
import { storageLocationsApi } from '../../../src/api/storageLocations';
import { showAlert } from '../../../src/components/AppAlert';
import { ZoneForm, type ZoneFormInput } from '../../../src/components/ZoneForm';
import { useI18n } from '../../../src/i18n/I18nContext';
import type { ColorPalette } from '../../../src/theme/colors';
import { useTheme } from '../../../src/theme/ThemeContext';
import type { StorageLocation } from '../../../src/types';

export default function EditZoneScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Query diretta per id (non dedotta dalla lista 'storage-locations'): una
  // lista in cache-ma-non-in-fetch poteva far scattare un falso "non piu'
  // disponibile" se la schermata veniva raggiunta da una query diversa (es.
  // il riepilogo zone di Panoramica) ancora fresca ma non aggiornata.
  const zoneQuery = useQuery({
    queryKey: ['storage-locations', id],
    queryFn: () => storageLocationsApi.get(id),
    enabled: !!id,
    // La zona e' quasi sempre gia' nella lista ['storage-locations'] appena
    // lasciata: usarla come placeholder evita uno spinner a schermo intero
    // mentre arriva la stessa identica risposta dalla rete.
    placeholderData: () =>
      queryClient.getQueryData<StorageLocation[]>(['storage-locations'])?.find((loc) => loc.id === id),
  });
  const zone = zoneQuery.data;

  function invalidateZones() {
    queryClient.invalidateQueries({ queryKey: ['storage-locations'] });
    // Prefisso generico (non solo 'summary'): una zona eliminata puo' aver
    // fatto sparire/spostare articoli, e Scorte/Panoramica/Lista spesa
    // devono rivederli tutti, non solo il riepilogo per zona.
    queryClient.invalidateQueries({ queryKey: ['items'] });
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

  // Se la zona e' stata eliminata da un altro membro della famiglia mentre
  // questa schermata era aperta, la query per id va in errore (404): senza
  // questo, lo spinner sotto girava all'infinito.
  useEffect(() => {
    if (zoneQuery.isError) {
      showAlert(t('common.recordGoneTitle'), t('common.recordGoneMessage'), [{ text: t('common.ok'), onPress: () => router.back() }]);
    }
  }, [zoneQuery.isError]);

  if (zoneQuery.isLoading || !zone) {
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
