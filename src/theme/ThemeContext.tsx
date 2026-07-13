import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { secureStorage } from '../api/secureStorage';
import { ACCENTS, buildPalette, type AccentKey, type ColorPalette, type ColorScheme } from './colors';

export type ThemeMode = 'light' | 'dark' | 'system';

const MODE_KEY = 'ld_theme_mode';
const ACCENT_KEY = 'ld_theme_accent';

interface ThemeContextValue {
  colors: ColorPalette;
  scheme: ColorScheme;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  accent: AccentKey;
  setAccent: (accent: AccentKey) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [accent, setAccentState] = useState<AccentKey>('green');

  useEffect(() => {
    (async () => {
      const [savedMode, savedAccent] = await Promise.all([
        secureStorage.getItemAsync(MODE_KEY),
        secureStorage.getItemAsync(ACCENT_KEY),
      ]);
      if (savedMode === 'light' || savedMode === 'dark' || savedMode === 'system') {
        setModeState(savedMode);
      }
      if (savedAccent && savedAccent in ACCENTS) {
        setAccentState(savedAccent as AccentKey);
      }
    })();
  }, []);

  function setMode(next: ThemeMode) {
    setModeState(next);
    secureStorage.setItemAsync(MODE_KEY, next).catch(() => {});
  }

  function setAccent(next: AccentKey) {
    setAccentState(next);
    secureStorage.setItemAsync(ACCENT_KEY, next).catch(() => {});
  }

  const scheme: ColorScheme = mode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : mode;
  const colors = useMemo(() => buildPalette(scheme, accent), [scheme, accent]);

  const value = useMemo(
    () => ({ colors, scheme, mode, setMode, accent, setAccent }),
    [colors, scheme, mode, accent]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme deve essere usato dentro ThemeProvider');
  return ctx;
}
