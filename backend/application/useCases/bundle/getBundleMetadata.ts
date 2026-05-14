import { ValidationError } from '../../../domain/errors.js';
import type { BundleMetadata } from '../../../domain/bundle.js';
import type { BundleRepository } from '../../ports/bundles/bundleRepository.js';

export class GetBundleMetadataUseCase {
  constructor(private readonly bundleRepository: BundleRepository) {}

  async execute(bundleId: string): Promise<BundleMetadata> {
    if (typeof bundleId !== 'string' || !bundleId.trim()) {
      throw new ValidationError('Bundle id is required.');
    }

    return this.bundleRepository.getMetadata(bundleId.trim());
  }
}
