import { createRequire } from 'node:module';
import { app, BrowserWindow, dialog } from 'electron'; // add dialog

const require = createRequire(import.meta.url);
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');

let isAutoUpdaterInitialized = false;

autoUpdater.logger = log;
(autoUpdater.logger as any).transports.file.level = 'info';
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

export function setupAutoUpdater(mainWindow: BrowserWindow) {
  if (!app.isPackaged) return;
  if (isAutoUpdaterInitialized) return;
  isAutoUpdaterInitialized = true;

  // Guard against stale/destroyed window reference
  const isWindowAlive = () => mainWindow && !mainWindow.isDestroyed();

  // ── 1. Ask user if they want to download ─────────────────────────────────
  autoUpdater.on('update-available', async (info: { version: string }) => {
    if (!isWindowAlive()) return; // ← guard
    const { response } = await dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update Available',
      message: `A new version (v${info.version}) of Case Builder is available.`,
      detail:
        'Would you like to download and install it now?\nThe app will restart automatically.',
      buttons: ['Download & Install', 'Later'],
      defaultId: 0, // focused button
      cancelId: 1, // which button = "cancel"
    });

    if (response === 0) {
      autoUpdater.downloadUpdate();
    }
  });

  // ── 2. Show download progress via window title ────────────────────────────
  autoUpdater.on('download-progress', (progress: { percent: number }) => {
    if (!isWindowAlive()) return; // ← guard

    const percent = Math.round(progress.percent);
    mainWindow.setTitle(`Case Builder — Downloading update… ${percent}%`);

    // Optional: show progress in taskbar (Windows only)
    mainWindow.setProgressBar(percent / 100);
  });

  // ── 3. Ask user to restart once download is complete ─────────────────────
  autoUpdater.on('update-downloaded', async () => {
    if (!isWindowAlive()) return; // ← guard
    // Reset title and taskbar progress
    mainWindow.setTitle('Case Builder');
    mainWindow.setProgressBar(-1);

    const { response } = await dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update Ready',
      message: 'Update downloaded successfully.',
      detail:
        'Restart now to apply the update, or continue and it will be applied on next launch.',
      buttons: ['Restart Now', 'Later'],
      defaultId: 0,
      cancelId: 1,
    });

    if (response === 0) {
      autoUpdater.quitAndInstall(false, true);
    }
  });

  // ── 4. Show error dialog if something goes wrong ──────────────────────────
  autoUpdater.on('error', async (err: Error) => {
    log.error('AutoUpdater error:', err);
    if (!isWindowAlive()) return; // ← guard

    await dialog.showMessageBox(mainWindow, {
      type: 'error',
      title: 'Update Failed',
      message: 'An error occurred while checking for updates.',
      detail: err.message,
      buttons: ['OK'],
    });
  });

  autoUpdater.checkForUpdates();
}
