import { apiClient } from './client';
import type { RecipeSuggestion } from '../types';

export const recipesApi = {
  suggest: (extraIngredients?: string[]) =>
    apiClient
      .post<{ recipes: RecipeSuggestion[] }>('/api/recipes/suggest', { extraIngredients })
      .then((r) => r.data.recipes),
};
