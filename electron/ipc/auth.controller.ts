import { ipcMain, app } from 'electron';
import { authService } from '../services/auth/index.js';
import { licenseService } from '../services/license/licenseService.js';

type RegisterAuthIpcOptions = {
  onAuthenticated?: () => Promise<void>;
};

function relaunchApp() {
  setTimeout(() => {
    app.relaunch();
    app.quit();
  }, 300);
}

export function registerAuthIpc(options: RegisterAuthIpcOptions = {}) {
  ipcMain.handle('auth:getSession', () => authService.getSession());
  ipcMain.handle('auth:login', async (_, input) => {
    const result = await authService.login(input);
    if (result.success) {
      // Packaged builds restart so main.ts re-runs with the new user's paths.
      // Development initializes data IPC in-place so Vite stays alive.
      if (app.isPackaged) {
        relaunchApp();
      } else {
        await options.onAuthenticated?.();
      }
    }

    return result;
  });
  ipcMain.handle('auth:register', (_, input) => authService.register(input));
  ipcMain.handle('auth:logout', async () => {
    const result = await authService.logout();
    // Packaged builds restart so the next launch starts without user-scoped services.
    if (app.isPackaged) {
      relaunchApp();
    }

    return result;
  });
  ipcMain.handle('license:check', () => licenseService.checkLicense());
  ipcMain.handle('subscription:startTrial', () => licenseService.startTrial());
  ipcMain.handle('subscription:openCheckout', (_, input) =>
    licenseService.openCheckout(input)
  );
  ipcMain.handle('subscription:getStatus', () =>
    licenseService.getSubscriptionStatus()
  );
}
