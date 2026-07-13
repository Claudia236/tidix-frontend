import { apiClient } from './client';
import type { Category, ShoppingNote } from '../types';

export const shoppingNotesApi = {
  list: () => apiClient.get<ShoppingNote[]>('/api/shopping-list-notes').then((r) => r.data),

  create: (text: string, category?: Category | null) =>
    apiClient.post<ShoppingNote>('/api/shopping-list-notes', { text, category: category ?? undefined }).then((r) => r.data),

  check: (id: string) => apiClient.patch<ShoppingNote>(`/api/shopping-list-notes/${id}/check`).then((r) => r.data),

  uncheck: (id: string) => apiClient.patch<ShoppingNote>(`/api/shopping-list-notes/${id}/uncheck`).then((r) => r.data),

  remove: (id: string) => apiClient.delete(`/api/shopping-list-notes/${id}`).then(() => undefined),
};
