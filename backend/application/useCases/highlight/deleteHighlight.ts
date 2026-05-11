import { ValidationError } from '../../../domain/errors.js';
import type { StoredHighlight } from '../../../domain/highlight.js';
import type { HighlightRepository } from '../../ports/highlights/highlightRepository.js';

export class DeleteHighlightUseCase {
  constructor(private readonly highlightRepository: HighlightRepository) {}

  async execute(idInput: string): Promise<StoredHighlight> {
    const id = idInput?.trim();

    if (!id) {
      throw new ValidationError('Highlight id is required.');
    }

    const deletedHighlight = await this.highlightRepository.delete(id);

    if (!deletedHighlight) {
      throw new ValidationError('Highlight not found.');
    }

    return deletedHighlight;
  }
}
