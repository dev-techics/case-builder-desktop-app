import type { LicenseCache, LicenseStatus } from './secure-store/types.js';

type NormalizedLicense = Omit<LicenseCache, 'lastChecked'>;

const STATUS_KEYS = [
  'status',
  'licenseStatus',
  'license_status',
  'subscriptionStatus',
  'subscription_status',
  'stripeStatus',
  'stripe_status',
] as const;

const EXPIRY_KEYS = [
  'expiresAt',
  'expires_at',
  'trialEndsAt',
  'trial_ends_at',
  'endsAt',
  'ends_at',
  'currentPeriodEnd',
  'current_period_end',
  'currentPeriodEndsAt',
  'current_period_ends_at',
] as const;

const TRIAL_EXPIRY_KEYS = ['trialEndsAt', 'trial_ends_at'] as const;

const NESTED_SOURCE_KEYS = [
  'license',
  'subscription',
  'currentSubscription',
  'current_subscription',
  'user',
  'profile',
] as const;

export function extractNormalizedLicense(
  value: unknown
): NormalizedLicense | null {
  const record = getPrimaryRecord(value);
  const source = findLicenseSource(record);
  if (!source) {
    return null;
  }

  const status = readLicenseStatus(source);
  const expiresAt = readFirstString(source, EXPIRY_KEYS);
  const daysLeft =
    readNumber(source.daysLeft) ??
    readNumber(source.days_left) ??
    calculateDaysLeft(expiresAt);

  if (!status && !expiresAt && daysLeft === null) {
    return null;
  }

  return {
    status: status ?? 'none',
    expiresAt: expiresAt ?? undefined,
    daysLeft: daysLeft ?? undefined,
  };
}

function getPrimaryRecord(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) {
    return {};
  }

  if (isRecord(value.data)) {
    return value.data;
  }

  return value;
}

function findLicenseSource(
  record: Record<string, unknown>
): Record<string, unknown> | null {
  const candidates = NESTED_SOURCE_KEYS.map(key => record[key]).filter(
    isRecord
  );

  for (const candidate of [...candidates, record]) {
    if (hasLicenseFields(candidate)) {
      return candidate;
    }
  }

  return null;
}

function hasLicenseFields(value: Record<string, unknown>): boolean {
  return (
    STATUS_KEYS.some(key => key in value) ||
    EXPIRY_KEYS.some(key => key in value) ||
    'daysLeft' in value ||
    'days_left' in value
  );
}

function readLicenseStatus(
  value: Record<string, unknown>
): LicenseStatus | null {
  const status = normalizeLicenseStatus(readFirstString(value, STATUS_KEYS));
  if (status) {
    return status;
  }

  const trialExpiresAt = readFirstString(value, TRIAL_EXPIRY_KEYS);
  if (trialExpiresAt && isFutureDate(trialExpiresAt)) {
    return 'trialing';
  }

  return null;
}

function readFirstString(
  record: Record<string, unknown>,
  keys: readonly string[]
): string | null {
  for (const key of keys) {
    const value = readString(record[key]);
    if (value) {
      return value;
    }
  }

  return null;
}

function normalizeLicenseStatus(value: string | null): LicenseStatus | null {
  switch (value?.toLowerCase()) {
    case 'active':
    case 'trialing':
    case 'expired':
    case 'cancelled':
    case 'none':
    case 'offline_grace':
      return value.toLowerCase() as LicenseStatus;
    case 'canceled':
      return 'cancelled';
    default:
      return null;
  }
}

function calculateDaysLeft(expiresAt?: string | null): number | null {
  if (!expiresAt) {
    return null;
  }

  const expiresAtMs = Date.parse(expiresAt);
  if (Number.isNaN(expiresAtMs)) {
    return null;
  }

  return Math.max(
    0,
    Math.ceil((expiresAtMs - Date.now()) / (24 * 60 * 60 * 1000))
  );
}

function isFutureDate(value: string): boolean {
  const time = Date.parse(value);
  return !Number.isNaN(time) && time > Date.now();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

function readNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}
