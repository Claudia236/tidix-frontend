import { Stack } from 'expo-router';
import React from 'react';
import { COLORS } from '../../src/theme/colors';

export default function AppLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="item/new"
        options={{ presentation: 'modal', title: 'Nuovo prodotto', headerStyle: { backgroundColor: COLORS.bg } }}
      />
      <Stack.Screen
        name="item/[id]"
        options={{ presentation: 'modal', title: 'Modifica prodotto', headerStyle: { backgroundColor: COLORS.bg } }}
      />
      <Stack.Screen
        name="household"
        options={{ title: 'La tua famiglia', headerStyle: { backgroundColor: COLORS.bg } }}
      />
      <Stack.Screen
        name="cleaning"
        options={{ title: 'Pulizia', headerStyle: { backgroundColor: COLORS.bg } }}
      />
      <Stack.Screen
        name="waste"
        options={{ title: 'Rifiuti', headerStyle: { backgroundColor: COLORS.bg } }}
      />
      <Stack.Screen
        name="expenses"
        options={{ title: 'Spese', headerStyle: { backgroundColor: COLORS.bg } }}
      />
      <Stack.Screen
        name="locations"
        options={{ title: 'Posizioni', headerStyle: { backgroundColor: COLORS.bg } }}
      />
    </Stack>
  );
}
