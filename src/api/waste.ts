import { apiClient } from './client';
import type { DayOfWeek, WasteSchedule, WasteType } from '../types';

export const wasteApi = {
  list: () => apiClient.get<WasteSchedule[]>('/api/waste-schedules').then((r) => r.data),

  setSchedule: (type: WasteType, daysOfWeek: DayOfWeek[]) =>
    apiClient.put<WasteSchedule>(`/api/waste-schedules/${type}`, { daysOfWeek }).then((r) => r.data),

  remove: (type: WasteType) => apiClient.delete(`/api/waste-schedules/${type}`).then(() => undefined),
};
