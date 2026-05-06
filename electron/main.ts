import { app, BrowserWindow } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { registerBundleIpc } from './ipc/bundle.controller.js';
import { registerDocumentIpc } from './ipc/document.controller.js';
import { registerDocumentProtocol } from './document.protocol.js';
import { createSqliteDatabase } from '../backend/infrastructure/database/sqlite.js';
import { SqliteBundleRepository } from '../backend/infrastructure/repositories/sqliteBundleRepository.js';
import { SqliteDocumentRepository } from '../backend/infrastructure/repositories/sqliteDocumentRepository.js';
import { LocalDocumentStorage } from '../backend/infrastructure/files/localDocumentStorage.js';
import { ElectronDocumentImportPreprocessor } from './services/documentImportPreprocessor.js';
import { GhostscriptManager } from './services/ghostscriptManager.js';
import {
  buildDocumentUrl,
  getDatabasePath,
  getDocumentsStoragePath,
} from './utils/index.js';

const DEV_RENDERER_URL =
  process.env.ELECTRON_RENDERER_URL ?? 'http://localhost:3000';
const appDir = path.dirname(fileURLToPath(import.meta.url));

/*----------------------
  Register IPC Handlers
------------------------*/
const registerIpc = () => {
  const databasePath = getDatabasePath();
  const documentsStoragePath = getDocumentsStoragePath();
  const db = createSqliteDatabase(databasePath);
  const bundleRepository = new SqliteBundleRepository(db);
  const documentRepository = new SqliteDocumentRepository(db);
  const documentStorage = new LocalDocumentStorage(documentsStoragePath);
  const requireGhostscript =
    process.env.CASE_BUILDER_REQUIRE_GHOSTSCRIPT === 'true';
  const ghostscriptManager = new GhostscriptManager({
    requireGhostscript,
  });
  const documentImportPreprocessor = new ElectronDocumentImportPreprocessor({
    ghostscriptManager,
    requireGhostscript,
    officeConverterCommand:
      process.env.CASE_BUILDER_PDF_CONVERTER_PATH?.trim() || null,
  });

  registerBundleIpc({ bundleRepository, documentStorage });
  registerDocumentIpc({
    documentRepository,
    documentStorage,
    documentImportPreprocessor,
    buildDocumentUrl,
  });
  registerDocumentProtocol({
    documentRepository,
    documentsStorageRoot: documentsStoragePath,
  });
};

/*-------------------
  Create Window
---------------------*/
const createWindow = () => {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,

    webPreferences: {
      preload: path.join(appDir, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (app.isPackaged) {
    win.loadFile(path.join(appDir, '../../dist-react/index.html'));
  } else {
    win.loadURL(DEV_RENDERER_URL);
    win.webContents.openDevTools({ mode: 'detach' });
  }
};

// App Lifecycle
app.whenReady().then(async () => {
  registerIpc();
  createWindow();
});

/*-------------------------------------------------------------------------
 Quit when all windows are closed, except on macOS. There, it's common
 for applications and their menu bar to stay active until the user quits
 explicitly with Cmd + Q. 
 --------------------------------------------------------------------------*/
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

/*-------------------------------------------------------------------------
 On macOS, re-create a window in the app when the dock icon is clicked and 
 there are no other windows open.
 --------------------------------------------------------------------------*/
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
