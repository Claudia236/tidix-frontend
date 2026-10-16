import { Platform } from 'react-native';
import { apiClient } from './client';
import type { Plant, PlantInput } from '../types';

export interface PlantScanResult {
  name: string | null;
  wateringFrequencyDays: number | null;
  careTip: string | null;
}

export const plantsApi = {
  list: () => apiClient.get<Plant[]>('/api/plants').then((r) => r.data),

  get: (id: string) => apiClient.get<Plant>(`/api/plants/${id}`).then((r) => r.data),

  create: (input: PlantInput) => apiClient.post<Plant>('/api/plants', input).then((r) => r.data),

  update: (id: string, input: PlantInput) => apiClient.put<Plant>(`/api/plants/${id}`, input).then((r) => r.data),

  markWatered: (id: string) => apiClient.patch<Plant>(`/api/plants/${id}/mark-watered`).then((r) => r.data),

  remove: (id: string) => apiClient.delete(`/api/plants/${id}`).then(() => undefined),

  // Carica una foto della pianta al backend, che la inoltra a Claude e
  // restituisce specie riconosciuta, frequenza di annaffiatura suggerita e
  // un consiglio di cura (vedi PlantScanService lato backend). Stesso schema
  // di itemsApi.scan, ma con una sola immagine.
  scan: async (uri: string): Promise<PlantScanResult> => {
    const formData = new FormData();
    const headers: Record<string, string> = {};

    if (Platform.OS === 'web') {
      const blob = await (await fetch(uri)).blob();
      formData.append('image', blob, 'plant.jpg');
    } else {
      formData.append('image', { uri, name: 'plant.jpg', type: 'image/jpeg' } as unknown as Blob);
      headers['Content-Type'] = 'multipart/form-data';
    }

    const response = await apiClient.post<PlantScanResult>('/api/plants/scan', formData, {
      headers,
      timeout: 60000,
    });
    return response.data;
  },
};
