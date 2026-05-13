import { ValidationError } from '../../../domain/errors.js';
import type { StoredRedaction } from '../../../domain/redaction.js';
import type { DocumentRepository } from '../../ports/documents/documentRepository.js';
import type { RedactionRepository } from '../../ports/redactions/redactionRepository.js';

export class ListBundleRedactionsUseCase {
  constructor(
    private readonly documentRepository: DocumentRepository,
    private readonly redactionRepository: RedactionRepository
  ) {}

  async execute(bundleIdInput: string): Promise<StoredRedaction[]> {
    const bundleId = bundleIdInput?.trim();

    if (!bundleId) {
      throw new ValidationError('Bundle id is required.');
    }

    const bundleName = await this.documentRepository.getBundleName(bundleId);

    if (!bundleName) {
      throw new ValidationError('Bundle not found.');
    }

    return this.redactionRepository.listByBundle(bundleId);
  }
}
