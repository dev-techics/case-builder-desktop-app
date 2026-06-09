export type LicenseStatus =
  | 'trialing'
  | 'active'
  | 'expired'
  | 'cancelled'
  | 'none'
  | 'offline_grace';

export interface StoredUser {
  id: string | number;
  name: string;
  email: string;
}

export interface StoredSession {
  accessToken: string;
  user: StoredUser;
}

export interface LicenseCache {
  status: LicenseStatus;
  daysLeft?: number;
  days_left?: number;
  expiresAt?: string;
  expires_at?: string;
  lastChecked: number;
}

export interface StoreState {
  session: StoredSession | null;
  license: LicenseCache | null;
}

export interface PersistedStoreState {
  version: 1;
  encrypted: boolean;
  payload: string;
}
