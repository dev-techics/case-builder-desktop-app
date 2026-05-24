import type { LicenseCache, StoredUser } from '../secure-store/types.js';
import { extractNormalizedLicense } from '../licenseResponse.js';
import { isRecord, readIdentifier, readString } from './readers.js';

export function extractAccessToken(value: unknown): string | null {
  const record = getPrimaryRecord(value);
  const accessToken = readToken(record, 'accessToken', 'access_token');

  return accessToken ?? null;
}

export function extractLicenseFromResponse(
  value: unknown
): LicenseCache | null {
  const normalizedLicense = extractNormalizedLicense(value);
  if (!normalizedLicense) {
    return null;
  }

  return {
    ...normalizedLicense,
    lastChecked: Date.now(),
  };
}

export function extractUser(value: unknown): StoredUser | null {
  const record = getPrimaryRecord(value);
  const source = isRecord(record.user)
    ? record.user
    : isRecord(record.profile)
      ? record.profile
      : null;

  if (!source) {
    return null;
  }

  const name = readString(source.name);
  const email = readString(source.email);
  const id = readIdentifier(source.id ?? source.userId ?? source.user_id);

  if (!name || !email || id === null) {
    return null;
  }

  return {
    id,
    name,
    email,
  };
}

export function extractMessage(value: unknown): string | null {
  const record = getPrimaryRecord(value);
  return readString(record.message);
}

function getPrimaryRecord(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) {
    return {};
  }

  if (hasAuthPayload(value)) {
    return value;
  }

  if (isRecord(value.data)) {
    return value.data;
  }

  return value;
}

function hasAuthPayload(value: Record<string, unknown>): boolean {
  return (
    'accessToken' in value ||
    'access_token' in value ||
    'tokens' in value ||
    'user' in value ||
    'profile' in value
  );
}

function readToken(
  record: Record<string, unknown>,
  directKey: string,
  legacyKey: string
): string | null {
  return (
    readString(record[directKey]) ??
    readString(record[legacyKey]) ??
    readNestedToken(record, directKey) ??
    readNestedToken(record, legacyKey)
  );
}

function readNestedToken(
  record: Record<string, unknown>,
  key: string
): string | null {
  if (!isRecord(record.tokens)) {
    return null;
  }

  return readString(record.tokens[key]);
}
