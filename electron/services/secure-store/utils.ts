import { app, safeStorage } from 'electron';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  StoreState,
  PersistedStoreState,
  StoredSession,
  StoredUser,
  LicenseCache,
  LicenseStatus,
} from './types.js';
import { EMPTY_STORE_STATE } from './index.js';

export async function readStoreState(): Promise<StoreState> {
  try {
    const filePath = getStoreFilePath();
    const exists = await fs
      .access(filePath)
      .then(() => true)
      .catch(() => false);

    if (!exists) {
      return EMPTY_STORE_STATE;
    }

    const serializedState = await fs.readFile(getStoreFilePath(), 'utf-8');

    const persistedState = JSON.parse(serializedState) as PersistedStoreState;
    if (!persistedState.payload) {
      return EMPTY_STORE_STATE;
    }

    const payload = persistedState.encrypted
      ? decryptPayload(persistedState.payload)
      : persistedState.payload;

    if (!payload) {
      return EMPTY_STORE_STATE;
    }

    return normalizeStoreState(JSON.parse(payload));
  } catch (error) {
    if (isFileMissingError(error)) {
      return EMPTY_STORE_STATE;
    }

    return EMPTY_STORE_STATE;
  }
}

export async function writeStoreState(state: StoreState): Promise<void> {
  const encrypted = safeStorage.isEncryptionAvailable();
  const payload = JSON.stringify(state);
  const persistedState: PersistedStoreState = {
    version: 1,
    encrypted,
    payload: encrypted
      ? safeStorage.encryptString(payload).toString('base64')
      : payload,
  };

  await fs.mkdir(getStoreDirectoryPath(), { recursive: true });
  await fs.writeFile(
    getStoreFilePath(),
    JSON.stringify(persistedState),
    'utf-8'
  );
}

export function normalizeStoreState(value: unknown): StoreState {
  if (!isRecord(value)) {
    return EMPTY_STORE_STATE;
  }

  return {
    session: normalizeSession(value.session),
    license: normalizeLicense(value.license),
  };
}

export function normalizeSession(value: unknown): StoredSession | null {
  if (!isRecord(value)) {
    return null;
  }

  const accessToken = readString(value.accessToken);
  if (!accessToken) {
    return null;
  }

  const user = normalizeUser(value.user);
  if (!user) {
    return null;
  }

  return {
    accessToken,
    user,
  };
}

export function normalizeUser(value: unknown): StoredUser | null {
  if (!isRecord(value)) {
    return null;
  }

  const name = readString(value.name);
  const email = readString(value.email);
  const id = readIdentifier(value.id);

  if (!name || !email || id === null) {
    return null;
  }

  return { id, name, email };
}

export function normalizeLicense(value: unknown): LicenseCache | null {
  if (!isRecord(value)) {
    return null;
  }

  const status = normalizeLicenseStatus(value.status);
  if (!status) {
    return null;
  }

  const lastChecked = readNumber(value.lastChecked);
  if (lastChecked === null) {
    return null;
  }

  const daysLeft = readNumber(value.daysLeft);
  const expiresAt = readString(value.expiresAt) ?? undefined;

  return {
    status,
    lastChecked,
    daysLeft: daysLeft ?? undefined,
    expiresAt,
  };
}

export function normalizeLicenseStatus(value: unknown): LicenseStatus | null {
  switch (value) {
    case 'trialing':
    case 'active':
    case 'expired':
    case 'cancelled':
    case 'none':
    case 'offline_grace':
      return value;
    default:
      return null;
  }
}

export function decryptPayload(value: string): string | null {
  if (!safeStorage.isEncryptionAvailable()) {
    return null;
  }

  try {
    return safeStorage.decryptString(Buffer.from(value, 'base64'));
  } catch {
    return null;
  }
}

export function getStoreDirectoryPath(): string {
  if (process.platform === 'linux') {
    return path.join(os.homedir(), '.local', 'share', 'case-builder');
  }

  return path.join(app.getPath('userData'), 'case-builder');
}

export function getStoreFilePath(): string {
  return path.join(getStoreDirectoryPath(), 'auth.json');
}

export function isFileMissingError(
  error: unknown
): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT';
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

export function readNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function readIdentifier(value: unknown): string | number | null {
  if (typeof value === 'string' && value.trim()) {
    return value;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  return null;
}
