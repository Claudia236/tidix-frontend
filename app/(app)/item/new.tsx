import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { getErrorMessage } from '../../../src/api/client';
import { itemsApi } from '../../../src/api/items';
import { shoppingNotesApi } from '../../../src/api/shoppingNotes';
import { showAlert } from '../../../src/components/AppAlert';
import { ItemForm } from '../../../src/components/ItemForm';
import { COLORS } from '../../../src/theme/colors';
import type { Category, ItemInput } from '../../../src/types';

export default function NewItemScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{
    storageLocationId?: string;
    name?: string;
    category?: string;
    sourceNoteId?: string;
    purchaseDate?: string;
  }>();

  const createMutation = useMutation({
    mutationFn: (input: ItemInput) => itemsApi.create(input),
    onSuccess: async () => {
      if (params.sourceNoteId) {
        await shoppingNotesApi.remove(params.sourceNoteId).catch(() => {});
        queryClient.invalidateQueries({ queryKey: ['shopping-notes'] });
      }
      queryClient.invalidateQueries({ queryKey: ['items'] });
      router.back();
    },
    onError: (e) => showAlert('Errore', getErrorMessage(e)),
  });

  return (
    <View style={styles.container}>
      <ItemForm
        initial={{
          storageLocationId: params.storageLocationId,
          name: params.name,
          category: params.category as Category | undefined,
          purchaseDate: params.purchaseDate,
        }}
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
