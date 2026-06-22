import type { LicenseCache } from '../secure-store/types.js';
import { extractNormalizedLicense } from '../license/licenseResponse.js';
import { isRecord, readString } from './readers.js';

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
