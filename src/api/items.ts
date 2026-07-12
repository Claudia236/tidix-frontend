import { apiClient } from './client';
import type { Item, ItemInput, StorageZone, ZoneSummary } from '../types';

export const itemsApi = {
  list: (params?: { zone?: StorageZone; search?: string }) =>
    apiClient.get<Item[]>('/api/items', { params }).then((r) => r.data),

  get: (id: string) => apiClient.get<Item>(`/api/items/${id}`).then((r) => r.data),

  create: (input: ItemInput) => apiClient.post<Item>('/api/items', input).then((r) => r.data),

  update: (id: string, input: ItemInput) => apiClient.put<Item>(`/api/items/${id}`, input).then((r) => r.data),

  remove: (id: string) => apiClient.delete(`/api/items/${id}`).then(() => undefined),

  adjustQuantity: (id: string, delta: number) =>
    apiClient.patch<Item>(`/api/items/${id}/quantity`, { delta }).then((r) => r.data),

  expiring: (days = 3) => apiClient.get<Item[]>('/api/items/expiring', { params: { days } }).then((r) => r.data),

  expired: () => apiClient.get<Item[]>('/api/items/expired').then((r) => r.data),

  shoppingList: () => apiClient.get<Item[]>('/api/items/shopping-list').then((r) => r.data),

  summary: () => apiClient.get<ZoneSummary[]>('/api/items/summary').then((r) => r.data),
};
