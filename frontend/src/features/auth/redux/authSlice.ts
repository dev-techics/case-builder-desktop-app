import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/app/store';
import type { AuthState, User } from '../types/types';
import type { LicenseCache } from '@/types/window-api';

const initialState: AuthState = {
  user: null,
  license: null,
  isInitialized: false,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setLicense(state, action: PayloadAction<LicenseCache | null>) {
      state.license = action.payload;
    },
    setInitialized(state) {
      state.isInitialized = true;
    },
    clearError(state) {
      state.error = null;
    },
    setUser(state, action: PayloadAction<User | null>) {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
    },
    clearAuth(state) {
      state.user = null;
      state.license = null;
      state.isInitialized = true;
      state.isAuthenticated = false;
      state.error = null;
      state.isLoading = false;
    },
  },
});

export const { clearError, setUser, setLicense, setInitialized, clearAuth } =
  authSlice.actions;

export const selectUser = (state: RootState) => state.auth.user;
export const selectLicense = (state: RootState) => state.auth.license;
export const selectIsInitialized = (state: RootState) =>
  state.auth.isInitialized;
export const selectIsAuthenticated = (state: RootState) =>
  state.auth.isAuthenticated;

export default authSlice.reducer;
