/**
 * Authentication Api
 *
 * Responsibility: This file handles all auth api
 *
 * Author: Anik Dey
 */
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  AuthCredentials,
  AuthResponse,
  RegisterCredentials,
  User,
} from '../types/types';
import camelcaseKeys from 'camelcase-keys';

const BaseQuery = import.meta.env.VITE_BASE_URL;

const getDesktopApi = () =>
  typeof window !== 'undefined' && window.api?.isDesktop ? window.api : undefined;

const toIpcError = (error: unknown, fallbackMessage: string) => {
  const message = error instanceof Error ? error.message : fallbackMessage;

  return {
    status: 'CUSTOM_ERROR' as const,
    error: message,
    data: {
      message,
    },
  };
};

const toCamelCase = <T>(response: unknown): T => {
  if (typeof response === 'object' && response !== null) {
    return camelcaseKeys(response, { deep: true }) as T;
  }

  return response as T;
};

const persistAccessToken = (response: AuthResponse) => {
  if (response.accessToken) {
    localStorage.setItem('access_token', response.accessToken);
  }
};

const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({
    baseUrl: BaseQuery,
    credentials: 'include',
    prepareHeaders: headers => {
      headers.set('accept', 'application/json');
      const token = localStorage.getItem('access_token');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: build => ({
    /*---------------------
        Login Mutation
    -----------------------*/
    login: build.mutation<AuthResponse, AuthCredentials>({
      async queryFn(credentials, _api, _extraOptions, fetchWithBQ) {
        const desktopApi = getDesktopApi();

        if (desktopApi?.login) {
          try {
            const result = await desktopApi.login(credentials);
            console.log(result);
            if (!result.success) {
              return {
                error: toIpcError(
                  new Error(result.error?.message ?? 'Unable to sign in.'),
                  'Unable to sign in.'
                ),
              };
            }

            return {
              data: {
                user: result.user,
                license: result.license,
                message: result.message,
              },
            };
          } catch (error) {
            return {
              error: toIpcError(error, 'IPC login request failed.'),
            };
          }
        }

        const csrfResult = await fetchWithBQ('sanctum/csrf-cookie');
        if (csrfResult.error) {
          return { error: csrfResult.error };
        }

        const loginResult = await fetchWithBQ({
          url: 'api/login',
          method: 'POST',
          body: credentials,
        });

        if (loginResult.error) {
          return { error: loginResult.error };
        }

        const authResponse = toCamelCase<AuthResponse>(loginResult.data);
        const currentUserResult = await fetchWithBQ('api/me');

        if (currentUserResult.error) {
          return { error: currentUserResult.error };
        }

        const userResponse = toCamelCase<{ user?: AuthResponse['user'] }>(
          currentUserResult.data
        );

        return {
          data: {
            ...authResponse,
            user: userResponse.user ?? authResponse.user,
          },
        };
      },
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          persistAccessToken(data);
        } catch {
          // Error is exposed through RTK Query state.
        }
      },
    }),

    /*---------------------
        Register Mutation
    -----------------------*/
    register: build.mutation<AuthResponse, RegisterCredentials>({
      async queryFn(credentials, _api, _extraOptions, fetchWithBQ) {
        const desktopApi = getDesktopApi();

        if (desktopApi?.register) {
          try {
            const result = await desktopApi.register({
              name: credentials.name,
              email: credentials.email,
              password: credentials.password,
              passwordConfirmation: credentials.password_confirmation,
            });

            if (!result.success) {
              return {
                error: toIpcError(
                  new Error(result.error?.message ?? 'Unable to create your account.'),
                  'Unable to create your account.'
                ),
              };
            }

            return {
              data: {
                user: result.user,
                message: result.message,
              },
            };
          } catch (error) {
            return {
              error: toIpcError(error, 'IPC registration request failed.'),
            };
          }
        }

        const csrfResult = await fetchWithBQ('sanctum/csrf-cookie');
        if (csrfResult.error) {
          return { error: csrfResult.error };
        }

        const registerResult = await fetchWithBQ({
          url: 'api/register',
          method: 'POST',
          body: credentials,
        });

        if (registerResult.error) {
          return { error: registerResult.error };
        }

        return {
          data: toCamelCase<AuthResponse>(registerResult.data),
        };
      },
    }),
    /*-----------------------
        Logout Mutation
    -------------------------*/
    logout: build.mutation<{ success: boolean }, void>({
      async queryFn(_arg, _api, _extraOptions, fetchWithBQ) {
        const desktopApi = getDesktopApi();

        if (desktopApi?.logout) {
          try {
            const result = await desktopApi.logout();
            return { data: { success: !!result.success } };
          } catch (error) {
            return {
              error: toIpcError(error, 'IPC logout request failed.'),
            };
          }
        }

        const logoutResult = await fetchWithBQ({
          url: 'api/logout',
          method: 'POST',
        });

        if (logoutResult.error) {
          return { error: logoutResult.error };
        }

        return {
          data: {
            success: true,
          },
        };
      },
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          await queryFulfilled;
        } finally {
          localStorage.removeItem('access_token');
        }
      },
    }),
    /*-----------------------
        Fetch User Query
    ------------------------*/
    getUser: build.query<{ user: User }, void>({
      async queryFn(_arg, _api, _extraOptions, fetchWithBQ) {
        const desktopApi = getDesktopApi();

        if (desktopApi?.getSession) {
          try {
            const session = await desktopApi.getSession();

            if (!session?.user) {
              return {
                error: toIpcError(
                  new Error('User session is not available.'),
                  'User session is not available.'
                ),
              };
            }

            return {
              data: {
                user: session.user,
              },
            };
          } catch (error) {
            return {
              error: toIpcError(error, 'IPC session request failed.'),
            };
          }
        }

        const userResult = await fetchWithBQ('api/me');

        if (userResult.error) {
          return { error: userResult.error };
        }

        return {
          data: toCamelCase<{ user: User }>(userResult.data),
        };
      },
    }),

    /*-----------------------
        Forgot Password Mutation
    ------------------------*/
    requestPasswordReset: build.mutation<
      { message?: string },
      { email: string }
    >({
      query: body => ({
        url: '/api/forgot-password',
        method: 'POST',
        body,
      }),
    }),

    /*-----------------------
        Reset Password Mutation
    ------------------------*/
    resetPassword: build.mutation<
      { message: string },
      {
        email: string;
        token: string;
        password: string;
        password_confirmation: string;
      }
    >({
      query: body => ({
        url: '/api/reset-password',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useGetUserQuery,
  useRequestPasswordResetMutation,
  useResetPasswordMutation,
} = authApi;
export default authApi;
