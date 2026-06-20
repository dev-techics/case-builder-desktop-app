import { v4 as uuidv4 } from 'uuid';
import type { StoredDocument } from '../../../domain/document.js';
import { normalizeDocumentName } from '../../../domain/document.js';
import { ValidationError } from '../../../domain/errors.js';
import type { DocumentRepository } from '../../ports/documents/documentRepository.js';
import type { MergeDocumentProcessor } from '../../ports/documents/documentProcessor.js';
import type { DocumentStorage } from '../../ports/documents/documentStorage.js';

export type MergeDocumentsInput = {
  bundleId: string;
  documentIds: string[];
  name: string;
  parentId?: string | null;
};

export type MergeDocumentsResult = {
  document: {
    id: string;
    parentId: string | null;
    name: string;
    type: 'file';
  };
};

const ensurePdfName = (name: string) =>
  /\.pdf$/i.test(name) ? name : `${name}.pdf`;

const uniqueTrimmedIds = (ids: string[]) => {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const id of ids) {
    const trimmedId = id.trim();
    if (!trimmedId || seen.has(trimmedId)) {
      continue;
    }
    seen.add(trimmedId);
    normalized.push(trimmedId);
  }

  return normalized;
};

export class MergeDocumentsUseCase {
  constructor(
    private readonly documentRepository: DocumentRepository,
    private readonly documentStorage: DocumentStorage,
    private readonly mergeDocumentProcessor: MergeDocumentProcessor
  ) {}

  async execute(input: MergeDocumentsInput): Promise<MergeDocumentsResult> {
    const bundleId = input.bundleId?.trim();
    const documentIds = uniqueTrimmedIds(
      Array.isArray(input.documentIds) ? input.documentIds : []
    );
    const normalizedName = normalizeDocumentName(input.name);
    const name = ensurePdfName(normalizedName);

    if (!bundleId) {
      throw new ValidationError('Bundle id is required.');
    }
    if (documentIds.length < 2) {
      throw new ValidationError('At least 2 documents are required.');
    }
    if (!normalizedName) {
      throw new ValidationError('Merged document name is required.');
    }

    const bundleName = await this.documentRepository.getBundleName(bundleId);
    if (!bundleName) {
      throw new ValidationError('Bundle not found.');
    }

    const documents = await this.getMergeDocuments(bundleId, documentIds);
    const parentId = await this.resolveParentId(input.parentId, documents);
    const filePaths = await Promise.all(
      documents.map(document =>
        this.documentStorage.getFilePath(bundleId, document.id)
      )
    );

    const mergedDocumentId = uuidv4();
    const mergedBytes = await this.mergeDocumentProcessor.mergePdfs(filePaths);
    const storedFile = await this.documentStorage.writeBytes({
      bundleId,
      documentId: mergedDocumentId,
      fileName: name,
      bytes: mergedBytes,
    });

    const now = new Date().toISOString();
    const documentToCreate: StoredDocument = {
      id: mergedDocumentId,
      bundleId,
      parentId,
      name,
      type: 'file',
      mimeType: 'application/pdf',
      storagePath: storedFile.storagePath,
      order: await this.documentRepository.getNextOrder(bundleId, parentId),
      metadata: JSON.stringify({
        mergedFromDocumentIds: documentIds,
        mergedAt: now,
      }),
      createdAt: now,
      updatedAt: now,
    };

    let mergedDocumentCreated = false;
    try {
      await this.documentRepository.createMany([documentToCreate]);
      mergedDocumentCreated = true;
      await this.deleteSourceDocuments(documentIds);
    } catch (error) {
      if (mergedDocumentCreated) {
        await this.deleteDocumentAndStoredFiles(documentToCreate.id);
      } else {
        await this.documentStorage.deleteByStoragePath(storedFile.storagePath);
      }
      throw error;
    }

    return {
      document: {
        id: documentToCreate.id,
        parentId: documentToCreate.parentId,
        name: documentToCreate.name,
        type: 'file',
      },
    };
  }

  private async getMergeDocuments(bundleId: string, documentIds: string[]) {
    const documents = await Promise.all(
      documentIds.map(id => this.documentRepository.getById(id))
    );

    for (const document of documents) {
      if (!document || document.bundleId !== bundleId) {
        throw new ValidationError('Document not found.');
      }
      if (document.type !== 'file') {
        throw new ValidationError('Only files can be merged.');
      }
      if (!document.storagePath) {
        throw new ValidationError('Document file is missing.');
      }
    }

    return documents as StoredDocument[];
  }

  private async resolveParentId(
    requestedParentId: string | null | undefined,
    documents: StoredDocument[]
  ) {
    const parentId = requestedParentId?.trim() || null;

    if (parentId) {
      const parentDocument = await this.documentRepository.getById(parentId);
      if (!parentDocument || parentDocument.bundleId !== documents[0].bundleId) {
        throw new ValidationError('Parent folder not found.');
      }
      if (parentDocument.type !== 'folder') {
        throw new ValidationError('Merged document parent must be a folder.');
      }
    }

    if (documents.some(document => document.parentId !== parentId)) {
      throw new ValidationError('Documents must share the same folder.');
    }

    return parentId;
  }

  private async deleteSourceDocuments(documentIds: string[]) {
    for (const documentId of documentIds) {
      await this.deleteDocumentAndStoredFiles(documentId);
    }
  }

  private async deleteDocumentAndStoredFiles(documentId: string) {
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
