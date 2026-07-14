import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { getErrorMessage } from '../../../src/api/client';
import { shoppingNotesApi } from '../../../src/api/shoppingNotes';
import { showAlert } from '../../../src/components/AppAlert';
import { ShoppingNoteForm, type ShoppingNoteFormInput } from '../../../src/components/ShoppingNoteForm';
import { useI18n } from '../../../src/i18n/I18nContext';
import type { ColorPalette } from '../../../src/theme/colors';
import { useTheme } from '../../../src/theme/ThemeContext';

export default function EditShoppingNoteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const noteQuery = useQuery({ queryKey: ['shopping-notes', id], queryFn: () => shoppingNotesApi.get(id), enabled: !!id });

  const updateMutation = useMutation({
    mutationFn: (input: ShoppingNoteFormInput) =>
      shoppingNotesApi.update(id, { text: input.text, detail: input.detail, category: input.category }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-notes'] });
      router.back();
    },
    onError: (e) => showAlert(t('common.error'), getErrorMessage(e, t)),
  });

  const deleteMutation = useMutation({
    mutationFn: () => shoppingNotesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-notes'] });
      router.back();
    },
    onError: (e) => showAlert(t('common.error'), getErrorMessage(e, t)),
  });

  function confirmDelete() {
    showAlert(t('shoppingNote.confirmDeleteTitle'), t('shoppingNote.confirmDeleteMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => deleteMutation.mutate() },
    ]);
  }

  if (noteQuery.isLoading || !noteQuery.data) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.brand} />
      </View>
    );
  }

  const note = noteQuery.data;

  return (
    <ShoppingNoteForm
      initial={{ text: note.text, detail: note.detail, category: note.category }}
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
