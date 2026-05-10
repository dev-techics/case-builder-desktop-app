import { v4 as uuidv4 } from 'uuid';
import {
  normalizeDocumentName,
  type StoredDocument,
} from '../../../domain/document.js';
import { ValidationError } from '../../../domain/errors.js';
import type { DocumentRepository } from '../../ports/documents/documentRepository.js';

type CreateFolderInput = {
  bundleId: string;
  name: string;
  parentId?: string | null;
};

export class CreateFolderUseCase {
  constructor(private readonly documentRepository: DocumentRepository) {}

  async execute(input: CreateFolderInput): Promise<StoredDocument> {
    const bundleId = input.bundleId?.trim();

    if (!bundleId) {
      throw new ValidationError('Bundle id is required.');
    }

    if (typeof input.name !== 'string') {
      throw new ValidationError('Folder name must be a string.');
    }

    const normalizedName = normalizeDocumentName(input.name);

    if (!normalizedName) {
      throw new ValidationError('Folder name is required.');
    }

    const bundleName = await this.documentRepository.getBundleName(bundleId);

    if (!bundleName) {
      throw new ValidationError('Bundle not found.');
    }

    const parentId = input.parentId?.trim() || null;

    if (parentId) {
      const parentDocument = await this.documentRepository.getById(parentId);

      if (!parentDocument || parentDocument.bundleId !== bundleId) {
        throw new ValidationError('Parent folder not found.');
      }

      if (parentDocument.type !== 'folder') {
        throw new ValidationError(
          'Folders can only be created inside folders.'
        );
      }
    }

    const now = new Date().toISOString();
    const order = await this.documentRepository.getNextOrder(
      bundleId,
      parentId
    );
    const folder: StoredDocument = {
      id: uuidv4(),
      bundleId,
      parentId,
      name: normalizedName,
      type: 'folder',
      mimeType: null,
      storagePath: null,
      order,
      metadata: null,
      createdAt: now,
      updatedAt: now,
    };

    await this.documentRepository.createMany([folder]);

    return folder;
  }
}
