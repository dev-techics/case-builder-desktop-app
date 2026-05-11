import { ValidationError } from '../../../domain/errors.js';
import type { StoredHighlight } from '../../../domain/highlight.js';
import type { DocumentRepository } from '../../ports/documents/documentRepository.js';
import type { HighlightRepository } from '../../ports/highlights/highlightRepository.js';

export class ListBundleHighlightsUseCase {
  constructor(
    private readonly documentRepository: DocumentRepository,
    private readonly highlightRepository: HighlightRepository
  ) {}

  async execute(bundleIdInput: string): Promise<StoredHighlight[]> {
    const bundleId = bundleIdInput?.trim();

    if (!bundleId) {
      throw new ValidationError('Bundle id is required.');
    }

    const bundleName = await this.documentRepository.getBundleName(bundleId);

    if (!bundleName) {
      throw new ValidationError('Bundle not found.');
    }

    return this.highlightRepository.listByBundle(bundleId);
  }
}
