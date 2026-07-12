import { apiClient } from './client';
import type { StorageLocation, StorageLocationInput } from '../types';

export const storageLocationsApi = {
  list: () => apiClient.get<StorageLocation[]>('/api/storage-locations').then((r) => r.data),

  create: (input: StorageLocationInput) =>
    apiClient.post<StorageLocation>('/api/storage-locations', input).then((r) => r.data),

  remove: (id: string) => apiClient.delete(`/api/storage-locations/${id}`).then(() => undefined),
};
