import type { ExportContext } from '../context/ExportContext.js';
import { CoverPageGenerator } from '../services/CoverPageGenerator.js';

export async function generateCover(ctx: ExportContext): Promise<void> {
  ctx.currentStep = 'generateCover';
  ctx.onProgress?.({
    step: 'generateCover',
    progress: 0,
    message: 'Generating front cover page…',
  });

  const generator = new CoverPageGenerator();

  ctx.coverPdf = await generator.generatePlaceholder({
    title: ctx.bundle.name,
    subtitle: 'Generated placeholder front cover',
    createdAt: ctx.bundle.createdAt,
    documentCount: ctx.bundle.documents.length,
  });

  ctx.coverPageCount = ctx.coverPdf.getPageCount();

  ctx.onProgress?.({
    step: 'generateCover',
    progress: 100,
    message: 'Front cover ready',
  });
}
