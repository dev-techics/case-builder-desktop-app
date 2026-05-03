import type { StoredDocument } from '../../domain/document.js';

export interface DocumentRepository {
  createMany(documents: StoredDocument[]): Promise<void>;
  getBundleName(bundleId: string): Promise<string | null>;
  getById(id: string): Promise<StoredDocument | null>;
  getNextOrder(bundleId: string, parentId: string | null): Promise<number>;
  listByBundle(bundleId: string): Promise<StoredDocument[]>;
}

