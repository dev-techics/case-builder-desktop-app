import { ipcRenderer } from 'electron';

export const authApi = {
  // Session
  getSession: () => ipcRenderer.invoke('auth:getSession'),

  // Auth actions
  login: (input: { email: string; password: string }) =>
    ipcRenderer.invoke('auth:login', input),

  register: (input: {
    name: string;
    email: string;
    password: string;
    passwordConfirmation?: string;
  }) => ipcRenderer.invoke('auth:register', input),

  logout: () => ipcRenderer.invoke('auth:logout'),

  // License
  checkLicense: () => ipcRenderer.invoke('license:check'),

  // Subscription — opens Stripe checkout in system browser
  startTrial: () => ipcRenderer.invoke('subscription:startTrial'),

  openCheckout: (input?: {
    planId?: string;
    billingInterval?: 'monthly' | 'yearly';
  }) => ipcRenderer.invoke('subscription:openCheckout', input),

  // Update notifications (from your autoUpdater setup)
  onUpdateAvailable: (cb: () => void) =>
    ipcRenderer.on('update-available', _event => cb()),

  onUpdateDownloaded: (cb: () => void) =>
    ipcRenderer.on('update-downloaded', _event => cb()),

  installUpdate: () => ipcRenderer.send('install-update'),
};
