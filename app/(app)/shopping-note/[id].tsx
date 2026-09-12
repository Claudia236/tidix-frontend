import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { getErrorMessage } from '../../../src/api/client';
import { shoppingNotesApi } from '../../../src/api/shoppingNotes';
import { showAlert } from '../../../src/components/AppAlert';
import { ShoppingNoteForm, type ShoppingNoteFormInput } from '../../../src/components/ShoppingNoteForm';
import { useI18n } from '../../../src/i18n/I18nContext';
import type { ColorPalette } from '../../../src/theme/colors';
import { useTheme } from '../../../src/theme/ThemeContext';
import type { ShoppingNote } from '../../../src/types';

export default function EditShoppingNoteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const noteQuery = useQuery({
    queryKey: ['shopping-notes', id],
    queryFn: () => shoppingNotesApi.get(id),
    enabled: !!id,
    // La voce e' quasi sempre gia' nella lista ['shopping-notes'] appena
    // lasciata (spesa o acquistati): usarla come placeholder evita uno
    // spinner a schermo intero mentre arriva la stessa identica risposta.
    placeholderData: () =>
      queryClient.getQueryData<ShoppingNote[]>(['shopping-notes'])?.find((note) => note.id === id),
  });

  const updateMutation = useMutation({
    mutationFn: (input: ShoppingNoteFormInput) =>
      shoppingNotesApi.update(id, { text: input.text, detail: input.detail, category: input.category, supermarketId: input.supermarketId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-notes'] });
      router.back();
    },
    onError: (e) => showAlert(t('common.error'), getErrorMessage(e, t)),
  });

  const deleteMutation = useMutation({
    mutationFn: () => shoppingNotesApi.remove(id),
    onSuccess: () => {
      // Rimossa (non solo invalidata) prima dell'invalidateQueries
      // generico: senza questo, ['shopping-notes', id] - ancora osservata
      // mentre router.back() e' in transizione - veniva rifetchata,
      // ottenendo un 404 sulla voce appena cancellata di proposito e un
      // alert "non piu' disponibile" spurio sovrapposto all'eliminazione.
      queryClient.removeQueries({ queryKey: ['shopping-notes', id], exact: true });
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

  // Se la voce e' stata eliminata da un altro membro della famiglia mentre
  // questa schermata era aperta, la query va in errore (404): senza questo,
  // lo spinner sotto girava all'infinito con nessun modo di uscire.
  useEffect(() => {
    if (noteQuery.isError) {
      showAlert(t('common.recordGoneTitle'), t('common.recordGoneMessage'), [{ text: t('common.ok'), onPress: () => router.back() }]);
    }
  }, [noteQuery.isError]);

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
      initial={{ text: note.text, detail: note.detail, category: note.category, supermarketId: note.supermarketId }}
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
