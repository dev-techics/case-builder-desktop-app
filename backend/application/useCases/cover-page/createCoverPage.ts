import { v4 as uuidv4 } from 'uuid';
import { ValidationError } from '../../../domain/errors.js';
import type { StoredCoverPage } from '../../../domain/coverPage.js';
import type { CoverPageRepository } from '../../ports/cover-page/coverPageRepository.js';

type CreateCoverPageInput = Omit<
  StoredCoverPage,
  'id' | 'createdAt' | 'updatedAt'
>;

export class CreateCoverPageUseCase {
  constructor(private readonly coverPageRepository: CoverPageRepository) {}

  async execute(input: CreateCoverPageInput): Promise<StoredCoverPage> {
    if (!input.name?.trim()) {
      throw new ValidationError('Cover page name is required.');
    }

    if (!input.type || !['front', 'back'].includes(input.type)) {
      throw new ValidationError('Cover page type must be "front" or "back".');
    }

    const now = new Date().toISOString();

    const coverPage: StoredCoverPage = {
      ...input,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };

    await this.coverPageRepository.createCoverPage(coverPage);
    return coverPage;
  }
}
