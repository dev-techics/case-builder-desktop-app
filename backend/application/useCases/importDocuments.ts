import path from 'node:path';
import { v4 as uuidv4 } from 'uuid';
import { ValidationError } from '../../domain/errors.js';
import type { StoredDocument } from '../../domain/document.js';
import type { DocumentRepository } from '../ports/documentRepository.js';
import type { DocumentStorage } from '../ports/documentStorage.js';

export interface ImportableDocumentFile {
  name: string;
  path: string;
  mimeType?: string | null;
}

export interface ImportDocumentsInput {
  bundleId: string;
  parentId?: string | null;
  files: ImportableDocumentFile[];
}

export interface DocumentImportStatus {
  fileName: string;
  status: 'success' | 'failed';
  message?: string;
}

export interface ImportedDocumentResult {
  id: string;
  parentId: string | null;
  name: string;
  type: 'file';
}

export interface ImportDocumentsResult {
  documents: ImportedDocumentResult[];
  conversionStatuses?: DocumentImportStatus[];
}

const PDF_MIME_TYPES = new Set([
  'application/pdf',
  'application/x-pdf',
  'application/acrobat',
  'applications/vnd.pdf',
  'text/pdf',
  'text/x-pdf',
]);

const isPdfFile = (file: ImportableDocumentFile) => {
  const normalizedMimeType = file.mimeType?.trim().toLowerCase();
  if (normalizedMimeType && PDF_MIME_TYPES.has(normalizedMimeType)) {
    return true;
  }

  return path.extname(file.name).toLowerCase() === '.pdf';
};

export class ImportDocumentsUseCase {
  constructor(
    private readonly documentRepository: DocumentRepository,
    private readonly documentStorage: DocumentStorage
  ) {}

  async execute(input: ImportDocumentsInput): Promise<ImportDocumentsResult> {
    const bundleId = input.bundleId?.trim();
    if (!bundleId) {
      throw new ValidationError('Bundle id is required.');
    }

    const files = Array.isArray(input.files) ? input.files : [];
    if (files.length === 0) {
      throw new ValidationError('At least one file is required.');
    }

    const parentId = input.parentId?.trim() || null;
    if (parentId) {
      const parentDocument = await this.documentRepository.getById(parentId);
      if (!parentDocument || parentDocument.bundleId !== bundleId) {
        throw new ValidationError('Parent folder not found.');
      }
      if (parentDocument.type !== 'folder') {
        throw new ValidationError('Files can only be imported into folders.');
      }
    }

    const acceptedFiles: ImportableDocumentFile[] = [];
    const conversionStatuses: DocumentImportStatus[] = [];

    for (const file of files) {
      const fileName = typeof file?.name === 'string' ? file.name.trim() : '';
      const filePath = typeof file?.path === 'string' ? file.path.trim() : '';

      if (!fileName || !filePath) {
        conversionStatuses.push({
          fileName: fileName || 'Unknown file',
          status: 'failed',
          message: 'Invalid file payload.',
        });
        continue;
      }

      if (!isPdfFile(file)) {
        conversionStatuses.push({
          fileName,
          status: 'failed',
          message: 'Desktop import currently supports PDF files only.',
        });
        continue;
      }

      acceptedFiles.push({
        name: fileName,
        path: filePath,
        mimeType: file.mimeType ?? 'application/pdf',
      });
    }

    if (acceptedFiles.length === 0) {
      return {
        documents: [],
        conversionStatuses:
          conversionStatuses.length > 0 ? conversionStatuses : undefined,
      };
    }

    const now = new Date().toISOString();
    const nextOrder = await this.documentRepository.getNextOrder(
      bundleId,
      parentId
    );
    const copiedStoragePaths: string[] = [];
    const documentsToCreate: StoredDocument[] = [];

    try {
      for (const [index, file] of acceptedFiles.entries()) {
        const id = uuidv4();
        const storedFile = await this.documentStorage.copyFromPath({
          bundleId,
          documentId: id,
          sourcePath: file.path,
          originalName: file.name,
        });

        copiedStoragePaths.push(storedFile.storagePath);

        documentsToCreate.push({
          id,
          bundleId,
          parentId,
          name: file.name,
          type: 'file',
          mimeType: file.mimeType ?? 'application/pdf',
          storagePath: storedFile.storagePath,
          order: nextOrder + index,
          metadata: null,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        });
      }

      await this.documentRepository.createMany(documentsToCreate);
    } catch (error) {
      await Promise.all(
        copiedStoragePaths.map(storagePath =>
          this.documentStorage.deleteByStoragePath(storagePath)
        )
      );
      throw error;
    }

    return {
      documents: documentsToCreate.map(document => ({
        id: document.id,
        parentId: document.parentId,
        name: document.name,
        type: 'file',
      })),
      conversionStatuses:
        conversionStatuses.length > 0 ? conversionStatuses : undefined,
    };
  }
}

