import type { LicenseCache, StoredUser } from '../secure-store/types.js';

export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
  passwordConfirmation?: string;
};

export type AuthResult = {
  success: boolean;
  user?: StoredUser;
  license?: LicenseCache;
  message?: string;
  error?: string;
};
