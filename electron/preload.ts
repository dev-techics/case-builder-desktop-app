import { contextBridge, ipcRenderer } from 'electron';

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
});
