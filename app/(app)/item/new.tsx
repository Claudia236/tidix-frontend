import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { getErrorMessage } from '../../../src/api/client';
import { itemsApi } from '../../../src/api/items';
import { shoppingNotesApi } from '../../../src/api/shoppingNotes';
import { showAlert } from '../../../src/components/AppAlert';
import { ItemForm, type ItemFormHandle } from '../../../src/components/ItemForm';
import { useI18n } from '../../../src/i18n/I18nContext';
import type { ColorPalette } from '../../../src/theme/colors';
import { useTheme } from '../../../src/theme/ThemeContext';
import type { Category, ItemInput } from '../../../src/types';

export default function NewItemScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const formRef = useRef<ItemFormHandle>(null);
  const params = useLocalSearchParams<{
    storageLocationId?: string;
    name?: string;
    category?: string;
    supermarketId?: string;
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
    onError: (e) => showAlert(t('common.error'), getErrorMessage(e, t)),
  });

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable onPress={() => formRef.current?.openScan()} hitSlop={8} style={{ paddingRight: 16 }}>
              <Ionicons name="camera-outline" size={22} color={colors.inkSoft} />
            </Pressable>
          ),
        }}
      />
      <ItemForm
        ref={formRef}
        initial={{
          storageLocationId: params.storageLocationId,
          name: params.name,
          category: params.category as Category | undefined,
          supermarketId: params.supermarketId,
          purchaseDate: params.purchaseDate,
        }}
        submitLabel={t('common.save')}
        submitting={createMutation.isPending}
        onSubmit={(input) => createMutation.mutate(input)}
        enableScan
      />
    </View>
  );
}

function createStyles(COLORS: ColorPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
  });
}
