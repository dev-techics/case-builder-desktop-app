// frontend/src/types/desktop/comment.types.ts

export type DesktopCommentRecord = {
  id: string;
  bundleId: string;
  documentId: string;
  pageNumber: number;
  text: string;
  selectedText: string;
  x: number;
  y: number;
  pageY: number;
  resolved: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateCommentRequest = {
  document_id: string;
  page_number: number;
  text: string;
  selected_text?: string;
  x: number;
  y: number;
  page_y: number;
};

export type DesktopCreateCommentInput = {
  bundleId: string | number;
  data: CreateCommentRequest;
};

export type DesktopDeleteCommentInput = {
  id: string | number;
};