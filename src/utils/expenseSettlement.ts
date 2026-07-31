import type { Expense } from '../types';

export interface SettlementAllocation {
  expenseId: string;
  expenseDescription: string;
  amountApplied: number;
  newPaidAmount: number;
}

export interface SettlementResult {
  allocations: SettlementAllocation[];
  allocatedTotal: number;
  leftover: number;
}

/**
 * Distribuisce un pagamento forfettario sulle quote non ancora saldate di
 * debtorUserId, dalla spesa piu' vecchia alla piu' recente, fino ad esaurire
 * l'importo. Le quote in cui debtorUserId e' anche chi ha pagato (paidByUserId)
 * sono escluse: non ha senso "saldare" una quota verso se stessi.
 */
export function computeFifoSettlement(expenses: Expense[], debtorUserId: string, amount: number): SettlementResult {
  const unpaid = expenses
    .filter((e) => e.paidByUserId !== debtorUserId)
    .map((e) => ({ expense: e, split: e.splits.find((s) => s.userId === debtorUserId) }))
    .filter((x): x is { expense: Expense; split: NonNullable<typeof x.split> } => !!x.split && x.split.amount - x.split.paidAmount > 0.01)
    .sort((a, b) => a.expense.date.localeCompare(b.expense.date) || a.expense.createdAt.localeCompare(b.expense.createdAt));

  let remaining = Math.round(amount * 100) / 100;
  const allocations: SettlementAllocation[] = [];

  for (const { expense, split } of unpaid) {
    if (remaining <= 0.001) break;
    const due = Math.round((split.amount - split.paidAmount) * 100) / 100;
    const toApply = Math.min(remaining, due);
    const newPaidAmount = Math.round((split.paidAmount + toApply) * 100) / 100;
    allocations.push({ expenseId: expense.id, expenseDescription: expense.description, amountApplied: toApply, newPaidAmount });
    remaining = Math.round((remaining - toApply) * 100) / 100;
  }

  const allocatedTotal = Math.round(allocations.reduce((sum, a) => sum + a.amountApplied, 0) * 100) / 100;
  return { allocations, allocatedTotal, leftover: Math.max(0, remaining) };
}

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
