import { ipcRenderer } from 'electron';

export const redactionsApi = {
  /*---------------------
    Get Redacts
  ----------------------*/
  getRedactions: (bundleId: string | number) =>
    ipcRenderer.invoke('redaction:listByBundle', bundleId),
  /*------------------ 
    Create redact
  -------------------*/
  createRedaction: (input: {
    bundleId: string | number;
    data: {
      document_id: string | number;
      page_number: number;
      x: number;
      y: number;
      width: number;
      height: number;
      name: string;
      fill_hex: string;
      opacity: number;
      border_hex: string;
      border_width: number;
    };
  }) => ipcRenderer.invoke('redaction:create', input),
  /*-------------------
    Delete Redact  
  ---------------------*/
  deleteRedaction: (input: { id: string | number }) =>
    ipcRenderer.invoke('redaction:delete', input),
};
