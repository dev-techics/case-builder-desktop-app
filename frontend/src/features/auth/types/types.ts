import type { LicenseCache } from '@/types';

export interface User {
  id: string | number;
  name: string;
  email: string;
}

export interface AuthState {
  user: User | null;
  license: LicenseCache | null;
  isInitialized: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface AuthResponse {
  user?: User;
  message?: string;
  accessToken?: string;
  tokenType?: string;
  license?: LicenseCache;
}

export interface ErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
}
