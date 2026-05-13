export interface StoredRedaction {
  id: string;
  bundleId: string;
  documentId: string;
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
  fillHex: string;
  opacity: number;
  borderHex: string;
  borderWidth: number;
  createdAt: string;
  updatedAt: string;
}
