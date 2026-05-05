import { ValidationError } from '../../domain/errors.js';
import type { BundleRepository } from '../ports/bundleRepository.js';
import type { DocumentStorage } from '../ports/documentStorage.js';

export class DeleteBundleUseCase {
  constructor(
    private readonly bundleRepository: BundleRepository,
    private readonly documentStorage: DocumentStorage
  ) {}

  async execute(id: string): Promise<void> {
    if (typeof id !== 'string' || !id.trim()) {
      throw new ValidationError('Bundle id is required.');
    }

    const bundleId = id.trim();

    await this.bundleRepository.delete(bundleId);
    await this.documentStorage.deleteBundleStorage(bundleId);
  }
}
