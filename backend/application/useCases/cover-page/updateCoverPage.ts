import { ValidationError } from '../../../domain/errors.js';
import type { StoredCoverPage } from '../../../domain/coverPage.js';
import type { CoverPageRepository } from '../../ports/cover-page/coverPageRepository.js';

type UpdateCoverPageInput = Partial<Omit<StoredCoverPage, 'id' | 'createdAt'>>;

export class UpdateCoverPageUseCase {
  constructor(private readonly coverPageRepository: CoverPageRepository) {}

  async execute(idInput: string, input: UpdateCoverPageInput): Promise<void> {
    const id = idInput?.trim();

    if (!id) {
      throw new ValidationError('Cover page id is required.');
    }

    if (input.name !== undefined && !input.name.trim()) {
      throw new ValidationError('Cover page name cannot be empty.');
    }

    if (input.type !== undefined && !['front', 'back'].includes(input.type)) {
      throw new ValidationError('Cover page type must be "front" or "back".');
    }

    await this.coverPageRepository.updateCoverPage(id, {
      ...input,
      updatedAt: new Date().toISOString(),
    });
  }
}
