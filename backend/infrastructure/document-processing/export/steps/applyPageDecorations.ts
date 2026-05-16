import type { ExportContext } from '../context/ExportContext.js';
import { PageDecorationService } from '../services/PageDecorationService.js';

export async function applyPageDecorations(
  ctx: ExportContext
): Promise<void> {
  ctx.currentStep = 'applyPageDecorations';
  ctx.onProgress?.({
    step: 'applyPageDecorations',
    progress: 0,
    message: 'Applying page decorations…',
  });

  if (!ctx.assembledPdf) {
    throw new Error(
      '[applyPageDecorations] assembledPdf is missing — assembleDocuments must run first'
    );
  }

  const service = new PageDecorationService();
  await service.applyAll(ctx.assembledPdf, {
    decoration: ctx.pageDecoration,
    skipLeadingPages: ctx.coverPageCount,
    skipTrailingPages: ctx.backCoverPageCount,
  });

  ctx.onProgress?.({
    step: 'applyPageDecorations',
    progress: 100,
    message: 'Page decorations applied',
  });
}
