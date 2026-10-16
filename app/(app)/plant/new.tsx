import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Stack, useRouter } from 'expo-router';
import React, { useMemo, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { getErrorMessage } from '../../../src/api/client';
import { plantsApi } from '../../../src/api/plants';
import { showAlert } from '../../../src/components/AppAlert';
import { PlantForm, type PlantFormHandle } from '../../../src/components/PlantForm';
import { useI18n } from '../../../src/i18n/I18nContext';
import type { ColorPalette } from '../../../src/theme/colors';
import { useTheme } from '../../../src/theme/ThemeContext';
import type { PlantInput } from '../../../src/types';

export default function NewPlantScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const formRef = useRef<PlantFormHandle>(null);

  const createMutation = useMutation({
    mutationFn: (input: PlantInput) => plantsApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plants'] });
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
      <PlantForm
        ref={formRef}
        submitLabel={t('common.add')}
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
