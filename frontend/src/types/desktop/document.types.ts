// frontend/src/types/desktop/document.types.ts



export type DocumentImportStatus = {
  fileName: string;
  status: 'success' | 'failed';
  message?: string;
};

export type DesktopCreateFolderInput = {
  bundleId: string | number;
  name: string;
  parentId?: string | null;
};

export type DesktopCreateFolderResponse = {
  id: string;
  name: string;
  type: 'folder';
  parentId: string | null;
};

export type DesktopReorderDocumentsInput = {
  bundleId: string | number;
  items: Array<{ id: string | number; order: number }>;
};

export type DesktopMoveDocumentInput = {
  id: string | number;
  newParentId: string | null;
};

export type DesktopDeleteDocumentInput = {
  id: string | number;
};

export type DesktopRenameDocumentInput = {
  id: string | number;
  name: string;
};

export type DesktopRenameDocumentResponse = {
  id: string;
  name: string;
};

export type DesktopRotateDocumentInput = {
  bundleId: string;
  documentId: string;
  pageNumber: number;
  rotation: number;
};

export type DesktopRotateDocumentResponse = {
  documentUrl?: string;
};

export type DesktopImportDocumentsInput = {
  bundleId: string | number;
  parentId?: string | null;
  files: Array<{
    name: string;
    path: string;
    mimeType?: string | null;
  }>;
};

export type DesktopImportDocumentsResponse = {
  documents: Array<{
    id: string | number;
    parentId: string | null;
    name: string;
    type: string;
    url: string;
  }>;
  conversionStatuses?: DocumentImportStatus[];
};


export {type FileTree} from '@/features/file-explorer/types/fileTree';