import type { Expense } from '../types';

/**
 * Saldo netto di ogni utente su tutte le spese passate (non solo quelle del
 * mese selezionato): stessa formula usata dal backend per il saldo mensile
 * (vedi ExpenseService.summary), applicata pero' all'intera lista di spese.
 */
export function computeAllTimeNetBalances(expenses: Expense[]): Map<string, number> {
  const userIds = new Set<string>();
  for (const e of expenses) {
    userIds.add(e.paidByUserId);
    for (const s of e.splits) userIds.add(s.userId);
  }

  const balances = new Map<string, number>();
  for (const userId of userIds) {
    const rawPaid = expenses.filter((e) => e.paidByUserId === userId).reduce((sum, e) => sum + e.amount, 0);
    const totalShare = expenses
      .flatMap((e) => e.splits.filter((s) => s.userId === userId))
      .reduce((sum, s) => sum + s.amount, 0);
    // quote proprie gia' saldate con chi ha pagato: soldi che userId ha dato ad altri
    const paidBack = expenses
      .filter((e) => e.paidByUserId !== userId)
      .flatMap((e) => e.splits.filter((s) => s.userId === userId))
      .reduce((sum, s) => sum + s.paidAmount, 0);
    // quote altrui gia' saldate con userId: soldi che userId ha ricevuto dagli altri
    const received = expenses
      .filter((e) => e.paidByUserId === userId)
      .flatMap((e) => e.splits.filter((s) => s.userId !== userId))
      .reduce((sum, s) => sum + s.paidAmount, 0);
    const netPaid = rawPaid - received + paidBack;
    balances.set(userId, Math.round((netPaid - totalShare) * 100) / 100);
  }
  return balances;
}

export function totalOwedByUser(expenses: Expense[], debtorUserId: string): number {
  const total = expenses
    .filter((e) => e.paidByUserId !== debtorUserId)
    .flatMap((e) => e.splits.filter((s) => s.userId === debtorUserId))
    .reduce((sum, s) => sum + Math.max(0, s.amount - s.paidAmount), 0);
  return Math.round(total * 100) / 100;
}
