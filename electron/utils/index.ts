import { app } from 'electron';
import path from 'path';

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
    return path.join(app.getPath('userData'), 'case-builder', 'documents');
  }

  return path.join(process.cwd(), 'storage', 'documents');
};

export const buildDocumentUrl = (documentId: string) =>
  `${DOCUMENT_PROTOCOL}://document/${encodeURIComponent(documentId)}`;
