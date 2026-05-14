import type { BundleMetadata } from '../../../domain/bundle.js';
import { ValidationError } from '../../../domain/errors.js';
import type { BundleRepository } from '../../ports/bundles/bundleRepository.js';

type UpdateBundleMetadataInput = {
  bundleId: string;
  metadata?: Record<string, unknown> | null;
};

export class UpdateBundleMetadataUseCase {
  constructor(private readonly bundleRepository: BundleRepository) {}

  async execute(input: UpdateBundleMetadataInput): Promise<BundleMetadata> {
    if (typeof input?.bundleId !== 'string' || !input.bundleId.trim()) {
      throw new ValidationError('Bundle id is required.');
    }

    const metadata = input.metadata ?? {};
    if (!isPlainRecord(metadata)) {
      throw new ValidationError('Bundle metadata must be an object.');
    }

    return this.bundleRepository.updateMetadata(
      input.bundleId.trim(),
      normalizeMetadataPatch(metadata)
    );
  }
}

function normalizeMetadataPatch(
  metadata: Record<string, unknown>
): BundleMetadata {
  const patch: BundleMetadata = {};

  for (const [key, value] of Object.entries(metadata)) {
    if (key === 'headerLeft' || key === 'header_left') {
      patch.headerLeft = normalizeTextValue(
        value,
        'Bundle header left metadata must be a string.'
      );
      continue;
    }

    if (key === 'headerRight' || key === 'header_right') {
      patch.headerRight = normalizeTextValue(
        value,
        'Bundle header right metadata must be a string.'
      );
      continue;
    }

    if (key === 'footer') {
      patch.footer = normalizeTextValue(
        value,
        'Bundle footer metadata must be a string.'
      );
      continue;
    }

    patch[key] = value;
  }

  return patch;
}

function normalizeTextValue(value: unknown, errorMessage: string): string {
  if (value === undefined || value === null) {
    return '';
  }

  if (typeof value !== 'string') {
    throw new ValidationError(errorMessage);
  }

  return value.replace(/\r\n/g, '\n');
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
