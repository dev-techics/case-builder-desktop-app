import { createRequire } from 'node:module';
import { app, BrowserWindow } from 'electron';

const require = createRequire(import.meta.url);
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');

// Module-level flag — ensures setup only runs once
let isAutoUpdaterInitialized = false;

// Configure logging once at module level — this is fine
autoUpdater.logger = log;
(autoUpdater.logger as any).transports.file.level = 'info';

export function setupAutoUpdater(mainWindow: BrowserWindow) {
  // Skip entirely in development
  if (!app.isPackaged) return;

  // Prevent listener accumulation on macOS across multiple createWindow calls
  if (isAutoUpdaterInitialized) return;
  isAutoUpdaterInitialized = true;

  autoUpdater.on('update-available', () => {
    mainWindow.webContents.send('update-available');
  });

  autoUpdater.on('update-downloaded', () => {
    mainWindow.webContents.send('update-downloaded');
    autoUpdater.quitAndInstall(); // uncomment to auto-install silently
  });

  autoUpdater.on('error', (err: Error) => {
    log.error('AutoUpdater error:', err);
  });

  // Check after listeners are registered, not before
  autoUpdater.checkForUpdatesAndNotify();
}
