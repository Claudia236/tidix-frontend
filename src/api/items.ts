import { Platform } from 'react-native';
import { apiClient } from './client';
import type { AdjustQuantityInput, Item, ItemInput, ZoneSummary } from '../types';

export interface ItemScanResult {
  name: string | null;
  expirationDate: string | null;
}

export const itemsApi = {
  list: (params?: { storageLocationId?: string; search?: string }) =>
    apiClient.get<Item[]>('/api/items', { params }).then((r) => r.data),

  get: (id: string) => apiClient.get<Item>(`/api/items/${id}`).then((r) => r.data),

  create: (input: ItemInput) => apiClient.post<Item>('/api/items', input).then((r) => r.data),

  update: (id: string, input: ItemInput) => apiClient.put<Item>(`/api/items/${id}`, input).then((r) => r.data),

  remove: (id: string) => apiClient.delete(`/api/items/${id}`).then(() => undefined),

  adjustQuantity: (id: string, input: AdjustQuantityInput) =>
    apiClient.patch<Item>(`/api/items/${id}/quantity`, input).then((r) => r.data),

  expiring: (days = 3) => apiClient.get<Item[]>('/api/items/expiring', { params: { days } }).then((r) => r.data),

  expired: () => apiClient.get<Item[]>('/api/items/expired').then((r) => r.data),

  shoppingList: () => apiClient.get<Item[]>('/api/items/shopping-list').then((r) => r.data),

  summary: () => apiClient.get<ZoneSummary[]>('/api/items/summary').then((r) => r.data),

  // Carica 1-2 foto della confezione di un prodotto al backend, che le
  // inoltra a Claude e restituisce direttamente nome e scadenza riconosciuti
  // (vedi ItemScanService lato backend) - sostituisce l'OCR on-device via
  // ML Kit usato in precedenza, che funzionava solo su iOS/Android.
  scan: async (uris: string[]): Promise<ItemScanResult> => {
    const formData = new FormData();
    const headers: Record<string, string> = {};

    if (Platform.OS === 'web') {
      for (let i = 0; i < uris.length; i++) {
        const blob = await (await fetch(uris[i])).blob();
        formData.append('images', blob, `product-${i}.jpg`);
      }
    } else {
      for (let i = 0; i < uris.length; i++) {
        formData.append('images', {
          uri: uris[i],
          name: `product-${i}.jpg`,
          type: 'image/jpeg',
        } as unknown as Blob);
      }
      headers['Content-Type'] = 'multipart/form-data';
    }

    const response = await apiClient.post<ItemScanResult>('/api/items/scan', formData, {
      headers,
      timeout: 60000,
    });
    return response.data;
  },
};
