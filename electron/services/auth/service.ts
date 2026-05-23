import {
  authApiRoutes,
  getServiceErrorMessage,
  isNetworkError,
  requestApi,
} from '../authApiClient.js';
import { licenseService } from '../licenseService.js';
import { secureStore, type StoredUser } from '../secureStore.js';
import {
  extractAccessToken,
  extractLicenseFromResponse,
  extractMessage,
  extractUser,
} from './response.js';
import type { AuthResult, LoginInput, RegisterInput } from './types.js';

const CURRENT_USER_ROUTE = '/api/me';

export const authService = {
  async getSession(): Promise<{ user: StoredUser } | null> {
    const storedSession = await secureStore.getSession();
    if (!storedSession) {
      return null;
    }

    try {
      const currentUser =
        (await getCurrentUser(storedSession.accessToken)) ?? storedSession.user;

      if (!isSameUser(storedSession.user, currentUser)) {
        await secureStore.setSession({
          ...storedSession,
          user: currentUser,
        });
      }

      return { user: currentUser };
    } catch (error) {
      if (isNetworkError(error)) {
        return { user: storedSession.user };
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

      const accessToken = extractAccessToken(response);
      if (!accessToken) {
        throw new Error('Login response did not include an access token.');
      }

      const user = extractUser(response) ?? (await getCurrentUser(accessToken));
      if (!user) {
        throw new Error('Login response did not include a valid user profile.');
      }

      const session = {
        accessToken,
        user,
      };
      // Persist the desktop token and profile so the session can be restored.
      await secureStore.setSession(session);

      const license =
        extractLicenseFromResponse(response) ??
        (await licenseService.checkLicense());

      if (license) {
        await secureStore.setLicenseCache({
          status: license.status,
          expiresAt: license.expiresAt,
          daysLeft: license.daysLeft,
        });
      }

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
        });
      } catch {
        // Ignore logout transport errors because local sign-out must still work.
      }
    }

    await secureStore.clear();

    return { success: true };
  },
};

async function getCurrentUser(accessToken: string): Promise<StoredUser | null> {
  const response = await requestApi<unknown>(CURRENT_USER_ROUTE, {
    accessToken,
  });

  return extractUser(response);
}

function isSameUser(left: StoredUser, right: StoredUser): boolean {
  return (
    left.id === right.id &&
    left.name === right.name &&
    left.email === right.email
  );
}
