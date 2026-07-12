import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import { getErrorMessage } from '../../../src/api/client';
import { itemsApi } from '../../../src/api/items';
import { ItemForm } from '../../../src/components/ItemForm';
import { COLORS } from '../../../src/theme/colors';
import type { ItemInput } from '../../../src/types';

export default function EditItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const itemQuery = useQuery({ queryKey: ['items', id], queryFn: () => itemsApi.get(id), enabled: !!id });

  const updateMutation = useMutation({
    mutationFn: (input: ItemInput) => itemsApi.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      router.back();
    },
    onError: (e) => Alert.alert('Errore', getErrorMessage(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: () => itemsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      router.back();
    },
    onError: (e) => Alert.alert('Errore', getErrorMessage(e)),
  });

  function confirmDelete() {
    Alert.alert('Elimina prodotto', 'Vuoi eliminare definitivamente questo prodotto?', [
      { text: 'Annulla', style: 'cancel' },
      { text: 'Elimina', style: 'destructive', onPress: () => deleteMutation.mutate() },
    ]);
  }

  if (itemQuery.isLoading || !itemQuery.data) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={COLORS.brand} />
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
        }}
        submitLabel="Salva modifiche"
        submitting={updateMutation.isPending}
        onSubmit={(input) => updateMutation.mutate(input)}
        onDelete={confirmDelete}
        deleting={deleteMutation.isPending}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg },
});
