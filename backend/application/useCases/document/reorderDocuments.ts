import { ValidationError } from '../../../domain/errors.js';
import type {
  DocumentOrderUpdate,
  DocumentRepository,
} from '../../ports/documentRepository.js';

type ReorderDocumentsInput = {
  bundleId: string;
  items: DocumentOrderUpdate[];
};

export class ReorderDocumentsUseCase {
  constructor(private readonly documentRepository: DocumentRepository) {}

  async execute(input: ReorderDocumentsInput): Promise<void> {
    const bundleId = input.bundleId?.trim();

    if (!bundleId) {
      throw new ValidationError('Bundle id is required.');
    }

    const bundleName = await this.documentRepository.getBundleName(bundleId);

    if (!bundleName) {
      throw new ValidationError('Bundle not found.');
    }

    const rawItems = Array.isArray(input.items) ? input.items : [];

    if (rawItems.length === 0) {
      return;
    }

    const seenIds = new Set<string>();
    const seenOrders = new Set<number>();
    const normalizedItems: DocumentOrderUpdate[] = [];

    for (const item of rawItems) {
      const documentId = item?.id?.trim();

      if (!documentId) {
        throw new ValidationError('Document id is required.');
      }

      if (seenIds.has(documentId)) {
        throw new ValidationError('Duplicate document id in reorder payload.');
      }

      const order = item?.order;

      if (!Number.isInteger(order) || order < 0) {
        throw new ValidationError('Document order must be a non-negative integer.');
      }

      if (seenOrders.has(order)) {
        throw new ValidationError('Duplicate order in reorder payload.');
      }

      seenIds.add(documentId);
      seenOrders.add(order);
      normalizedItems.push({
        id: documentId,
        order,
      });
    }

    const documents = await Promise.all(
      normalizedItems.map(item => this.documentRepository.getById(item.id))
    );

    const parentId = documents[0]?.parentId ?? null;

    for (const document of documents) {
      if (!document || document.bundleId !== bundleId) {
        throw new ValidationError('Document not found.');
      }

      if (document.parentId !== parentId) {
        throw new ValidationError(
          'Documents must share the same parent to reorder.'
        );
      }
    }

    await this.documentRepository.reorder(bundleId, normalizedItems);
  }
}
