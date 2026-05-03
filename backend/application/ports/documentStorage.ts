export interface StoredFileReference {
  storagePath: string;
}

export interface DocumentStorage {
  copyFromPath(input: {
    bundleId: string;
    documentId: string;
    sourcePath: string;
    originalName: string;
  }): Promise<StoredFileReference>;
  deleteByStoragePath(storagePath: string): Promise<void>;
}

