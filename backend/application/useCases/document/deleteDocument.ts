import { ValidationError } from '../../../domain/errors.js';
import type { DocumentRepository } from '../../ports/documentRepository.js';
import type { DocumentStorage } from '../../ports/documentStorage.js';

export class DeleteDocumentUseCase {
  constructor(
    private readonly documentRepository: DocumentRepository,
    private readonly documentStorage: DocumentStorage
  ) {}

  async execute(idInput: string): Promise<void> {
    const documentId = idInput?.trim();

    if (!documentId) {
      throw new ValidationError('Document id is required.');
    }

    const deletedDocuments = await this.documentRepository.delete(documentId);
    const storagePaths = deletedDocuments
      .map(document => document.storagePath)
      .filter((storagePath): storagePath is string => Boolean(storagePath));

    await Promise.all(
      storagePaths.map(storagePath =>
        this.documentStorage.deleteByStoragePath(storagePath)
      )
    );
  }
}
