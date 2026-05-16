import type { BundleRepository } from '../../../application/ports/bundles/bundleRepository.js';
import type {
  ExportBundleRequest,
  ExportBundleResult,
  ExportService,
} from '../../../application/ports/export/exportService.js';
import type { HighlightRepository } from '../../../application/ports/highlights/highlightRepository.js';
import type { RedactionRepository } from '../../../application/ports/redactions/redactionRepository.js';
import { ValidationError } from '../../../domain/errors.js';
import type { PdfCompressor } from '../compression/pdfCompressor.js';
import { createExportContext } from './context/createExportContext.js';
import { ExportPipeline } from './ExportPipeline.js';
import { buildExportBundle } from './buildExportBundle.js';

type BundleExportServiceDependencies = {
  bundleRepository: BundleRepository;
  documentRepository: {
    listByBundle(bundleId: string): Promise<import('../../../domain/document.js').StoredDocument[]>;
  };
  highlightRepository: HighlightRepository;
  redactionRepository: RedactionRepository;
  documentsStorageRoot: string;
  pdfCompressor: PdfCompressor;
};

export class BundleExportService implements ExportService {
  constructor(private readonly deps: BundleExportServiceDependencies) {}

  async exportBundle(
    input: ExportBundleRequest
  ): Promise<ExportBundleResult> {
    const bundle = await this.deps.bundleRepository.getById(input.bundleId);
    if (!bundle) {
      throw new ValidationError('Bundle not found.');
    }

    const [bundleMetadata, storedDocuments, highlights, redactions] =
      await Promise.all([
        this.deps.bundleRepository.getMetadata(bundle.id),
        this.deps.documentRepository.listByBundle(bundle.id),
        this.deps.highlightRepository.listByBundle(bundle.id),
        this.deps.redactionRepository.listByBundle(bundle.id),
      ]);

    const exportBundle = buildExportBundle({
      bundle,
      storedDocuments,
      highlights,
      redactions,
      documentsStorageRoot: this.deps.documentsStorageRoot,
    });

    if (exportBundle.documents.length === 0) {
      throw new ValidationError('Bundle has no PDF documents to export.');
    }

    const includeFrontCover = Boolean(
      input.includeFrontCover ?? input.includeCover
    );
    const includeBackCover = Boolean(input.includeBackCover);
    const includeIndex = input.includeIndex ?? true;

    const ctx = createExportContext(
      exportBundle,
      {
        outputPath: input.outputPath,
        includeCover: input.includeCover,
        includeFrontCover,
        includeBackCover,
        includeIndex,
        applyAnnotations: true,
        applyPageDecorations: true,
        injectIndexLinks: includeIndex,
        compress: input.compress ?? false,
      },
      undefined,
      {
        pageDecoration: {
          headerLeft:
            typeof bundleMetadata.headerLeft === 'string'
              ? bundleMetadata.headerLeft
              : '',
          headerRight:
            typeof bundleMetadata.headerRight === 'string'
              ? bundleMetadata.headerRight
              : '',
          footer:
            typeof bundleMetadata.footer === 'string'
              ? bundleMetadata.footer
              : '',
          showPageNumbers: true,
        },
        pdfCompressor: this.deps.pdfCompressor,
      }
    );

    const pipeline = new ExportPipeline();
    await pipeline.run(ctx);

    return {
      outputPath: ctx.outputPath ?? input.outputPath,
      pageCount: ctx.assembledPdf?.getPageCount() ?? 0,
    };
  }
}
