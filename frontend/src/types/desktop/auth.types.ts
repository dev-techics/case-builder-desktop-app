// frontend/src/types/desktop/auth.types.ts

import type { LicenseCache } from './license.types';

export type DesktopAuthUser = {
  id: string | number;
  name: string;
  email: string;
};

export type DesktopAuthSession = {
  user: DesktopAuthUser;
  license?: LicenseCache;
} | null;

export type DesktopAuthResult = {
  success: boolean;
  user?: DesktopAuthUser;
  license?: LicenseCache;
  message?: string;
  error?: {
    code: string;
    message: string;
    details: Record<string, any>;
  };
};

export type DesktopLoginInput = {
  email: string;
  password: string;
};

export type DesktopRegisterInput = {
  name: string;
  email: string;
  password: string;
  passwordConfirmation?: string;
};