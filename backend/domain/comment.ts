export interface StoredComment {
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
}

export function normalizeCommentText(text: string): string {
  return text.trim();
}
