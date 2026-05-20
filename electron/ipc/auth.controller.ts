import { ipcMain } from 'electron';
import { authService } from '../services/authService.js';
import { licenseService } from '../services/licenseService.js';

export function registerAuthIpc() {
  ipcMain.handle('auth:getSession', () => authService.getSession());
  ipcMain.handle('auth:login', (_, input) => authService.login(input));
  ipcMain.handle('auth:register', (_, input) => authService.register(input));
  ipcMain.handle('auth:logout', () => authService.logout());
  ipcMain.handle('license:check', () => licenseService.checkLicense());
  ipcMain.handle('subscription:openCheckout', () =>
    licenseService.openCheckout()
  );
}
