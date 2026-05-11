import { contextBridge, ipcRenderer, webUtils } from 'electron';
console.log('Hello world!');
contextBridge.exposeInMainWorld('api', {
  isDesktop: true,

  /*====================
  |  Bundle channels   | 
  ======================*/
  /*--------------------
    Create bundle IPC 
  ----------------------*/
  createBundle: (
    input:
      | {
          name: string;
          caseNumber?: string;
          status?: string;
          description?: string;
          tags?: string[];
        }
      | string
  ) => ipcRenderer.invoke('bundle:create', input),

  getBundles: () => ipcRenderer.invoke('bundle:getAll'),

  /*----------------------
    Bundle update channel
  ------------------------*/
  updateBundle: (input: {
    id: string | number;
    name?: string;
    status?: string;
  }) => ipcRenderer.invoke('bundle:update', input),

  /*--------------------
    Delete bundle IPC
  ----------------------*/
  deleteBundle: (id: string | number) =>
    ipcRenderer.invoke('bundle:delete', id),

  /*====================
  |  Document Channels  |
  ======================*/
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

  /*========================
   | Highlight Channels   |
  ==========================*/

  /*-------------------- 
      Get highlights 
    ---------------------*/
  getHighlights: (bundleId: string | number) =>
    ipcRenderer.invoke('highlight:listByBundle', bundleId),

  /*---------------------- 
    Create highlight 
  ------------------------*/
  createHighlight: (input: {
    bundleId: string | number;
    data: {
      document_id: string;
      page_number: number;
      x: number;
      y: number;
      width: number;
      height: number;
      text: string;
      color_name: string;
      color_hex: string;
      color_rgb: {
        r: number;
        g: number;
        b: number;
      };
      opacity: number;
    };
  }) => ipcRenderer.invoke('highlight:create', input),

  /*------------------- 
    Delete highlight 
  ---------------------*/
  deleteHighlight: (input: { id: string | number }) =>
    ipcRenderer.invoke('highlight:delete', input),

  /*-------------------------
    Get imported file path
  ---------------------------*/
  getPathForFile: (file: File) => webUtils.getPathForFile(file),

  /*======================
  |   Comment Channels   |
  ========================*/
  /*-----------------
      Get Comments 
   ------------------*/
  getComments: (bundleId: string | number) =>
    ipcRenderer.invoke('comment:listByBundle', bundleId),

  /*--------------------
    Create comment
  ---------------------*/
  createComment: (input: {}) => ipcRenderer.invoke('comment:create', input),

  /*------------------
    Delete Comment  
  -------------------*/
  deleteComment: (input: { id: string | number }) =>
    ipcRenderer.invoke('comment:delete', input),

  /*======================
  |   Redact Channels     |
  ========================*/
  /*---------------------
    Get Redacts
  ----------------------*/
  getRedacts: (bundleId: string | number) =>
    ipcRenderer.invoke('redact:listByBundle', bundleId),
  /*------------------ 
    Create redact
  -------------------*/
  createRedact: (input: {}) => ipcRenderer.invoke('redact:create', input),
  /*-------------------
    Delete Redact  
  ---------------------*/
  deleteRedact: (input: { id: string | number }) =>
    ipcRenderer.invoke('redact:delete', input),
});
