import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { itemsApi } from '../../../src/api/items';
import { getErrorMessage } from '../../../src/api/client';
import { showAlert } from '../../../src/components/AppAlert';
import { ItemForm } from '../../../src/components/ItemForm';
import { COLORS } from '../../../src/theme/colors';
import type { ItemInput } from '../../../src/types';

export default function NewItemScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ storageLocationId?: string }>();

  const createMutation = useMutation({
    mutationFn: (input: ItemInput) => itemsApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      router.back();
    },
    onError: (e) => showAlert('Errore', getErrorMessage(e)),
  });

  return (
    <View style={styles.container}>
      <ItemForm
        initial={{ storageLocationId: params.storageLocationId }}
        submitLabel="Salva"
        submitting={createMutation.isPending}
        onSubmit={(input) => createMutation.mutate(input)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
});
