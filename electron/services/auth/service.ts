import {
  ApiError,
  authApiRoutes,
  getServiceErrorMessage,
  isNetworkError,
  requestApi,
} from '../authApiClient.js';
import { licenseService } from '../license/licenseService.js';
import { secureStore } from '../secure-store/index.js';
import { type StoredUser } from '../secure-store/types.js';
import { isRecord } from './readers.js';
import { extractLicenseFromResponse, extractMessage } from './response.js';
import type {
  AuthResult,
  LoginInput,
  LoginResponse,
  RegisterInput,
  RegisterResponse,
} from './types.js';

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
      const response = await requestApi<LoginResponse>(authApiRoutes.login, {
        method: 'POST',
        body: input,
      });

      const accessToken = response.data?.access_token;

      if (!accessToken) {
        throw new Error('Login response did not include an access token.');
      }

      const user = response.data?.user;

      if (!user) {
        throw new Error('Login response did not include a valid user profile.');
      }

      const session = {
        accessToken,
        user,
      };
      // Persist the desktop token and profile so the session can be restored.
      await secureStore.setSession(session);

      const licenseFromLoginResponse = extractLicenseFromResponse(response);

      const license =
        extractLicenseFromResponse(response) ??
        (await licenseService.checkLicense());

      const newLicense = response.data?.license;
      console.log(license);
      console.log(newLicense);

      if (licenseFromLoginResponse) {
        await secureStore.setLicenseCache({
          status: licenseFromLoginResponse.status,
          expiresAt: licenseFromLoginResponse.expiresAt,
          daysLeft: licenseFromLoginResponse.daysLeft,
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

  /**
   * Registers a new user account through the authentication API.
   *
   * Sends the user's registration details to the backend and returns the
   * standardized registration response. If the API returns a structured
   * error response, it is passed through unchanged. Unexpected errors
   * (network issues, malformed responses, etc.) are converted into a
   * fallback error response.
   *
   * @param input - User registration information.
   * @param input.name - The user's full name.
   * @param input.email - The user's email address.
   * @param input.password - The user's password.
   * @param input.passwordConfirmation - Optional password confirmation. If omitted, the password value is used.
   *
   * @returns A promise that resolves to a {@link RegisterResponse}
   * containing either the registration result or error details.
   */
  async register(input: RegisterInput): Promise<RegisterResponse> {
    try {
      const response = await requestApi<RegisterResponse>(
        authApiRoutes.register,
        {
          method: 'POST',
          body: {
            name: input.name,
            email: input.email,
            password: input.password,
            password_confirmation: input.passwordConfirmation ?? input.password,
          },
        }
      );
      console.log(response);
      return response;
    } catch (error: any) {
      if (
        error instanceof ApiError &&
        isRecord(error.data) &&
        isRecord(error.data.error)
      ) {
        // Server already sent our exact shape — no need to rebuild it.
        return error.data as RegisterResponse;
      }

      // Fallback: server sent something else entirely (raw Laravel errors, HTML, network failure, etc.)
      return {
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: getServiceErrorMessage(error, 'Unable to register.'),
          details: null,
        },
        message: 'Registration failed',
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
  const response = await requestApi<StoredUser>(CURRENT_USER_ROUTE, {
    accessToken,
  });

  return response;
}

function isSameUser(left: StoredUser, right: StoredUser): boolean {
  return (
    left.id === right.id &&
    left.name === right.name &&
    left.email === right.email
  );
}
