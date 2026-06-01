import path from 'node:path';
import { v4 as uuidv4 } from 'uuid';
import { ValidationError } from '../../../domain/errors.js';
import type { StoredDocument } from '../../../domain/document.js';
import type { DocumentRepository } from '../../ports/documents/documentRepository.js';
import type {
  DocumentProcessor,
  DocumentImportStatus,
  PreparedImportDocument,
} from '../../ports/documents/documentProcessor.js';
import type { DocumentStorage } from '../../ports/documents/documentStorage.js';

/*--------------------------- Types and Interfaces ----------------------------*/
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

type ValidatedImportDocumentsInput = {
  bundleId: string;
  parentId: string | null;
  files: ImportableDocumentFile[];
};

type ValidatedImportFile = {
  name: string;
  path: string;
  mimeType: string | null;
};

type ImportFileValidationResult =
  | {
      isValid: true;
      file: ValidatedImportFile;
    }
  | {
      isValid: false;
      status: DocumentImportStatus;
    };

const PDF_MIME_TYPES = new Set([
  'application/pdf',
  'application/x-pdf',
  'application/acrobat',
  'applications/vnd.pdf',
  'text/pdf',
  'text/x-pdf',
]);

/*--------------------------- Validation and Utility Functions ----------------------------*/
const isPdfFile = (file: ImportableDocumentFile) => {
  const normalizedMimeType =
    typeof file.mimeType === 'string' ? file.mimeType.trim().toLowerCase() : '';

  if (normalizedMimeType && PDF_MIME_TYPES.has(normalizedMimeType)) {
    return true;
  }

  return path.extname(file.name).toLowerCase() === '.pdf';
};

const getTrimmedString = (value: unknown) =>
  typeof value === 'string' ? value.trim() : '';

const normalizeMimeType = (mimeType: unknown) => {
  const normalizedMimeType = getTrimmedString(mimeType);

  return normalizedMimeType || null;
};

const validateImportFile = (
  file: Partial<ImportableDocumentFile> | null | undefined
): ImportFileValidationResult => {
  const fileName = getTrimmedString(file?.name);
  const filePath = getTrimmedString(file?.path);

  if (!fileName || !filePath) {
    return {
      isValid: false,
      status: {
        fileName: fileName || 'Unknown file',
        status: 'failed',
        message: 'Invalid file payload.',
      },
    };
  }

  return {
    isValid: true,
    file: {
      name: fileName,
      path: filePath,
      mimeType: normalizeMimeType(file?.mimeType),
    },
  };
};

export class ImportDocumentsUseCase {
  constructor(
    private readonly documentRepository: DocumentRepository,
    private readonly documentStorage: DocumentStorage,
    private readonly documentImportPreprocessor?: DocumentProcessor
  ) {}

  async execute(input: ImportDocumentsInput): Promise<ImportDocumentsResult> {
    /* ------------ Validate inputs ---------------- */
    const { bundleId, parentId, files } = await this.validateInput(input);

    /* ------------ Validate inputs ends ---------------- */

    const acceptedFiles: PreparedImportDocument[] = [];
    const conversionStatuses: DocumentImportStatus[] = [];
    const preparedFilesToCleanup: PreparedImportDocument[] = [];
    const copiedStoragePaths: string[] = [];

    try {
      for (const file of files) {
        const fileValidation = validateImportFile(file);

        if (!fileValidation.isValid) {
          conversionStatuses.push(fileValidation.status);
          continue;
        }

        const validatedFile = fileValidation.file;

        if (this.documentImportPreprocessor) {
          const preparedResult =
            await this.documentImportPreprocessor.preprocess({
              name: validatedFile.name,
              path: validatedFile.path,
              mimeType: validatedFile.mimeType,
            });

          if (preparedResult.status) {
            conversionStatuses.push(preparedResult.status);
          }

          if (!preparedResult.document) {
            continue;
          }

          acceptedFiles.push(preparedResult.document);
          preparedFilesToCleanup.push(preparedResult.document);
          continue;
        }

        if (!isPdfFile(validatedFile)) {
          conversionStatuses.push({
            fileName: validatedFile.name,
            status: 'failed',
            message: 'Desktop import currently supports PDF files only.',
          });
          continue;
        }

        acceptedFiles.push({
          name: validatedFile.name,
          path: validatedFile.path,
          mimeType: validatedFile.mimeType ?? 'application/pdf',
          cleanup: async () => {},
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
      const documentsToCreate: StoredDocument[] = [];

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
        });
      }

      await this.documentRepository.createMany(documentsToCreate);

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
    } catch (error) {
      await Promise.all(
        copiedStoragePaths.map(storagePath =>
          this.documentStorage.deleteByStoragePath(storagePath)
        )
      );
      throw error;
    } finally {
      await Promise.all(
        preparedFilesToCleanup.map(file => file.cleanup().catch(() => {}))
      );
    }
  }
  /* ------------ Private helper methods ---------------- */
  private async validateInput(
    input: ImportDocumentsInput
  ): Promise<ValidatedImportDocumentsInput> {
    const bundleId = getTrimmedString(input.bundleId);
    const files = Array.isArray(input.files) ? input.files : [];
    const parentId = getTrimmedString(input.parentId) || null;

    if (!bundleId) {
      throw new ValidationError('Bundle id is required.');
    }

    if (!files.length) {
      throw new ValidationError('At least one file is required.');
    }

    const bundleName = await this.documentRepository.getBundleName(bundleId);

    if (!bundleName) {
      throw new ValidationError('Bundle not found.');
    }

    if (parentId) {
      const parentDocument = await this.documentRepository.getById(parentId);

      if (parentDocument?.bundleId !== bundleId) {
        throw new ValidationError('Parent folder not found.');
      }

      if (parentDocument.type !== 'folder') {
        throw new ValidationError('Files can only be imported into folders.');
      }
    }

    return { bundleId, parentId, files };
  }
}
