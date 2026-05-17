import { ipcRenderer } from 'electron';

type BundleMetadata = {
  [key: string]: unknown;
};

export const bundlesApi = {
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

  /*----------------
     Get bundles
  ------------------*/

  getBundles: () => ipcRenderer.invoke('bundle:getAll'),

  /*-----------------------
    Get bundle metadata
  -------------------------*/
  getBundleMetadata: (bundleId: string | number) =>
    ipcRenderer.invoke('bundle:getMetadata', bundleId),

  /*----------------------
        Bundle update channel
      ------------------------*/
  updateBundle: (input: {
    id: string | number;
    name?: string;
    status?: string;
  }) => ipcRenderer.invoke('bundle:update', input),

  /*-----------------------------
    Save & Update bundle metadata
  -------------------------------*/
  updateBundleMetadata: (input: {
    bundleId: string | number;
    metadata: BundleMetadata;
  }) => ipcRenderer.invoke('bundle:updateMetadata', input),

  /*--------------------
    Delete bundle IPC
  ----------------------*/
  deleteBundle: (id: string | number) =>
    ipcRenderer.invoke('bundle:delete', id),

  /*--------------- 
    Export bundle
  -----------------*/
  exportBundle: (input: {
    bundleId: string;
    frontCoverPageId?: string;
    backCoverPageId?: string;
    includeBackCover?: boolean;
    includeIndex?: boolean;
    compress?: boolean;
    fileName?: string;
  }) => ipcRenderer.invoke('bundle:export', input),
};
