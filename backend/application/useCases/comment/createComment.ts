import { v4 as uuidv4 } from 'uuid';
import { ValidationError } from '../../../domain/errors.js';
import {
  normalizeCommentText,
  type StoredComment,
} from '../../../domain/comment.js';
import type { DocumentRepository } from '../../ports/documents/documentRepository.js';
import type { CommentRepository } from '../../ports/comments/commentRepository.js';

type CreateCommentInput = Omit<
  StoredComment,
  'id' | 'resolved' | 'createdAt' | 'updatedAt'
>;

export class CreateCommentUseCase {
  constructor(
    private readonly documentRepository: DocumentRepository,
    private readonly commentRepository: CommentRepository
  ) {}

  async execute(input: CreateCommentInput): Promise<StoredComment> {
    const text = normalizeCommentText(input.text);

    if (!input.bundleId?.trim()) {
      throw new ValidationError('Bundle id is required.');
    }

    if (!input.documentId?.trim()) {
      throw new ValidationError('Document id is required.');
    }

    if (!text) {
      throw new ValidationError('Comment text is required.');
    }

    const bundleName = await this.documentRepository.getBundleName(
      input.bundleId
    );

    if (!bundleName) {
      throw new ValidationError('Bundle not found.');
    }

    const now = new Date().toISOString();

    const comment: StoredComment = {
      ...input,
      id: uuidv4(),
      text,
      resolved: false,
      createdAt: now,
      updatedAt: now,
    };

    await this.commentRepository.create(comment);
    return comment;
  }
}
