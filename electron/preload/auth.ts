import { ipcRenderer, type IpcRendererEvent } from 'electron';

type ProtocolPayload = {
  url: string;
  host: string;
  path: string;
  params: Record<string, string>;
};

export const authApi = {
  getSession: () => ipcRenderer.invoke('auth:getSession'),
  login: (input: { email: string; password: string }) =>
    ipcRenderer.invoke('auth:login', input),
  register: (input: {
    name: string;
    email: string;
    password: string;
    passwordConfirmation?: string;
  }) => ipcRenderer.invoke('auth:register', input),
  logout: () => ipcRenderer.invoke('auth:logout'),
  checkLicense: () => ipcRenderer.invoke('license:check'),
  startTrial: () => ipcRenderer.invoke('subscription:startTrial'),
  openCheckout: (input?: {
    planId?: string;
    billingInterval?: 'monthly' | 'yearly';
  }) => ipcRenderer.invoke('subscription:openCheckout', input),
  getSubscriptionStatus: () => ipcRenderer.invoke('subscription:getStatus'),
  onProtocolUrl: (cb: (payload: ProtocolPayload) => void) => {
    const listener = (_event: IpcRendererEvent, payload: ProtocolPayload) =>
      cb(payload);

    ipcRenderer.on('app:protocol-url', listener);

    return () => {
      ipcRenderer.removeListener('app:protocol-url', listener);
    };
  },
  onUpdateAvailable: (cb: () => void) =>
    ipcRenderer.on('update-available', _event => cb()),
  onUpdateDownloaded: (cb: () => void) =>
    ipcRenderer.on('update-downloaded', _event => cb()),
  installUpdate: () => ipcRenderer.send('install-update'),
};
