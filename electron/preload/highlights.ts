import { ipcRenderer } from 'electron';

export const highlightsApi = {
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
};
