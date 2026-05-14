import { ValidationError } from '../../../domain/errors.js';
import type { ExportService } from '../../ports/export/exportService.js';

export class ExportBundleUseCase {
  constructor(private readonly exportService: ExportService) {}

  async execute(bundleId: string): Promise<void> {
    if (typeof bundleId !== 'string' || !bundleId.trim()) {
      throw new ValidationError('Bundle id is required.');
    }

    await this.exportService.exportBundle(bundleId.trim());
  }
}
