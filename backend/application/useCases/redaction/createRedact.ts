import { v4 as uuidv4 } from 'uuid';
import { ValidationError } from '../../../domain/errors.js';
import type { StoredRedaction } from '../../../domain/redaction.js';
import type { DocumentRepository } from '../../ports/documents/documentRepository.js';
import type { RedactionRepository } from '../../ports/redactions/redactionRepository.js';

type CreateRedactionInput = Omit<
  StoredRedaction,
  'id' | 'createdAt' | 'updatedAt'
>;

export class CreateRedactionUseCase {
  constructor(
    private readonly documentRepository: DocumentRepository,
    private readonly redactionRepository: RedactionRepository
  ) {}

  async execute(input: CreateRedactionInput): Promise<StoredRedaction> {
    if (!input.bundleId?.trim()) {
      throw new ValidationError('Bundle id is required.');
    }

    if (!input.documentId?.trim()) {
      throw new ValidationError('Document id is required.');
    }

    if (!input.name?.trim()) {
      throw new ValidationError('Redaction name is required.');
    }

    const bundleName = await this.documentRepository.getBundleName(
      input.bundleId
    );

    if (!bundleName) {
      throw new ValidationError('Bundle not found.');
    }

    const now = new Date().toISOString();

    const redaction: StoredRedaction = {
      ...input,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };

    await this.redactionRepository.create(redaction);
    return redaction;
  }
}
