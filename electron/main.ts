import { app, BrowserWindow } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { registerBundleIpc } from './ipc/bundle.controller.js';
import { createSqliteDatabase } from '../backend/infrastructure/database/sqlite.js';
import { SqliteBundleRepository } from '../backend/infrastructure/repositories/sqliteBundleRepository.js';
import { cwd } from 'node:process';

const DEV_RENDERER_URL =
  process.env.ELECTRON_RENDERER_URL ?? 'http://localhost:3000';
const appDir = path.dirname(fileURLToPath(import.meta.url));

const registerIpc = async () => {
  const bundlesPath = path.join(
    app.getPath('userData'),
    'case-builder',
    'bundles.json'
  );
  const databasePath = getDatabasePath();
  const db = createSqliteDatabase(databasePath);
  const bundleRepository = new SqliteBundleRepository(db);

  registerBundleIpc({ bundleRepository });
};

/*-------------------
  Get Database Path
---------------------*/
const getDatabasePath = () => {
  if (app.isPackaged) {
    return path.join(
      app.getPath('userData'),
      'case-builder',
      'case-builder.db'
    );
  }
  console.log(`Current directory: ${cwd()}`);
  return path.join(process.cwd(), 'storage', 'case-builder.db');
};

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,

    webPreferences: {
      preload: path.join(appDir, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (app.isPackaged) {
    win.loadFile(path.join(appDir, '../../dist-react/index.html'));
  } else {
    win.loadURL(DEV_RENDERER_URL);
    win.webContents.openDevTools({ mode: 'detach' });
  }
};

app.whenReady().then(async () => {
  await registerIpc();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
