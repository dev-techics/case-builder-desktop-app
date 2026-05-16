import type { ExportContext } from '../context/ExportContext.js';
import { CoverPageGenerator } from '../services/CoverPageGenerator.js';

export async function generateBackCover(ctx: ExportContext): Promise<void> {
  ctx.currentStep = 'generateBackCover';
  ctx.onProgress?.({
    step: 'generateBackCover',
    progress: 0,
    message: 'Generating back cover page…',
  });

  const generator = new CoverPageGenerator();

  ctx.backCoverPdf = await generator.generatePlaceholder({
    title: ctx.bundle.name,
    subtitle: 'Generated placeholder back cover',
    createdAt: ctx.bundle.createdAt,
    documentCount: ctx.bundle.documents.length,
  });

  ctx.backCoverPageCount = ctx.backCoverPdf.getPageCount();

  ctx.onProgress?.({
    step: 'generateBackCover',
    progress: 100,
    message: 'Back cover ready',
  });
}
