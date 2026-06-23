import { app, BrowserWindow } from 'electron';
import path from 'node:path';

export const APP_PROTOCOL = 'casebuilder';
export const PAYMENT_RETURN_URL = `${APP_PROTOCOL}://payment/complete`;

type ProtocolPayload = {
  url: string;
  host: string;
  path: string;
  params: Record<string, string>;
};

let mainWindow: BrowserWindow | null = null;
let pendingPayload: ProtocolPayload | null = null;

export function registerAppProtocol() {
  if (process.defaultApp) {
    const appPath = process.argv[1];
    if (appPath) {
      app.setAsDefaultProtocolClient(APP_PROTOCOL, process.execPath, [
        path.resolve(appPath),
      ]);
    }
    return;
  }

  app.setAsDefaultProtocolClient(APP_PROTOCOL);
}

export function bindProtocolWindow(window: BrowserWindow) {
  mainWindow = window;

  window.on('closed', () => {
    if (mainWindow === window) {
      mainWindow = null;
    }
  });

  window.webContents.once('did-finish-load', flushPendingProtocolPayload);
}

export function handleProtocolUrl(input: string | undefined) {
  if (!input?.startsWith(`${APP_PROTOCOL}://`)) {
    return;
  }

  const payload = parseProtocolUrl(input);
  if (!payload) {
    return;
  }

  focusMainWindow();
  sendProtocolPayload(payload);
}

export function findProtocolUrl(args: string[]) {
  return args.find(arg => arg.startsWith(`${APP_PROTOCOL}://`));
}

function parseProtocolUrl(input: string): ProtocolPayload | null {
  try {
    const url = new URL(input);
    if (url.protocol !== `${APP_PROTOCOL}:`) {
      return null;
    }

    return {
      url: input,
      host: url.hostname,
      path: url.pathname,
      params: Object.fromEntries(url.searchParams.entries()),
    };
  } catch {
    return null;
  }
}

function focusMainWindow() {
  if (!mainWindow) {
    return;
  }

  if (mainWindow.isMinimized()) {
    mainWindow.restore();
  }

  mainWindow.show();
  mainWindow.focus();
}

function sendProtocolPayload(payload: ProtocolPayload) {
  if (!mainWindow || mainWindow.webContents.isLoading()) {
    pendingPayload = payload;
    return;
  }

  mainWindow.webContents.send('app:protocol-url', payload);
}

function flushPendingProtocolPayload() {
  if (!pendingPayload) {
    return;
  }

  const payload = pendingPayload;
  pendingPayload = null;
  sendProtocolPayload(payload);
}
