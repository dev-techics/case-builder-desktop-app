import { app } from 'electron';
import path from 'node:path';

export const DOCUMENT_PROTOCOL = 'case-builder-document';

/*-------------------
  Get Database Path
---------------------*/
export const getDatabasePath = () => {
  if (app.isPackaged) {
    return path.join(
      app.getPath('userData'),
      'case-builder',
      'case-builder.db'
    );
  }
  return path.join(process.cwd(), 'storage', 'case-builder.db');
};

/*--------------------------
  Get Documents Storage Root
----------------------------*/
export const getDocumentsStoragePath = () => {
  if (app.isPackaged) {
    return path.join(app.getPath('userData'), 'case-builder', 'bundles');
  }

  return path.join(process.cwd(), 'storage', 'bundles');
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
