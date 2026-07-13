import { Stack } from 'expo-router';
import React from 'react';
import { useI18n } from '../../src/i18n/I18nContext';
import { useTheme } from '../../src/theme/ThemeContext';

export default function AppLayout() {
  const { colors } = useTheme();
  const { t } = useI18n();

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="item/new"
        options={{ presentation: 'modal', title: t('appLayout.newProduct'), headerStyle: { backgroundColor: colors.bg } }}
      />
      <Stack.Screen
        name="item/[id]"
        options={{ presentation: 'modal', title: t('appLayout.editProduct'), headerStyle: { backgroundColor: colors.bg } }}
      />
      <Stack.Screen
        name="household"
        options={{ title: t('appLayout.household'), headerStyle: { backgroundColor: colors.bg } }}
      />
      <Stack.Screen
        name="cleaning"
        options={{ title: t('more.cleaning.label'), headerStyle: { backgroundColor: colors.bg } }}
      />
      <Stack.Screen
        name="waste"
        options={{ title: t('more.waste.label'), headerStyle: { backgroundColor: colors.bg } }}
      />
      <Stack.Screen
        name="expenses"
        options={{ title: t('more.expenses.label'), headerStyle: { backgroundColor: colors.bg } }}
      />
    </Stack>
  );
}
