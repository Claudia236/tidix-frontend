import { apiClient } from './client';
import type { RecipeSuggestion } from '../types';

export const recipesApi = {
  suggest: () =>
    apiClient.post<{ recipes: RecipeSuggestion[] }>('/api/recipes/suggest').then((r) => r.data.recipes),
};
