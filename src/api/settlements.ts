import { apiClient } from './client';
import type { Settlement } from '../types';

export const settlementsApi = {
  list: () => apiClient.get<Settlement[]>('/api/settlements').then((r) => r.data),

  create: (debtorUserId: string, amount: number) =>
    apiClient.post<Settlement>('/api/settlements', { debtorUserId, amount }).then((r) => r.data),

  update: (id: string, amount: number) =>
    apiClient.put<Settlement>(`/api/settlements/${id}`, { amount }).then((r) => r.data),

  remove: (id: string) => apiClient.delete(`/api/settlements/${id}`).then(() => undefined),
};
