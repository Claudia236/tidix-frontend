import { apiClient } from './client';
import type { ShoppingNote } from '../types';

export const shoppingNotesApi = {
  list: () => apiClient.get<ShoppingNote[]>('/api/shopping-list-notes').then((r) => r.data),

  create: (text: string) =>
    apiClient.post<ShoppingNote>('/api/shopping-list-notes', { text }).then((r) => r.data),

  remove: (id: string) => apiClient.delete(`/api/shopping-list-notes/${id}`).then(() => undefined),
};
