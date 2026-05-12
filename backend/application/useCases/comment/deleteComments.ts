import { ValidationError } from '../../../domain/errors.js';
import type { StoredComment } from '../../../domain/comment.js';
import { CommentRepository } from '../../ports/comments/commentRepository.js';

export class DeleteCommentUseCase {
  constructor(private readonly commentRepository: CommentRepository) {}

  async execute(idInput: string): Promise<StoredComment> {
    const id = idInput?.trim();

    if (!id) {
      throw new ValidationError('Highlight id is required.');
    }

    const deletedComment = await this.commentRepository.delete(id);

    if (!deletedComment) {
      throw new ValidationError('Highlight not found.');
    }

    return deletedComment;
  }
}
