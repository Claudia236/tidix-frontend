import { QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { queryClient } from '../src/api/queryClient';
import { AppAlertHost } from '../src/components/AppAlert';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { I18nProvider } from '../src/i18n/I18nContext';
import { ThemeProvider, useTheme } from '../src/theme/ThemeContext';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <I18nProvider>
            <QueryClientProvider client={queryClient}>
              <AuthProvider>
                <ThemedStatusBar />
                <RootNavigator />
                <AppAlertHost />
              </AuthProvider>
            </QueryClientProvider>
          </I18nProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function ThemedStatusBar() {
  const { scheme } = useTheme();
  return <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />;
}

function RootNavigator() {
  const { user, loading } = useAuth();
  const { colors } = useTheme();

  useEffect(() => {
    if (!loading) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [loading]);

  if (loading) {
    // Non lasciare mai lo schermo completamente vuoto: se lo splash screen
    // nativo si nasconde da solo prima che la richiesta iniziale (che puo'
    // impiegare parecchi secondi se il backend su Render si sta "risvegliando")
    // sia completata, mostriamo comunque un indicatore invece di nulla.
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.brand} />
      </View>
    );
  }

  const isLoggedIn = !!user;
  const hasHousehold = !!user?.householdId;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!isLoggedIn}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={isLoggedIn && !hasHousehold}>
        <Stack.Screen name="(household-setup)" />
      </Stack.Protected>
      <Stack.Protected guard={isLoggedIn && hasHousehold}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
    </Stack>
  );
}
