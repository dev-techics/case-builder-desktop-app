import { app } from 'electron';
import path from 'node:path';
import { secureStore } from '../services/secure-store/index.js';

export const DOCUMENT_PROTOCOL = 'case-builder-document';

/*-------------------
  Get Database Path
---------------------*/
export const getDatabasePath = async () => {
  const session = await secureStore.getSession();
  const userId = session?.user.id.toString();
  if (!userId) {
    throw new Error('No authenticated user — cannot resolve database path');
  }

  const base = app.isPackaged
    ? app.getPath('userData')
    : path.join(process.cwd(), 'storage');

  return path.join(base, 'users', userId, 'case-builder.db');
};

/*--------------------------
  Get Documents Storage Root
----------------------------*/
export const getDocumentsStoragePath = async () => {
  const session = await secureStore.getSession();
  const userId = session?.user.id.toString();
  if (!userId) {
    throw new Error('No authenticated user — cannot resolve database path');
  }

  const base = app.isPackaged
    ? app.getPath('userData')
    : path.join(process.cwd(), 'storage');

  return path.join(base, 'users', userId, 'bundles');
};

export const buildDocumentUrl = (documentId: string) =>
  `${DOCUMENT_PROTOCOL}://document/${encodeURIComponent(documentId)}`;

/**------------------------------
 * Get gs install directory
 --------------------------------*/
export function getGSInstallDir() {
  return path.join(app.getPath('userData'), 'bin', 'ghostscript');
}

/**------------------------------
 * Get bundled gs binary path
 --------------------------------*/
export function getBundledGSBinaryPath() {
  const executableName = process.platform === 'win32' ? 'gswin64c.exe' : 'gs';
  const relativePath = path.join(
    'ghostscript',
    process.platform,
    'bin',
    executableName
  );

  if (app.isPackaged) {
    return path.join(process.resourcesPath, relativePath);
  }

  return path.join(process.cwd(), 'build', relativePath);
}
