import { ipcRenderer, webUtils } from 'electron';

export const documentsApi = {
  /*-----------------------
        Fetch document tree
      -------------------------*/
  getDocumentsTree: (bundleId: string | number) =>
    ipcRenderer.invoke('document:getTree', bundleId),

  /*-----------------------
        Create folder IPC
      -------------------------*/
  createFolder: (input: {
    bundleId: string | number;
    name: string;
    parentId?: string | null;
  }) => ipcRenderer.invoke('document:createFolder', input),

  /*-----------------------
        Reorder documents IPC
      -------------------------*/
  reorderDocuments: (input: {
    bundleId: string | number;
    items: Array<{
      id: string | number;
      order: number;
    }>;
  }) => ipcRenderer.invoke('document:reorder', input),

  /*-----------------------
        Move document IPC
      -------------------------*/
  moveDocument: (input: { id: string | number; newParentId: string | null }) =>
    ipcRenderer.invoke('document:move', input),

  /*-----------------------
        Delete document IPC
      -------------------------*/
  deleteDocument: (input: { id: string | number }) =>
    ipcRenderer.invoke('document:delete', input),

  /*-----------------------
        Rename document IPC
      -------------------------*/
  renameDocument: (input: { id: string | number; name: string }) =>
    ipcRenderer.invoke('document:rename', input),

  /*---------------------------------
        Import/Upload documents channel
      -----------------------------------*/
  importDocuments: (input: {
    bundleId: string | number;
    parentId?: string | null;
    files: Array<{
      name: string;
      path: string;
      mimeType?: string | null;
    }>;
  }) => ipcRenderer.invoke('document:import', input),

  /* -----------------------
            Rotate Document
      --------------------------*/
  rotateDocument: (input: {
    bundleId: string;
    documentId: string;
    pageNumber: number;
    rotation: number;
  }) => ipcRenderer.invoke('document:rotate', input),

  /* -----------------------
            Merge Documents
      --------------------------*/
  mergeDocuments: (input: {
    bundleId: string | number;
    documentIds: Array<string | number>;
    name: string;
    parentId: string | null;
  }) => ipcRenderer.invoke('document:merge', input),

  /*-------------------------
    Get imported file path
  ---------------------------*/
  getPathForFile: (file: File) => webUtils.getPathForFile(file),
};
