import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import { app, BrowserWindow } from 'electron';

// Configure logging
autoUpdater.logger = log;
(autoUpdater.logger as any).transports.file.level = 'info';

export function setupAutoUpdater(mainWindow: BrowserWindow) {
  // Check for updates after app is ready (not on every launch in dev)
  if (app.isPackaged) {
    autoUpdater.checkForUpdatesAndNotify();
  }

  autoUpdater.on('update-available', () => {
    mainWindow.webContents.send('update-available');
  });

  autoUpdater.on('update-downloaded', () => {
    mainWindow.webContents.send('update-downloaded');
    // Optionally auto-install
    // autoUpdater.quitAndInstall();
  });

  autoUpdater.on('error', err => {
    log.error('AutoUpdater error:', err);
  });
}
