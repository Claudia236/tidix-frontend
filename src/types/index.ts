export type Category =
  | 'LATTICINI'
  | 'CARNE'
  | 'FRUTTA_VERDURA'
  | 'CEREALI'
  | 'CONSERVE'
  | 'CONDIMENTI'
  | 'BEVANDE'
  | 'PIATTI_PRONTI'
  | 'DOLCI'
  | 'PULIZIA'
  | 'BUCATO'
  | 'IGIENE'
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
}

export interface StorageLocation {
  id: string;
  name: string;
  emoji: string;
}

export interface StorageLocationInput {
  name: string;
  emoji?: string;
}

export interface Item {
  id: string;
  name: string;
  storageLocationId: string;
  category: Category;
  quantity: number;
  unit: Unit;
  expirationDate: string | null;
  daysUntilExpiration: number | null;
  purchaseDate: string | null;
  addedByUserId: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface ItemInput {
  name: string;
  storageLocationId: string;
  category: Category;
  quantity: number;
  unit: Unit;
  expirationDate: string | null;
  purchaseDate?: string | null;
}

export interface AdjustQuantityInput {
  delta: number;
  expirationDate?: string | null;
  clearExpirationDate?: boolean;
  hideFromShoppingList?: boolean;
}

export interface ShoppingNote {
  id: string;
  text: string;
  category: Category | null;
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

export interface ApiErrorBody {
  timestamp: string;
  status: number;
  message: string;
  details?: string[] | null;
}
