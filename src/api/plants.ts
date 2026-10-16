import { apiClient } from './client';
import type { Plant, PlantInput } from '../types';

export const plantsApi = {
  list: () => apiClient.get<Plant[]>('/api/plants').then((r) => r.data),

  get: (id: string) => apiClient.get<Plant>(`/api/plants/${id}`).then((r) => r.data),

  create: (input: PlantInput) => apiClient.post<Plant>('/api/plants', input).then((r) => r.data),

  update: (id: string, input: PlantInput) => apiClient.put<Plant>(`/api/plants/${id}`, input).then((r) => r.data),

  markWatered: (id: string) => apiClient.patch<Plant>(`/api/plants/${id}/mark-watered`).then((r) => r.data),

  remove: (id: string) => apiClient.delete(`/api/plants/${id}`).then(() => undefined),
};
