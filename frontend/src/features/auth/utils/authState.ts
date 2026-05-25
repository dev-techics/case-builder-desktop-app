// src/features/auth/utils/authState.ts
import store from '@/app/store';
import { clearAuth, setInitialized, setLicense, setUser } from '../redux/authSlice';
import { hasDesktopLicenseAccess } from './index';

export async function initAuth(): Promise<void> {
  const desktopApi = window.api?.isDesktop ? window.api : null;

  if (!desktopApi) {
    store.dispatch(setInitialized());
    return;
  }

  try {
    const session = await desktopApi.getSession();
    if (!session) {
      store.dispatch(clearAuth());
      return;
    }

    const license = await desktopApi.checkLicense();
    store.dispatch(setUser(session.user));
    store.dispatch(setLicense(license));
    store.dispatch(setInitialized());

  } catch {
    store.dispatch(clearAuth());
    
  }finally{
    store.dispatch(setInitialized());
  }
}

// Loaders call these — no hooks, just plain store reads
export function getAuthSnapshot() {
   const state = store.getState().auth;
  return {
    isAuthenticated: state.isAuthenticated, 
    hasLicense: hasDesktopLicenseAccess(state.license),
    initialized: state.isInitialized,
  };
}