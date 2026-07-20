import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { getErrorMessage } from '../../../src/api/client';
import { itemsApi } from '../../../src/api/items';
import { showAlert } from '../../../src/components/AppAlert';
import { ItemForm } from '../../../src/components/ItemForm';
import { useI18n } from '../../../src/i18n/I18nContext';
import type { ColorPalette } from '../../../src/theme/colors';
import { useTheme } from '../../../src/theme/ThemeContext';
import type { ItemInput } from '../../../src/types';

export default function EditItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const itemQuery = useQuery({ queryKey: ['items', id], queryFn: () => itemsApi.get(id), enabled: !!id });

  const updateMutation = useMutation({
    mutationFn: (input: ItemInput) => itemsApi.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      router.back();
    },
    onError: (e) => showAlert(t('common.error'), getErrorMessage(e, t)),
  });

  const deleteMutation = useMutation({
    mutationFn: () => itemsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      router.back();
    },
    onError: (e) => showAlert(t('common.error'), getErrorMessage(e, t)),
  });

  const deleteAndAddToShoppingListMutation = useMutation({
    mutationFn: () => {
      const quantity = itemQuery.data?.quantity ?? 0;
      return itemsApi.adjustQuantity(id, { delta: -quantity, hideFromShoppingList: false });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      router.back();
    },
    onError: (e) => showAlert(t('common.error'), getErrorMessage(e, t)),
  });

  function confirmDelete() {
    showAlert(t('item.confirmDeleteTitle'), t('item.confirmDeleteMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('item.deleteAndAddToShoppingList'), onPress: () => deleteAndAddToShoppingListMutation.mutate() },
      { text: t('item.deleteOnly'), style: 'destructive', onPress: () => deleteMutation.mutate() },
    ]);
  }

  if (itemQuery.isLoading || !itemQuery.data) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.brand} />
      </View>
    );
  }

  const item = itemQuery.data;

  return (
    <View style={styles.container}>
      <ItemForm
        initial={{
          name: item.name,
          storageLocationId: item.storageLocationId,
          category: item.category,
          quantity: item.quantity,
          unit: item.unit,
          expirationDate: item.expirationDate,
          purchaseDate: item.purchaseDate,
          opened: item.opened,
          openedDate: item.openedDate,
          openedReminderEnabled: item.openedReminderEnabled,
          openedReminderDays: item.openedReminderDays,
        }}
        submitLabel={t('common.saveChanges')}
        submitting={updateMutation.isPending}
        onSubmit={(input) => updateMutation.mutate(input)}
        onDelete={confirmDelete}
        deleting={deleteMutation.isPending || deleteAndAddToShoppingListMutation.isPending}
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
