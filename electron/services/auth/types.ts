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


/**-----------------------------
 * Api V2 Login response shapes
 -------------------------------*/
type LoginErrorResponse = {
  code: string;
  message: string;
  details: {} | null;
};
type LoginSuccessResponse = {
  user: User;
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

/*----------------------------
  Registration response shapes
------------------------------*/
type User = {
  id: number;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
};

export type RegisterResponse = {
  success: boolean;
  data?: {
    user: User;
    access_token: string;
    token_type: string;
  };
  error?:{
    code: string;
    message: string;
    details: Record<string, any> | null;
  }
  message: string;
};