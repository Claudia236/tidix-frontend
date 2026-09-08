import axios from 'axios';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/auth';
import { clearPersistedToken, loadPersistedToken, persistToken } from '../api/client';
import { queryClient } from '../api/queryClient';
import type { UserResponse } from '../types';

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
    setLoading(false);
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
  }, []);

  const refreshUser = useCallback(async () => {
    const me = await authApi.me();
    setUser(me);
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
