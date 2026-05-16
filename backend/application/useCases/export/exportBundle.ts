import { ValidationError } from '../../../domain/errors.js';
import type {
  ExportBundleRequest,
  ExportBundleResult,
  ExportService,
} from '../../ports/export/exportService.js';

export class ExportBundleUseCase {
  constructor(private readonly exportService: ExportService) {}

  async execute(input: ExportBundleRequest): Promise<ExportBundleResult> {
    const bundleId = input.bundleId?.trim();
    if (!bundleId) {
      throw new ValidationError('Bundle id is required.');
    }

    const outputPath = input.outputPath?.trim();
    if (!outputPath) {
      throw new ValidationError('Export output path is required.');
    }

    return this.exportService.exportBundle({
      ...input,
      bundleId,
      outputPath,
    });
  }
}
