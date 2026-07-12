import { apiClient } from './client';
import type { AuthResponse, UserResponse } from '../types';

export const authApi = {
  register: (name: string, email: string, password: string) =>
    apiClient.post<AuthResponse>('/api/auth/register', { name, email, password }).then((r) => r.data),

  login: (email: string, password: string) =>
    apiClient.post<AuthResponse>('/api/auth/login', { email, password }).then((r) => r.data),

  me: () => apiClient.get<UserResponse>('/api/auth/me').then((r) => r.data),
};
