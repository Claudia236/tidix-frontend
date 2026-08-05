import { Stack } from 'expo-router';
import React from 'react';
import { useI18n } from '../../src/i18n/I18nContext';
import { useTheme } from '../../src/theme/ThemeContext';

export default function AppLayout() {
  const { colors } = useTheme();
  const { t } = useI18n();

  return (
    <Stack screenOptions={{ headerTintColor: colors.ink, headerTitleStyle: { color: colors.ink } }}>
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
        name="shopping-note/new"
        options={{ presentation: 'modal', title: t('shoppingNote.new.title'), headerStyle: { backgroundColor: colors.bg } }}
      />
      <Stack.Screen
        name="shopping-note/[id]"
        options={{ presentation: 'modal', title: t('shoppingNote.edit.title'), headerStyle: { backgroundColor: colors.bg } }}
      />
      <Stack.Screen
        name="scan-receipt"
        options={{ presentation: 'modal', title: t('appLayout.scanReceipt'), headerStyle: { backgroundColor: colors.bg } }}
      />
      <Stack.Screen
        name="shopping-purchased"
        options={{ title: t('appLayout.purchased'), headerStyle: { backgroundColor: colors.bg } }}
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
        name="cleaning-task/new"
        options={{ presentation: 'modal', title: t('appLayout.newCleaningTask'), headerStyle: { backgroundColor: colors.bg } }}
      />
      <Stack.Screen
        name="cleaning-task/[id]"
        options={{ presentation: 'modal', title: t('appLayout.editCleaningTask'), headerStyle: { backgroundColor: colors.bg } }}
      />
      <Stack.Screen
        name="waste"
        options={{ title: t('more.waste.label'), headerStyle: { backgroundColor: colors.bg } }}
      />
      <Stack.Screen
        name="expenses"
        options={{ title: t('more.expenses.label'), headerStyle: { backgroundColor: colors.bg } }}
      />
      <Stack.Screen
        name="expense/new"
        options={{ presentation: 'modal', title: t('appLayout.newExpense'), headerStyle: { backgroundColor: colors.bg } }}
      />
      <Stack.Screen
        name="expense/[id]"
        options={{ presentation: 'modal', title: t('appLayout.editExpense'), headerStyle: { backgroundColor: colors.bg } }}
      />
      <Stack.Screen
        name="settlements"
        options={{ title: t('appLayout.settlements'), headerStyle: { backgroundColor: colors.bg } }}
      />
      <Stack.Screen
        name="zone/new"
        options={{ presentation: 'modal', title: t('appLayout.newZone'), headerStyle: { backgroundColor: colors.bg } }}
      />
      <Stack.Screen
        name="zone/[id]"
        options={{ presentation: 'modal', title: t('appLayout.editZone'), headerStyle: { backgroundColor: colors.bg } }}
      />
    </Stack>
  );
}
