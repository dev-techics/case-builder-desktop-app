import type { StoredRedaction } from '../../../domain/redaction.js';

export interface RedactionRepository {
  create(redaction: StoredRedaction): Promise<void>;
  delete(id: string): Promise<StoredRedaction | null>;
  listByBundle(bundleId: string): Promise<StoredRedaction[]>;
}