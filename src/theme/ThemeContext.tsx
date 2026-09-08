import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { secureStorage } from '../api/secureStorage';
import { buildPalette, type ColorPalette, type ColorScheme } from './colors';

export type ThemeMode = 'light' | 'dark';

const MODE_KEY = 'ld_theme_mode';

interface ThemeContextValue {
  colors: ColorPalette;
  scheme: ColorScheme;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  // Parte dallo schema di sistema (invece di un fisso 'light') per evitare
  // un flash del tema sbagliato all'avvio a freddo, prima che la preferenza
  // salvata venga letta in modo asincrono da secureStorage.
  const [mode, setModeState] = useState<ThemeMode>(systemScheme === 'dark' ? 'dark' : 'light');

  useEffect(() => {
    (async () => {
      const savedMode = await secureStorage.getItemAsync(MODE_KEY);
      if (savedMode === 'light' || savedMode === 'dark') {
        setModeState(savedMode);
      }
    })();
  }, []);

  function setMode(next: ThemeMode) {
    setModeState(next);
    secureStorage.setItemAsync(MODE_KEY, next).catch(() => {});
  }

  const colors = useMemo(() => buildPalette(mode), [mode]);

  const value = useMemo(() => ({ colors, scheme: mode, mode, setMode }), [colors, mode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme deve essere usato dentro ThemeProvider');
  return ctx;
}
