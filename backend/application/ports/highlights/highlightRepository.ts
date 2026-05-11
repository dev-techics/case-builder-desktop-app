import type { StoredHighlight } from '../../../domain/highlight.js';

export interface HighlightRepository {
  create(highlight: StoredHighlight): Promise<void>;
  delete(id: string): Promise<StoredHighlight | null>;
  listByBundle(bundleId: string): Promise<StoredHighlight[]>;
}
