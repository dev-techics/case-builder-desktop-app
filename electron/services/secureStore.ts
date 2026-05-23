import { app, safeStorage } from 'electron';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

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
  expiresAt?: string;
  lastChecked: number;
}

interface StoreState {
  session: StoredSession | null;
  license: LicenseCache | null;
}

interface PersistedStoreState {
  version: 1;
  encrypted: boolean;
  payload: string;
}

const EMPTY_STORE_STATE: StoreState = {
  session: null,
  license: null,
};

export const secureStore = {
  async setSession(session: StoredSession) {
    const state = await readStoreState();
    await writeStoreState({
      ...state,
      session,
    });
  },

  async getSession(): Promise<StoredSession | null> {
    const state = await readStoreState();
    return state.session;
  },

  async getAccessToken(): Promise<string | null> {
    const session = await this.getSession();
    return session?.accessToken ?? null;
  },

  async setLicenseCache(license: Omit<LicenseCache, 'lastChecked'>) {
    const state = await readStoreState();
    await writeStoreState({
      ...state,
      license: {
        ...license,
        lastChecked: Date.now(),
      },
    });
  },

  async getLicenseCache(): Promise<LicenseCache | null> {
    const state = await readStoreState();
    return state.license;
  },

  async clear() {
    await writeStoreState(EMPTY_STORE_STATE);
  },
};

async function readStoreState(): Promise<StoreState> {
  try {
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

async function writeStoreState(state: StoreState): Promise<void> {
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

function normalizeStoreState(value: unknown): StoreState {
  if (!isRecord(value)) {
    return EMPTY_STORE_STATE;
  }

  return {
    session: normalizeSession(value.session),
    license: normalizeLicense(value.license),
  };
}

function normalizeSession(value: unknown): StoredSession | null {
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

function normalizeUser(value: unknown): StoredUser | null {
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

function normalizeLicense(value: unknown): LicenseCache | null {
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

function normalizeLicenseStatus(value: unknown): LicenseStatus | null {
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

function decryptPayload(value: string): string | null {
  if (!safeStorage.isEncryptionAvailable()) {
    return null;
  }

  try {
    return safeStorage.decryptString(Buffer.from(value, 'base64'));
  } catch {
    return null;
  }
}

function getStoreDirectoryPath(): string {
  if (process.platform === 'linux') {
    return path.join(os.homedir(), '.local', 'share', 'case-builder');
  }

  return path.join(app.getPath('userData'), 'case-builder');
}

function getStoreFilePath(): string {
  return path.join(getStoreDirectoryPath(), 'auth.json');
}

function isFileMissingError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT';
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

function readIdentifier(value: unknown): string | number | null {
  if (typeof value === 'string' && value.trim()) {
    return value;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  return null;
}
