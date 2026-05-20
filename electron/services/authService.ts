import {
  authApiRoutes,
  getServiceErrorMessage,
  isNetworkError,
  requestApi,
} from './authApiClient.js';
import { licenseService } from './licenseService.js';
import {
  secureStore,
  type LicenseCache,
  type StoredSession,
  type StoredUser,
} from './secureStore.js';

const TOKEN_EXPIRY_BUFFER_MS = 30_000;

type LoginInput = {
  email: string;
  password: string;
};

type RegisterInput = {
  name: string;
  email: string;
  password: string;
  passwordConfirmation?: string;
};

type AuthResult = {
  success: boolean;
  user?: StoredUser;
  license?: LicenseCache;
  message?: string;
  error?: string;
};

export const authService = {
  async getSession(): Promise<{ user: StoredUser } | null> {
    const storedSession = await secureStore.getSession();
    if (!storedSession) {
      return null;
    }

    const sessionUser =
      storedSession.user ?? getUserFromToken(storedSession.accessToken);
    if (!sessionUser) {
      await secureStore.clear();
      return null;
    }

    if (!isTokenExpired(storedSession.accessToken)) {
      if (storedSession.user !== sessionUser) {
        await secureStore.setSession({
          ...storedSession,
          user: sessionUser,
        });
      }

      return { user: sessionUser };
    }

    if (!storedSession.refreshToken) {
      return { user: sessionUser };
    }

    try {
      const refreshedSession = await refreshSession(storedSession);
      await secureStore.setSession(refreshedSession);
      return { user: refreshedSession.user };
    } catch (error) {
      if (isNetworkError(error)) {
        return { user: sessionUser };
      }

      await secureStore.clear();
      return null;
    }
  },

  async login(input: LoginInput): Promise<AuthResult> {
    try {
      const response = await requestApi<unknown>(authApiRoutes.login, {
        method: 'POST',
        body: input,
      });

      const session = normalizeSessionResponse(response);
      await secureStore.setSession(session);

      const license =
        extractLicenseFromResponse(response) ?? (await licenseService.checkLicense());

      return {
        success: true,
        user: session.user,
        license,
        message: extractMessage(response) ?? undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: getServiceErrorMessage(error, 'Unable to sign in.'),
      };
    }
  },

  async register(input: RegisterInput): Promise<AuthResult> {
    try {
      const response = await requestApi<unknown>(authApiRoutes.register, {
        method: 'POST',
        body: {
          name: input.name,
          email: input.email,
          password: input.password,
          password_confirmation: input.passwordConfirmation ?? input.password,
        },
      });

      return {
        success: true,
        user: extractUser(response) ?? undefined,
        message:
          extractMessage(response) ??
          'Account created successfully. Please sign in.',
      };
    } catch (error) {
      return {
        success: false,
        error: getServiceErrorMessage(error, 'Unable to create your account.'),
      };
    }
  },

  async logout(): Promise<{ success: true }> {
    const session = await secureStore.getSession();

    if (session) {
      try {
        await requestApi(authApiRoutes.logout, {
          method: 'POST',
          accessToken: session.accessToken,
          body: {
            refreshToken: session.refreshToken,
          },
        });
      } catch {
        // Ignore logout transport errors because local sign-out must still work.
      }
    }

    await secureStore.clear();

    return { success: true };
  },
};

async function refreshSession(session: StoredSession): Promise<StoredSession> {
  const response = await requestApi<unknown>(authApiRoutes.refresh, {
    method: 'POST',
    body: {
      refreshToken: session.refreshToken,
    },
  });

  const record = getPrimaryRecord(response);
  const nextAccessToken =
    readString(record.accessToken) ??
    readString(record.access_token) ??
    readNestedToken(record, 'accessToken') ??
    readNestedToken(record, 'access_token');

  if (!nextAccessToken) {
    throw new Error('Refresh endpoint did not return a new access token.');
  }

  return {
    accessToken: nextAccessToken,
    refreshToken:
      readString(record.refreshToken) ??
      readString(record.refresh_token) ??
      readNestedToken(record, 'refreshToken') ??
      readNestedToken(record, 'refresh_token') ??
      session.refreshToken,
    user: extractUser(response) ?? getUserFromToken(nextAccessToken) ?? session.user,
  };
}

function normalizeSessionResponse(value: unknown): StoredSession {
  const record = getPrimaryRecord(value);
  const accessToken =
    readString(record.accessToken) ??
    readString(record.access_token) ??
    readNestedToken(record, 'accessToken') ??
    readNestedToken(record, 'access_token');
  const refreshToken =
    readString(record.refreshToken) ??
    readString(record.refresh_token) ??
    readNestedToken(record, 'refreshToken') ??
    readNestedToken(record, 'refresh_token');

  if (!accessToken) {
    throw new Error('Login response did not include an access token.');
  }

  const user = extractUser(value) ?? getUserFromToken(accessToken);
  if (!user) {
    throw new Error('Login response did not include a valid user profile.');
  }

  return {
    accessToken,
    refreshToken: refreshToken ?? undefined,
    user,
  };
}

function extractLicenseFromResponse(value: unknown): LicenseCache | null {
  const record = getPrimaryRecord(value);
  const source = isRecord(record.license)
    ? record.license
    : isRecord(record.subscription)
      ? record.subscription
      : null;

  if (!source) {
    return null;
  }

  const status = normalizeLicenseStatus(
    source.status ??
      source.licenseStatus ??
      source.license_status ??
      source.subscriptionStatus ??
      source.subscription_status
  );

  const expiresAt =
    readString(source.expiresAt) ??
    readString(source.expires_at) ??
    readString(source.trialEndsAt) ??
    readString(source.trial_ends_at);
  const daysLeft =
    readNumber(source.daysLeft) ??
    readNumber(source.days_left) ??
    calculateDaysLeft(expiresAt);

  return {
    status,
    expiresAt: expiresAt ?? undefined,
    daysLeft: daysLeft ?? undefined,
    lastChecked: Date.now(),
  };
}

function extractUser(value: unknown): StoredUser | null {
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

function extractMessage(value: unknown): string | null {
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
    'refreshToken' in value ||
    'refresh_token' in value ||
    'tokens' in value ||
    'user' in value ||
    'profile' in value
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

function getUserFromToken(token: string): StoredUser | null {
  const payload = decodeJwtPayload(token);
  if (!payload) {
    return null;
  }

  const name = readString(payload.name);
  const email = readString(payload.email);
  const id = readIdentifier(
    payload.sub ?? payload.id ?? payload.userId ?? payload.user_id
  );

  if (!name || !email || id === null) {
    return null;
  }

  return {
    id,
    name,
    email,
  };
}

function isTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload) {
    return false;
  }

  const expiresAt = readNumber(payload.exp);
  if (expiresAt === null) {
    return false;
  }

  return expiresAt * 1000 <= Date.now() + TOKEN_EXPIRY_BUFFER_MS;
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const [, payload] = token.split('.');
  if (!payload) {
    return null;
  }

  try {
    const normalizedPayload = payload
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(payload.length / 4) * 4, '=');

    return JSON.parse(
      Buffer.from(normalizedPayload, 'base64').toString('utf-8')
    ) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function normalizeLicenseStatus(value: unknown): LicenseCache['status'] {
  switch (value) {
    case 'active':
    case 'trialing':
    case 'expired':
    case 'cancelled':
    case 'none':
      return value;
    default:
      return 'none';
  }
}

function calculateDaysLeft(expiresAt?: string | null): number | undefined {
  if (!expiresAt) {
    return undefined;
  }

  const expiresAtMs = Date.parse(expiresAt);
  if (Number.isNaN(expiresAtMs)) {
    return undefined;
  }

  return Math.max(
    0,
    Math.ceil((expiresAtMs - Date.now()) / (24 * 60 * 60 * 1000))
  );
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
