import { ipcMain, app } from 'electron';
import { authService } from '../services/auth/index.js';
import { licenseService } from '../services/license/licenseService.js';

export function registerAuthIpc() {
  ipcMain.handle('auth:getSession', () => authService.getSession());
  ipcMain.handle('auth:login', async (_, input) => {
    const result = await authService.login(input);
    if (result.success) {
      // Give the renderer time to receive the success response,
      // then restart so main.ts re-runs with the new user's paths
      setTimeout(() => {
        app.relaunch();
        app.quit();
      }, 300);
    }

    return result;
  });
  ipcMain.handle('auth:register', (_, input) => authService.register(input));
  ipcMain.handle('auth:logout', async () => {
    const result = await authService.logout();
    // secureStore is now cleared, relaunch goes back to login screen
    setTimeout(() => {
      app.relaunch();
      app.quit();
    }, 300);

    return result;
  });
  ipcMain.handle('license:check', () => licenseService.checkLicense());
  ipcMain.handle('subscription:startTrial', () => licenseService.startTrial());
  ipcMain.handle('subscription:openCheckout', (_, input) =>
    licenseService.openCheckout(input)
  );
}
