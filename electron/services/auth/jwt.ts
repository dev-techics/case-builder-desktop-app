import type { StoredUser } from '../secureStore.js';
import { readIdentifier, readNumber, readString } from './readers.js';

const TOKEN_EXPIRY_BUFFER_MS = 30_000;
const JWT_SEGMENT_COUNT = 3;

export function getUserFromToken(token: string): StoredUser | null {
  if (!looksLikeJwt(token)) {
    return null;
  }

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

export function isTokenExpired(token: string): boolean {
  if (!looksLikeJwt(token)) {
    return false;
  }

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

function looksLikeJwt(token: string): boolean {
  return token.split('.').length === JWT_SEGMENT_COUNT;
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
