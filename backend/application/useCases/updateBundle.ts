import {
  isBundleStatus,
  normalizeBundleName,
  type Bundle,
  type BundleStatus,
} from '../../domain/bundle.js';
import { ValidationError } from '../../domain/errors.js';
import type {
  BundleRepository,
  BundleUpdates,
} from '../ports/bundleRepository.js';

type UpdateBundlePayload = {
  id: string;
  name?: string | undefined;
  status?: BundleStatus | undefined;
};

export class UpdateBundleUseCase {
  constructor(private readonly bundleRepository: BundleRepository) {}

  async execute({ id, name, status }: UpdateBundlePayload): Promise<Bundle> {
    if (typeof id !== 'string' || !id.trim()) {
      throw new ValidationError('Bundle id is required.');
    }

    if (name === undefined && status === undefined) {
      throw new ValidationError('At least one bundle update is required.');
    }

    const updates: BundleUpdates = {};

    if (name !== undefined) {
      if (typeof name !== 'string') {
        throw new ValidationError('Bundle name must be a string.');
      }

      const normalizedName = normalizeBundleName(name);
      if (!normalizedName) {
        throw new ValidationError('Bundle name is required.');
      }

      updates.name = normalizedName;
    }

    if (status !== undefined) {
      if (!isBundleStatus(status)) {
        throw new ValidationError('Bundle status is invalid.');
      }

      updates.status = status;
    }

    return this.bundleRepository.update(id.trim(), updates);
  }
}
