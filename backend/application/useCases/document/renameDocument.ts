import {
  normalizeDocumentName,
  type StoredDocument,
} from '../../../domain/document.js';
import { ValidationError } from '../../../domain/errors.js';
import type { DocumentRepository } from '../../ports/documentRepository.js';

type RenameDocumentPayload = {
  id: string;
  name: string;
};

export class RenameDocumentUseCase {
  constructor(private readonly documentRepository: DocumentRepository) {}

  async execute({
    id,
    name,
  }: RenameDocumentPayload): Promise<StoredDocument> {
    if (typeof id !== 'string' || !id.trim()) {
      throw new ValidationError('Document id is required.');
    }

    if (typeof name !== 'string') {
      throw new ValidationError('Document name must be a string.');
    }

    const normalizedName = normalizeDocumentName(name);

    if (!normalizedName) {
      throw new ValidationError('Document name is required.');
    }

    const existingDocument = await this.documentRepository.getById(id.trim());

    if (!existingDocument) {
      throw new ValidationError('Document not found.');
    }

    return this.documentRepository.rename(id.trim(), normalizedName);
  }
}
