import { apiClient } from './client';
import type { Expense, ExpenseInput, ExpenseSummary } from '../types';

export const expensesApi = {
  list: (month?: string) =>
    apiClient.get<Expense[]>('/api/expenses', { params: month ? { month } : undefined }).then((r) => r.data),

  create: (input: ExpenseInput) => apiClient.post<Expense>('/api/expenses', input).then((r) => r.data),

  update: (id: string, input: ExpenseInput) => apiClient.put<Expense>(`/api/expenses/${id}`, input).then((r) => r.data),

  remove: (id: string) => apiClient.delete(`/api/expenses/${id}`).then(() => undefined),

  setSplitPaid: (id: string, userId: string, paid: boolean) =>
    apiClient.patch<Expense>(`/api/expenses/${id}/splits/${userId}`, { paid }).then((r) => r.data),

  summary: (month?: string) =>
    apiClient
      .get<ExpenseSummary>('/api/expenses/summary', { params: month ? { month } : undefined })
      .then((r) => r.data),
};
