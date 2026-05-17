import { ValidationError } from '../../../domain/errors.js';
import type { StoredCoverPage } from '../../../domain/coverPage.js';
import type { CoverPageRepository } from '../../ports/cover-page/coverPageRepository.js';

export class ListCoverPagesUseCase {
  constructor(private readonly coverPageRepository: CoverPageRepository) {}

  async execute(): Promise<StoredCoverPage[]> {
    return this.coverPageRepository.listCoverPages();
  }
}

export class GetCoverPageByIdUseCase {
  constructor(private readonly coverPageRepository: CoverPageRepository) {}

  async execute(idInput: string): Promise<StoredCoverPage> {
    const id = idInput?.trim();

    if (!id) {
      throw new ValidationError('Cover page id is required.');
    }

    return this.coverPageRepository.getCoverPageById(id);
  }
}
