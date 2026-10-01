import { QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { secureStorage } from '../src/api/secureStorage';
import { queryClient } from '../src/api/queryClient';
import { AppAlertHost } from '../src/components/AppAlert';
import { AppGuideModal } from '../src/components/AppGuideModal';
import { PrimaryButton } from '../src/components/PrimaryButton';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { I18nProvider, useI18n } from '../src/i18n/I18nContext';
import { ThemeProvider, useTheme } from '../src/theme/ThemeContext';

SplashScreen.preventAutoHideAsync().catch(() => {});

// Una volta sola per installazione: non deve ripresentarsi ai login
// successivi, ne' riproporsi a ogni riapertura dell'app con una sessione
// gia' attiva.
const GUIDE_AUTO_SHOWN_KEY = 'ld_guide_auto_shown';

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
  const { user, loading, bootError, retryBootstrap } = useAuth();
  const { colors } = useTheme();
  const { t } = useI18n();

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

  if (bootError) {
    // Il token persistito non e' stato verificabile per un errore di rete/
    // timeout (non un 401 esplicito, gia' gestito con un logout vero e
    // proprio in AuthContext): non si manda l'utente al login, che gli
    // farebbe perdere una sessione in realta' ancora valida, solo
    // temporaneamente non confermabile (es. il backend gratuito su Render
    // si sta "risvegliando" e puo' impiegare svariate decine di secondi).
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg, padding: 24, gap: 16 }}>
        <Text style={{ color: colors.ink, textAlign: 'center', fontSize: 14 }}>{t('common.networkError')}</Text>
        <PrimaryButton label={t('common.retry')} onPress={retryBootstrap} />
      </View>
    );
  }

  const isLoggedIn = !!user;
  const hasHousehold = !!user?.householdId;

  return (
    <>
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
      {isLoggedIn && hasHousehold ? <AutoGuide /> : null}
    </>
  );
}

// Mostra la guida automaticamente al primo ingresso nell'app vero e proprio
// (dopo login/registrazione e dopo aver creato/unito una famiglia), una sola
// volta per installazione: ai login successivi resta raggiungibile a mano da
// Famiglia, ma non si ripresenta da sola.
function AutoGuide() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    secureStorage.getItemAsync(GUIDE_AUTO_SHOWN_KEY).then((seen) => {
      if (!cancelled && !seen) setVisible(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function handleClose() {
    setVisible(false);
    secureStorage.setItemAsync(GUIDE_AUTO_SHOWN_KEY, '1').catch(() => {});
  }

  return <AppGuideModal visible={visible} onClose={handleClose} />;
}
