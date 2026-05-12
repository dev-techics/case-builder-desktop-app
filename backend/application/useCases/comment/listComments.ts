import { ValidationError } from '../../../domain/errors.js';
import type { StoredComment } from '../../../domain/comment.js';
import type { DocumentRepository } from '../../ports/documents/documentRepository.js';
import type { CommentRepository } from '../../ports/comments/commentRepository.js';

export class ListBundleCommentsUseCase {
  constructor(
    private readonly documentRepository: DocumentRepository,
    private readonly commentRepository: CommentRepository
  ) {}

  async execute(bundleIdInput: string): Promise<StoredComment[]> {
    const bundleId = bundleIdInput?.trim();

    if (!bundleId) {
      throw new ValidationError('Bundle id is required.');
    }

    const bundleName = await this.documentRepository.getBundleName(bundleId);

    if (!bundleName) {
      throw new ValidationError('Bundle not found.');
    }

    return this.commentRepository.listByBundle(bundleId);
  }
}
