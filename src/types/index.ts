export type StorageZone = 'FRIGO' | 'FREEZER' | 'DISPENSA' | 'SGABUZZINO';

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
  | 'ALTRO';

export type Unit = 'PZ' | 'KG' | 'G' | 'L' | 'ML' | 'CONF';

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

export interface Item {
  id: string;
  name: string;
  zone: StorageZone;
  category: Category;
  quantity: number;
  unit: Unit;
  expirationDate: string | null;
  daysUntilExpiration: number | null;
  addedByUserId: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface ItemInput {
  name: string;
  zone: StorageZone;
  category: Category;
  quantity: number;
  unit: Unit;
  expirationDate: string | null;
}

export interface AdjustQuantityInput {
  delta: number;
  expirationDate?: string | null;
  clearExpirationDate?: boolean;
}

export interface ShoppingNote {
  id: string;
  text: string;
  addedByUserId: string;
  createdAt: string;
}

export interface ZoneSummary {
  zone: StorageZone;
  count: number;
  hasExpired: boolean;
  hasExpiring: boolean;
}

export interface ApiErrorBody {
  timestamp: string;
  status: number;
  message: string;
  details?: string[] | null;
}
