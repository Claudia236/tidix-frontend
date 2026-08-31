import { apiClient } from './client';
import type { Settlement } from '../types';

export const settlementsApi = {
  list: () => apiClient.get<Settlement[]>('/api/settlements').then((r) => r.data),

  create: (debtorUserId: string, amount: number, date: string) =>
    apiClient.post<Settlement>('/api/settlements', { debtorUserId, amount, date }).then((r) => r.data),

  update: (id: string, amount: number, date: string) =>
    apiClient.put<Settlement>(`/api/settlements/${id}`, { amount, date }).then((r) => r.data),

  remove: (id: string) => apiClient.delete(`/api/settlements/${id}`).then(() => undefined),
};
