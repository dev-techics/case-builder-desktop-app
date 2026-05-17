import { app, BrowserWindow } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { registerBundleIpc } from './ipc/bundle.controller.js';
import { registerDocumentIpc } from './ipc/document.controller.js';
import { registerHighlightIpc } from './ipc/highlight.controller.js';
import { registerDocumentProtocol } from './document.protocol.js';
import { createSqliteDatabase } from '../backend/infrastructure/database/sqlite.js';
import { GhostscriptPdfCompressor } from '../backend/infrastructure/document-processing/compression/pdfCompressor.js';
import { OfficeDocumentToPdfConverter } from '../backend/infrastructure/document-processing/conversion/docToPdf.js';
import { DocumentImportPreprocessor } from '../backend/infrastructure/document-processing/documentImportPreprocessor.js';
import { BundleExportService } from '../backend/infrastructure/document-processing/export/BundleExportService.js';
import { GhostscriptManager } from '../backend/infrastructure/document-processing/ghostscript/ghostscriptManager.js';
import { SqliteBundleRepository } from '../backend/infrastructure/repositories/sqliteBundleRepository.js';
import { SqliteDocumentRepository } from '../backend/infrastructure/repositories/sqliteDocumentRepository.js';
import { SqliteHighlightRepository } from '../backend/infrastructure/repositories/sqliteHighlightRepository.js';
import { SqliteCommentRepository } from '../backend/infrastructure/repositories/sqliteCommentRepository.js';
import { LocalDocumentStorage } from '../backend/infrastructure/storage/localDocumentStorage.js';
import {
  buildDocumentUrl,
  getDatabasePath,
  getDocumentsStoragePath,
  getGSInstallDir,
} from './utils/index.js';
import { DocumentRotateProcessor } from '../backend/infrastructure/document-processing/pdf-lib-processor/rotate.js';
import { registerCommentIpc } from './ipc/comment.controller.js';
import { registerRedactionIpc } from './ipc/redaction.controller.js';
import { SqliteRedactionRepository } from '../backend/infrastructure/repositories/sqliteRedactionRepository.js';
import { SqliteCoverPageRepository } from '../backend/infrastructure/repositories/sqliteCoverPageRepository.js';
import { registerCoverPageIpc } from './ipc/coverPage.controller.js';
import { ElectronPdfGenerator } from './services/electronPdfGenerator.js';
import { HtmlToPdfService } from '../backend/infrastructure/document-processing/coverpage/htmlToPdfService.js';
import { CoverPageGenerator } from '../backend/infrastructure/document-processing/export/services/CoverPageGenerator.js';

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
  const highlightRepository = new SqliteHighlightRepository(db);
  const commentRepository = new SqliteCommentRepository(db);
  const redactionRepository = new SqliteRedactionRepository(db);
  const coverPageRepository = new SqliteCoverPageRepository(db);
  const documentStorage = new LocalDocumentStorage(documentsStoragePath);
  const requireGhostscript =
    process.env.CASE_BUILDER_REQUIRE_GHOSTSCRIPT === 'true';
  const officeConverterCommand =
    process.env.CASE_BUILDER_PDF_CONVERTER_PATH?.trim() || null;
  const ghostscriptManager = new GhostscriptManager({
    installDirectory: getGSInstallDir(),
    requireGhostscript,
  });
  const pdfGenerator = new ElectronPdfGenerator();

  const htmlToPdfService = new HtmlToPdfService(pdfGenerator);
  const coverPageGenerator = new CoverPageGenerator(
    coverPageRepository,
    htmlToPdfService
  );
  const pdfCompressor = new GhostscriptPdfCompressor({
    ghostscriptManager,
    requireGhostscript,
  });
  const documentToPdfConverter = new OfficeDocumentToPdfConverter({
    officeConverterCommand,
  });
  const documentProcessor = new DocumentImportPreprocessor({
    pdfCompressor,
    documentToPdfConverter,
  });
  // Instance of document rotate processor class
  const rotateProcessor = new DocumentRotateProcessor();
  const exportService = new BundleExportService({
    bundleRepository,
    documentRepository,
    highlightRepository,
    redactionRepository,
    documentsStorageRoot: documentsStoragePath,
    pdfCompressor,
    coverPageGenerator,
  });

  registerBundleIpc({ bundleRepository, documentStorage, exportService });
  registerDocumentIpc({
    documentRepository,
    documentStorage,
    documentProcessor,
    rotateProcessor,
    buildDocumentUrl,
  });
  registerHighlightIpc({
    documentRepository,
    highlightRepository,
  });
  registerCommentIpc({ documentRepository, commentRepository });
  registerRedactionIpc({ documentRepository, redactionRepository });
  registerCoverPageIpc({ coverPageRepository });
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
      preload: path.join(appDir, 'preload', 'index.js'),
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
