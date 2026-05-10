import { ValidationError } from '../../../domain/errors.js';
import type { StoredDocument } from '../../../domain/document.js';
import type { DocumentRepository } from '../../ports/documents/documentRepository.js';

type MoveDocumentInput = {
  documentId: string;
  newParentId?: string | null;
};

export class MoveDocumentUseCase {
  constructor(private readonly documentRepository: DocumentRepository) {}

  async execute(input: MoveDocumentInput): Promise<StoredDocument> {
    /* --------------- Input validation ----------------*/
    const documentId = input.documentId?.trim();

    if (!documentId) {
      throw new ValidationError('Document id is required.');
    }

    const document = await this.documentRepository.getById(documentId);

    if (!document) {
      throw new ValidationError('Document not found.');
    }

    const newParentId = input.newParentId?.trim() || null;

    if (newParentId === document.id) {
      throw new ValidationError('A document cannot be moved into itself.');
    }

    if (newParentId === document.parentId) {
      return document;
    }

    if (newParentId) {
      const parentDocument = await this.documentRepository.getById(newParentId);

      if (!parentDocument || parentDocument.bundleId !== document.bundleId) {
        throw new ValidationError('Parent folder not found.');
      }

      if (parentDocument.type !== 'folder') {
        throw new ValidationError('Documents can only be moved into folders.');
      }

      if (document.type === 'folder') {
        const documents = await this.documentRepository.listByBundle(
          document.bundleId
        );
        const documentsById = new Map(documents.map(item => [item.id, item]));

        let cursorId: string | null = newParentId;

        while (cursorId) {
          if (cursorId === document.id) {
            throw new ValidationError(
              'A folder cannot be moved into its own descendant.'
            );
          }

          cursorId = documentsById.get(cursorId)?.parentId ?? null;
        }
      }
    }

    const order = await this.documentRepository.getNextOrder(
      document.bundleId,
      newParentId
    );

    return this.documentRepository.move(document.id, newParentId, order);
  }
}
