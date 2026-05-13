import { ValidationError } from '../../../domain/errors.js';
import type { StoredRedaction } from '../../../domain/redaction.js';
import type { RedactionRepository } from '../../ports/redactions/redactionRepository.js';

export class DeleteRedactionUseCase {
  constructor(private readonly redactionRepository: RedactionRepository) {}

  async execute(idInput: string): Promise<StoredRedaction> {
    const id = idInput?.trim();

    if (!id) {
      throw new ValidationError('Redaction id is required.');
    }

    const redaction = await this.redactionRepository.delete(id);

    if (!redaction) {
      throw new ValidationError('Redaction not found.');
    }

    return redaction;
  }
}
