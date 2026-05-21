import { authApiRoutes, requestApi } from '../authApiClient.js';
import type { StoredSession } from '../secureStore.js';
import { getUserFromToken } from './jwt.js';
import { extractAuthTokens, extractUser } from './response.js';

export async function refreshSession(
  session: StoredSession
): Promise<StoredSession> {
  const response = await requestApi<unknown>(authApiRoutes.refresh, {
    method: 'POST',
    body: {
      refreshToken: session.refreshToken,
    },
  });

  const tokens = extractAuthTokens(response);
  if (!tokens) {
    throw new Error('Refresh endpoint did not return a new access token.');
  }

  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken ?? session.refreshToken,
    user:
      extractUser(response) ??
      getUserFromToken(tokens.accessToken) ??
      session.user,
  };
}
