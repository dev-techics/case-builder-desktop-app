import { ipcRenderer } from 'electron';

export const commentsApi = {
  /*-----------------
          Get Comments 
       ------------------*/
  getComments: (bundleId: string | number) =>
    ipcRenderer.invoke('comment:listByBundle', bundleId),

  /*--------------------
        Create comment
      ---------------------*/
  createComment: (input: {
    bundleId: string | number;
    data: {
      document_id: string | number;
      page_number: number;
      text: string;
      selected_text?: string;
      x: number;
      y: number;
      page_y: number;
    };
  }) => ipcRenderer.invoke('comment:create', input),
  /*------------------
        Delete Comment  
      -------------------*/
  deleteComment: (input: { id: string | number }) =>
    ipcRenderer.invoke('comment:delete', input),
};
