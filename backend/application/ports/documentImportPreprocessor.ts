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

export interface DocumentImportPreprocessor {
  preprocess(
    input: DocumentImportProcessingInput
  ): Promise<DocumentImportPreprocessResult>;
}
