import { apiClient } from './client';
import type { Supermarket, SupermarketInput } from '../types';

export const supermarketsApi = {
  list: () => apiClient.get<Supermarket[]>('/api/supermarkets').then((r) => r.data),

  create: (input: SupermarketInput) =>
    apiClient.post<Supermarket>('/api/supermarkets', input).then((r) => r.data),
};
