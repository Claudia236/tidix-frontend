import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React from 'react';
import { getErrorMessage } from '../../../src/api/client';
import { shoppingNotesApi } from '../../../src/api/shoppingNotes';
import { showAlert } from '../../../src/components/AppAlert';
import { ShoppingNoteForm, type ShoppingNoteFormInput } from '../../../src/components/ShoppingNoteForm';
import { useI18n } from '../../../src/i18n/I18nContext';

export default function NewShoppingNoteScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t } = useI18n();

  const createMutation = useMutation({
    mutationFn: (input: ShoppingNoteFormInput) =>
      shoppingNotesApi.create({ text: input.text, detail: input.detail, category: input.category }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-notes'] });
      router.back();
    },
    onError: (e) => showAlert(t('common.error'), getErrorMessage(e, t)),
  });

  return (
    <ShoppingNoteForm
      submitLabel={t('shoppingNote.new.saveButton')}
      submitting={createMutation.isPending}
      onSubmit={(input) => createMutation.mutate(input)}
    />
  );
}
