import axios, { AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import type { ApiErrorBody } from '../types';

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080';

export const TOKEN_KEY = 'ld_auth_token';

export const apiClient = axios.create({ baseURL: API_URL });

let currentToken: string | null = null;

export function setAuthToken(token: string | null) {
  currentToken = token;
}

apiClient.interceptors.request.use((config) => {
  if (currentToken) {
    config.headers.Authorization = `Bearer ${currentToken}`;
  }
  return config;
});

export async function loadPersistedToken(): Promise<string | null> {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  setAuthToken(token);
  return token;
}

export async function persistToken(token: string) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  setAuthToken(token);
}

export async function clearPersistedToken() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  setAuthToken(null);
}

export function getErrorMessage(error: unknown, fallback = 'Si è verificato un errore. Riprova.'): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiErrorBody>;
    const body = axiosError.response?.data;
    if (body?.details?.length) return body.details.join('\n');
    if (body?.message) return body.message;
    if (axiosError.message === 'Network Error') return 'Impossibile contattare il server. Controlla la connessione.';
  }
  return fallback;
}
