import axios from 'axios';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/auth';
import { clearPersistedToken, loadPersistedToken, persistToken } from '../api/client';
import { queryClient } from '../api/queryClient';
import { cancelAllNotifications } from '../notifications/core';
import type { UserResponse } from '../types';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface AuthContextValue {
  user: UserResponse | null;
  loading: boolean;
  // true se il token persistito non e' stato verificabile per un errore di
  // rete/timeout (non un 401 esplicito): il token resta valido e va solo
  // riprovato, non trattato come un logout.
  bootError: boolean;
  retryBootstrap: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [bootError, setBootError] = useState(false);

  const bootstrap = useCallback(async () => {
    setLoading(true);
    setBootError(false);
    try {
      const token = await loadPersistedToken();
      if (token) {
        try {
          const me = await authApi.me();
          setUser(me);
        } catch (e) {
          // Un 401 esplicito significa che il token non e' (piu') valido
          // (scaduto, o revocato da un reset password fatto altrove): va
          // cancellato e l'utente va sloggato. Qualunque ALTRO errore (rete
          // assente, timeout durante il "risveglio" del backend gratuito su
          // Render, che puo' impiegare svariate decine di secondi) non deve
          // invece forzare un logout: il token resta valido, e' solo
          // temporaneamente non verificabile.
          if (axios.isAxiosError(e) && e.response?.status === 401) {
            await clearPersistedToken();
            setUser(null);
          } else {
            setBootError(true);
          }
        }
      }
    } catch (e) {
      // loadPersistedToken() stesso puo' fallire (storage non disponibile,
      // errore di lettura): senza questo catch la promise rifiutata non
      // gestita lascerebbe loading bloccato a true per sempre, inchiodando
      // l'utente sulla schermata di avvio.
      setBootError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    await persistToken(res.token);
    setUser(res.user);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const res = await authApi.register(name, email, password);
    await persistToken(res.token);
    setUser(res.user);
  }, []);

  const logout = useCallback(async () => {
    await clearPersistedToken();
    setUser(null);
    queryClient.clear();
    // I promemoria programmati (scadenze, pulizie, ...) riguardano la
    // famiglia dell'utente appena sloggato: senza cancellarli continuerebbero
    // ad arrivare anche a sessione terminata (e persino a un altro utente
    // che facesse login sullo stesso dispositivo).
    await cancelAllNotifications().catch(() => {});
  }, []);

  const refreshUser = useCallback(async () => {
    // Un fallimento di rete/timeout isolato (es. il backend gratuito su
    // Render che si "risveglia") non deve far sembrare fallita un'azione
    // andata a buon fine sul server (creare/entrare/uscire da una famiglia):
    // si ritenta con backoff prima di propagare l'errore. Un 401 esplicito
    // invece e' un vero logout e va propagato subito, senza ritentare.
    const attempts = [0, 1500, 3000];
    for (let i = 0; i < attempts.length; i++) {
      if (attempts[i] > 0) {
        await delay(attempts[i]);
      }
      try {
        const me = await authApi.me();
        setUser(me);
        return;
      } catch (e) {
        if (axios.isAxiosError(e) && e.response?.status === 401) {
          await clearPersistedToken();
          setUser(null);
          throw e;
        }
        if (i === attempts.length - 1) {
          throw e;
        }
      }
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, bootError, retryBootstrap: bootstrap, login, register, logout, refreshUser }),
    [user, loading, bootError, bootstrap, login, register, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve essere usato dentro AuthProvider');
  return ctx;
}
