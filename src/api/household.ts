import { apiClient } from './client';
import type { HouseholdResponse } from '../types';

export const householdApi = {
  create: (name: string) =>
    apiClient.post<HouseholdResponse>('/api/households', { name }).then((r) => r.data),

  join: (inviteCode: string) =>
    apiClient.post<HouseholdResponse>('/api/households/join', { inviteCode }).then((r) => r.data),

  me: () => apiClient.get<HouseholdResponse>('/api/households/me').then((r) => r.data),

  rename: (name: string) =>
    apiClient.put<HouseholdResponse>('/api/households/me', { name }).then((r) => r.data),

  leave: () => apiClient.post('/api/households/leave').then(() => undefined),

  removeMember: (memberId: string) =>
    apiClient.delete(`/api/households/members/${memberId}`).then(() => undefined),
};
