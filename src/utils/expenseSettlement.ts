import type { Expense, Settlement } from '../types';

/**
 * Saldo netto di ogni utente su tutte le spese passate (non solo quelle del
 * mese selezionato): stessa formula usata dal backend per il saldo mensile
 * (vedi ExpenseService.summary), applicata pero' all'intera lista di spese.
 *
 * Se vengono passati anche i pagamenti forfettari, l'eventuale "leftover" di
 * ciascuno (importo versato oltre al dovuto, non allocabile su nessuna quota)
 * viene trattato come credito: va ad aumentare il saldo di chi ha pagato in
 * piu' e a diminuire in parti uguali quello degli altri membri, altrimenti
 * l'eccedenza sparirebbe silenziosamente e il saldo risulterebbe "in pari"
 * anche quando in realta' e' stato versato piu' del dovuto.
 */
export function computeAllTimeNetBalances(expenses: Expense[], settlements: Settlement[] = []): Map<string, number> {
  const userIds = new Set<string>();
  for (const e of expenses) {
    userIds.add(e.paidByUserId);
    for (const s of e.splits) userIds.add(s.userId);
  }
  for (const s of settlements) userIds.add(s.debtorUserId);

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
    balances.set(userId, netPaid - totalShare);
  }

  for (const settlement of settlements) {
    if (settlement.leftover <= 0.01) continue;
    const others = [...userIds].filter((id) => id !== settlement.debtorUserId);
    if (others.length === 0) continue;
    balances.set(settlement.debtorUserId, (balances.get(settlement.debtorUserId) ?? 0) + settlement.leftover);
    const share = settlement.leftover / others.length;
    for (const id of others) {
      balances.set(id, (balances.get(id) ?? 0) - share);
    }
  }

  for (const [userId, value] of balances) {
    balances.set(userId, Math.round(value * 100) / 100);
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
