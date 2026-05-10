export interface DocumentImportProcessingInput {
  name: string;
  path: string;
  mimeType?: string | null;
}

export interface DocumentImportStatus {
  fileName: string;
  status: 'success' | 'failed';
  message?: string;
}

export interface PreparedImportDocument {
  name: string;
  path: string;
  mimeType: string;
  cleanup(): Promise<void>;
}

export interface DocumentImportPreprocessResult {
  document: PreparedImportDocument | null;
  status?: DocumentImportStatus;
}

export interface DocumentProcessor {
  preprocess(
    input: DocumentImportProcessingInput
  ): Promise<DocumentImportPreprocessResult>;
}

export interface RotateDocumentProcessor {
  getPageCount(filePath: string): Promise<number>;
  rotatePage(input: {
    filePath: string;
    pageNumber: number; // 1-based
    rotation: 0 | 90 | 180 | 270;
  }): Promise<void>;
}
