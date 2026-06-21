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

// api version 1 response 
export type AuthResult = {
  success: boolean;
  user?: StoredUser;
  license?: LicenseCache;
  message?: string;
  error?: string;
};


/**---------------------
 * Api V2 response shape
 -----------------------*/
type LoginErrorResponse = {
  code: string;
  message: string;
  details: {} | null;
};
type LoginSuccessResponse = {
  user: {
    id: number;
    name: string;
    email: string;
  };
  access_token: string;
  token_type: string;
  license: {
    status: string;
    days_left: number;
    expires_at: string;
  };
};
export type LoginResponse = {
  success: boolean;
  error?: LoginErrorResponse;
  data?: LoginSuccessResponse;
  message: string;
};
