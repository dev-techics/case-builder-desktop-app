// const DEFAULT_API_BASE_URL = 'https://verify.techics.com';
const DEFAULT_API_BASE_URL = 'http://127.0.0.1:8000';

const API_BASE_URL = stripTrailingSlash(
  process.env.CASE_BUILDER_API_URL ??
    process.env.API_URL ??
    DEFAULT_API_BASE_URL
);

export const authApiRoutes = {
  login: '/api/login',
  register: '/api/register',
  logout: '/api/logout',
  license: '/api/license/validate',
  startTrial: '/api/license/start-trial',
  checkout: '/api/subscription/checkout',
} as const;

type RequestApiOptions = {
  method?: 'GET' | 'POST';
  body?: unknown;
  accessToken?: string;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function requestApi<T>(
  route: string,
  options: RequestApiOptions = {}
): Promise<T> {
  const headers = new Headers({
    Accept: 'application/json',
  });

  if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  if (options.accessToken) {
    headers.set('Authorization', `Bearer ${options.accessToken}`);
  }

  const response = await fetch(`${API_BASE_URL}${route}`, {
    method: options.method ?? (options.body === undefined ? 'GET' : 'POST'),
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const rawBody = await response.text();
  const parsedBody = parseResponseBody(rawBody);

  if (!response.ok) {
    throw new ApiError(
      extractErrorMessage(parsedBody, response.statusText),
      response.status,
      parsedBody
    );
  }

  return parsedBody as T;
}

export function getServiceErrorMessage(
  error: unknown,
  fallbackMessage: string
): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallbackMessage;
}

export function isNetworkError(error: unknown): boolean {
  return error instanceof Error && !(error instanceof ApiError);
}

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

function parseResponseBody(body: string): unknown {
  if (!body.trim()) {
    return {};
  }

  try {
    return JSON.parse(body);
  } catch {
    return { message: body };
  }
}

function extractErrorMessage(data: unknown, fallback: string): string {
  if (typeof data === 'string' && data.trim()) {
    return data;
  }

  if (!isRecord(data)) {
    return fallback || 'Request failed.';
  }

  const message =
    readString(data.message) ??
    readString(data.error) ??
    readValidationError(data.errors);

  return message ?? fallback ?? 'Request failed.';
}

function readValidationError(value: unknown): string | null {
  if (!isRecord(value)) {
    return null;
  }

  for (const entry of Object.values(value)) {
    if (Array.isArray(entry)) {
      const firstError = entry.find(item => typeof item === 'string');
      if (typeof firstError === 'string') {
        return firstError;
      }
    }
  }

  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}
