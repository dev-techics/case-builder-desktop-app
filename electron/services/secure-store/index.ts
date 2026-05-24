import { StoredSession, LicenseCache, StoreState } from './types.js';
import { readStoreState, writeStoreState } from './utils.js';

export const EMPTY_STORE_STATE: StoreState = {
  session: null,
  license: null,
};

export const secureStore = {
  async setSession(session: StoredSession) {
    const state = await readStoreState();
    await writeStoreState({
      ...state,
      session,
    });
  },

  async getSession(): Promise<StoredSession | null> {
    const state = await readStoreState();
    return state.session;
  },

  async getAccessToken(): Promise<string | null> {
    const session = await this.getSession();
    return session?.accessToken ?? null;
  },

  async setLicenseCache(license: Omit<LicenseCache, 'lastChecked'>) {
    const state = await readStoreState();
    await writeStoreState({
      ...state,
      license: {
        ...license,
        lastChecked: Date.now(),
      },
    });
  },

  async getLicenseCache(): Promise<LicenseCache | null> {
    const state = await readStoreState();
    return state.license;
  },

  async clear() {
    await writeStoreState(EMPTY_STORE_STATE);
  },
};
