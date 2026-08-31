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

  // Ogni s.amount/paidAmount arriva dal backend gia' arrotondato ai centesimi
  // in modo indipendente per ciascun utente: su tante spese questi minuscoli
  // arrotondamenti possono accumularsi in un residuo di un centesimo tra i
  // due lati (es. "Deve dare 5.87" contro "Deve ricevere 5.86"), invisibile
  // finche' i saldi restavano vicini allo zero ma evidente altrimenti. Per
  // garantire che il totale di tutti i saldi sia sempre esattamente zero, si
  // arrotonda un utente alla volta e l'ultimo si ottiene per differenza.
  const ids = [...balances.keys()];
  let roundedSum = 0;
  for (let i = 0; i < ids.length - 1; i++) {
    const rounded = Math.round(balances.get(ids[i])! * 100) / 100;
    balances.set(ids[i], rounded);
    roundedSum += rounded;
  }
  if (ids.length > 0) {
    const lastId = ids[ids.length - 1];
    balances.set(lastId, Math.round(-roundedSum * 100) / 100);
  }
  return balances;
}

// Quanto debtorUserId deve sulle proprie spese, al lordo (ignora eventuali
// spese nella direzione opposta, cioe' pagate da debtorUserId per cui e'
// invece lui/lei ad essere in credito). Usato per precompilare "Segna
// pagamento": pagando questo importo, tutte le spese di debtorUserId
// risultano saldate per intero in un colpo solo, senza mai scoprirsi di
// nuovo in seguito. Il saldo netto mostrato altrove (che tiene conto anche
// dei debiti nella direzione opposta) puo' quindi differire da questo
// importo se esistono spese pagate da debtorUserId per cui l'altra persona
// deve ancora saldare la propria quota.
export function totalOwedByUser(expenses: Expense[], debtorUserId: string): number {
  const total = expenses
    .filter((e) => e.paidByUserId !== debtorUserId)
    .flatMap((e) => e.splits.filter((s) => s.userId === debtorUserId))
    .reduce((sum, s) => sum + Math.max(0, s.amount - s.paidAmount), 0);
  return Math.round(total * 100) / 100;
}
