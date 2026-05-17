import { ValidationError } from '../../../domain/errors.js';
import type { CoverPageRepository } from '../../ports/cover-page/coverPageRepository.js';

export class DeleteCoverPageUseCase {
  constructor(private readonly coverPageRepository: CoverPageRepository) {}

  async execute(idInput: string): Promise<void> {
    const id = idInput?.trim();

    if (!id) {
      throw new ValidationError('Cover page id is required.');
    }

    await this.coverPageRepository.deleteCoverPage(id);
  }
}
