import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React from 'react';
import { getErrorMessage } from '../../../src/api/client';
import { storageLocationsApi } from '../../../src/api/storageLocations';
import { showAlert } from '../../../src/components/AppAlert';
import { ZoneForm, type ZoneFormInput } from '../../../src/components/ZoneForm';
import { useI18n } from '../../../src/i18n/I18nContext';

export default function NewZoneScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t } = useI18n();

  function invalidateZones() {
    queryClient.invalidateQueries({ queryKey: ['storage-locations'] });
    queryClient.invalidateQueries({ queryKey: ['items', 'summary'] });
  }

  const createMutation = useMutation({
    mutationFn: (input: ZoneFormInput) => storageLocationsApi.create(input),
    onSuccess: () => {
      invalidateZones();
      router.back();
    },
    onError: (e) => showAlert(t('common.error'), getErrorMessage(e, t)),
  });

  return (
    <ZoneForm
      submitLabel={t('common.add')}
      submitting={createMutation.isPending}
      onSubmit={(input) => createMutation.mutate(input)}
    />
  );
}
