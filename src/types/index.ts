export type Category =
  | 'AVANZI'
  | 'PIATTI_PRONTI'
  | 'ORTOFRUTTA'
  | 'PASTA_CEREALI'
  | 'LEGUMI'
  | 'CARNE_PESCE'
  | 'LATTICINI_UOVA'
  | 'SOSTITUTI_VEGETALI'
  | 'CONSERVE'
  | 'CONDIMENTI'
  | 'SPEZIE'
  | 'DOLCI'
  | 'SNACK_SALATI'
  | 'FORNO_PASTICCERIA'
  | 'BEVANDE'
  | 'IGIENE'
  | 'CASA_PULIZIA'
  | 'CUCINA'
  | 'CASA'
  | 'ANIMALI'
  | 'BEBE'
  | 'FARMACIA'
  | 'ALTRO';

export type Unit = 'PZ' | 'KG' | 'G' | 'L' | 'ML' | 'CONF';

export type WasteType = 'ORGANICO' | 'PLASTICA' | 'CARTA_CARTONE' | 'VETRO' | 'INDIFFERENZIATO' | 'ALTRO';

export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  householdId: string | null;
}

export interface AuthResponse {
  token: string;
  user: UserResponse;
}

export interface HouseholdMember {
  id: string;
  name: string;
  email: string;
}

export interface HouseholdResponse {
  id: string;
  name: string;
  inviteCode: string;
  ownerId: string;
  members: HouseholdMember[];
  disabledCategories: Category[];
}

export interface StorageLocation {
  id: string;
  name: string;
  emoji: string;
  colorIndex: number | null;
}

export interface StorageLocationInput {
  name: string;
  emoji?: string;
  colorIndex?: number | null;
}

export interface Supermarket {
  id: string;
  name: string;
  emoji: string;
  colorIndex: number | null;
}

export interface SupermarketInput {
  name: string;
  emoji?: string;
  colorIndex?: number | null;
}

export interface Item {
  id: string;
  name: string;
  storageLocationId: string;
  supermarketId: string | null;
  category: Category;
  quantity: number;
  unit: Unit;
  expirationDate: string | null;
  daysUntilExpiration: number | null;
  purchaseDate: string | null;
  opened: boolean;
  openedDate: string | null;
  openedReminderEnabled: boolean;
  openedReminderDays: number;
  addedByUserId: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface ItemInput {
  name: string;
  storageLocationId: string;
  supermarketId?: string | null;
  category: Category;
  quantity: number;
  unit: Unit;
  expirationDate: string | null;
  purchaseDate?: string | null;
  opened?: boolean;
  openedDate?: string | null;
  openedReminderEnabled?: boolean;
  openedReminderDays?: number;
}

export interface AdjustQuantityInput {
  delta: number;
  expirationDate?: string | null;
  clearExpirationDate?: boolean;
  hideFromShoppingList?: boolean;
  clearOpened?: boolean;
}

export interface ShoppingNote {
  id: string;
  text: string;
  detail: string | null;
  category: Category | null;
  supermarketId: string | null;
  checked: boolean;
  checkedAt: string | null;
  addedByUserId: string;
  createdAt: string;
}

export interface ZoneSummary {
  storageLocationId: string;
  name: string;
  emoji: string;
  count: number;
  hasExpired: boolean;
  hasExpiring: boolean;
  hasOpened: boolean;
}

export interface CleaningTask {
  id: string;
  name: string;
  frequencyDays: number | null;
  lastCleanedDate: string | null;
  lastCleanedByUserId: string | null;
  daysSinceCleaned: number | null;
  overdue: boolean;
}

export interface CleaningTaskInput {
  name: string;
  frequencyDays?: number | null;
  lastCleanedDate?: string | null;
}

export interface WasteSchedule {
  id: string;
  type: WasteType;
  daysOfWeek: DayOfWeek[];
}

export interface ExpenseSplitInput {
  userId: string;
  percentage: number;
  paidAmount?: number;
}

export interface ExpenseSplit {
  userId: string;
  userName: string;
  percentage: number;
  amount: number;
  paidAmount: number;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  paidByUserId: string;
  paidByName: string;
  date: string;
  splits: ExpenseSplit[];
  createdAt: string;
}

export interface ExpenseInput {
  description: string;
  amount: number;
  paidByUserId: string;
  date: string;
  splits?: ExpenseSplitInput[];
}

export interface UserBalance {
  userId: string;
  userName: string;
  totalPaid: number;
  netBalance: number;
}

export interface ExpenseSummary {
  month: string;
  totalAmount: number;
  byUser: UserBalance[];
}

export interface SettlementAllocation {
  expenseId: string;
  expenseDescription: string;
  amountApplied: number;
  userId?: string;
  userName?: string;
}

export interface Settlement {
  id: string;
  debtorUserId: string;
  debtorName: string;
  amount: number;
  allocations: SettlementAllocation[];
  // Debiti nella direzione opposta (spese pagate dal debitore, quote altrui
  // non ancora saldate) compensati automaticamente da questo pagamento.
  nettedAllocations: SettlementAllocation[];
  leftover: number;
  date: string;
  createdAt: string;
}

export interface ApiErrorBody {
  timestamp: string;
  status: number;
  message: string;
  details?: string[] | null;
}
