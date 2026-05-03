import { contextBridge, ipcRenderer, webUtils } from 'electron';

contextBridge.exposeInMainWorld('api', {
  isDesktop: true,

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

  getDocumentsTree: (bundleId: string | number) =>
    ipcRenderer.invoke('document:getTree', bundleId),

  importDocuments: (input: {
    bundleId: string | number;
    parentId?: string | null;
    files: Array<{
      name: string;
      path: string;
      mimeType?: string | null;
    }>;
  }) => ipcRenderer.invoke('document:import', input),

  getPathForFile: (file: File) => webUtils.getPathForFile(file),
});
