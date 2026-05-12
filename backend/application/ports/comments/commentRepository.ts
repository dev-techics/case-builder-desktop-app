import { StoredComment } from '../../../domain/comment.js';

export interface CommentRepository {
  create(comment: StoredComment): Promise<void>;
  listByBundle(bundleId: string): Promise<StoredComment[]>;
  delete(id: string): Promise<StoredComment | null>;
}
