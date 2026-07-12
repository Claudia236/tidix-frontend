import { apiClient } from './client';
import type { WasteLog, WasteType } from '../types';

export const wasteApi = {
  recent: (days = 14) => apiClient.get<WasteLog[]>('/api/waste-logs', { params: { days } }).then((r) => r.data),

  create: (type: WasteType, date?: string) =>
    apiClient.post<WasteLog>('/api/waste-logs', { type, date }).then((r) => r.data),

  remove: (id: string) => apiClient.delete(`/api/waste-logs/${id}`).then(() => undefined),
};
