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
