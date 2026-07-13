import { apiClient } from './client';
import type { CleaningTask, CleaningTaskInput } from '../types';

export const cleaningApi = {
  list: () => apiClient.get<CleaningTask[]>('/api/cleaning-tasks').then((r) => r.data),

  create: (input: CleaningTaskInput) =>
    apiClient.post<CleaningTask>('/api/cleaning-tasks', input).then((r) => r.data),

  update: (id: string, input: CleaningTaskInput) =>
    apiClient.put<CleaningTask>(`/api/cleaning-tasks/${id}`, input).then((r) => r.data),

  markCleaned: (id: string) =>
    apiClient.patch<CleaningTask>(`/api/cleaning-tasks/${id}/mark-cleaned`).then((r) => r.data),

  remove: (id: string) => apiClient.delete(`/api/cleaning-tasks/${id}`).then(() => undefined),
};
