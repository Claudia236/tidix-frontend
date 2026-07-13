import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { secureStorage } from '../api/secureStorage';
import { DICTIONARIES, type Language } from './translations';

const LANGUAGE_KEY = 'ld_language';

export type TranslateFn = (key: string, vars?: Record<string, string | number>) => string;

interface I18nContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: TranslateFn;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('it');

  useEffect(() => {
    (async () => {
      const saved = await secureStorage.getItemAsync(LANGUAGE_KEY);
      if (saved === 'it' || saved === 'en' || saved === 'es') {
        setLanguageState(saved);
      }
    })();
  }, []);

  function setLanguage(next: Language) {
    setLanguageState(next);
    secureStorage.setItemAsync(LANGUAGE_KEY, next).catch(() => {});
  }

  const t = useMemo(() => {
    return (key: string, vars?: Record<string, string | number>) => {
      const entry = DICTIONARIES[language][key] ?? DICTIONARIES.it[key];
      if (entry === undefined) return key;
      if (typeof entry === 'function') return entry(vars ?? {});
      if (!vars) return entry;
      return entry.replace(/\{\{(\w+)\}\}/g, (_, k) => String(vars[k] ?? ''));
    };
  }, [language]);

  const value = useMemo(() => ({ language, setLanguage, t }), [language, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n deve essere usato dentro I18nProvider');
  return ctx;
}
