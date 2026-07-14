import { apiClient } from './client';
import type { AuthResponse, UserResponse } from '../types';

export const authApi = {
  register: (name: string, email: string, password: string) =>
    apiClient.post<AuthResponse>('/api/auth/register', { name, email, password }).then((r) => r.data),

  login: (email: string, password: string) =>
    apiClient.post<AuthResponse>('/api/auth/login', { email, password }).then((r) => r.data),

  me: () => apiClient.get<UserResponse>('/api/auth/me').then((r) => r.data),

  forgotPassword: (email: string) =>
    apiClient.post<void>('/api/auth/forgot-password', { email }).then(() => undefined),

  resetPassword: (email: string, code: string, newPassword: string) =>
    apiClient.post<void>('/api/auth/reset-password', { email, code, newPassword }).then(() => undefined),
};
