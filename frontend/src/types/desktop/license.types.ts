// frontend/src/types/desktop/license.types.ts

export type LicenseStatus =
  | 'trialing'
  | 'active'
  | 'expired'
  | 'cancelled'
  | 'none'
  | 'offline_grace';

export interface LicenseCache {
  status: LicenseStatus;
  daysLeft?: number;
  expiresAt?: string;
  lastChecked: number;
}