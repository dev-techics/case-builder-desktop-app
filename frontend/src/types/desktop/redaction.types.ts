// frontend/src/types/desktop/redaction.types.ts

export type DesktopRedactionRecord = {
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
};

export type CreateRedactionRequest = {
  document_id: string;
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

export type DesktopCreateRedactionInput = {
  bundleId: string | number;
  data: CreateRedactionRequest;
};

export type DesktopDeleteRedactionInput = {
  id: string | number;
};