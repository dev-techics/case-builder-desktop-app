import type { StoredDocument } from '../../domain/document.js';

export type DocumentOrderUpdate = {
  id: string;
  order: number;
};

export interface DocumentRepository {
  createMany(documents: StoredDocument[]): Promise<void>;
  delete(id: string): Promise<StoredDocument[]>;
  getBundleName(bundleId: string): Promise<string | null>;
  getById(id: string): Promise<StoredDocument | null>;
  getNextOrder(bundleId: string, parentId: string | null): Promise<number>;
  listByBundle(bundleId: string): Promise<StoredDocument[]>;
  move(id: string, parentId: string | null, order: number): Promise<StoredDocument>;
  reorder(bundleId: string, items: DocumentOrderUpdate[]): Promise<void>;
  rename(id: string, name: string): Promise<StoredDocument>;
}
