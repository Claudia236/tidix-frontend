import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { getErrorMessage } from '../../../src/api/client';
import { cleaningApi } from '../../../src/api/cleaning';
import { showAlert } from '../../../src/components/AppAlert';
import { CleaningTaskForm } from '../../../src/components/CleaningTaskForm';
import { useI18n } from '../../../src/i18n/I18nContext';
import type { ColorPalette } from '../../../src/theme/colors';
import { useTheme } from '../../../src/theme/ThemeContext';
import type { CleaningTaskInput } from '../../../src/types';

export default function NewCleaningTaskScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const createMutation = useMutation({
    mutationFn: (input: CleaningTaskInput) => cleaningApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cleaning-tasks'] });
      router.back();
    },
    onError: (e) => showAlert(t('common.error'), getErrorMessage(e, t)),
  });

  return (
    <View style={styles.container}>
      <CleaningTaskForm
        submitLabel={t('common.add')}
        submitting={createMutation.isPending}
        onSubmit={(input) => createMutation.mutate(input)}
      />
    </View>
  );
}

function createStyles(COLORS: ColorPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
  });
}
