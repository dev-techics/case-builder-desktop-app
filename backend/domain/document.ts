export const documentTypes = ['file', 'folder'] as const;

export type DocumentType = (typeof documentTypes)[number];

export interface StoredDocument {
  id: string;
  bundleId: string;
  parentId: string | null;
  name: string;
  type: DocumentType;
  mimeType: string | null;
  storagePath: string | null;
  order: number;
  metadata: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export function isDocumentType(value: unknown): value is DocumentType {
  return (
    typeof value === 'string' && documentTypes.includes(value as DocumentType)
  );
}
