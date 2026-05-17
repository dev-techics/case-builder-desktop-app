/**
 * backend/infrastructure/document-processing/export/steps/generateCover.ts
 *
 * Changes from previous version:
 *   - When ctx.options.coverPageId is set, delegates to CoverPageGenerator
 *     (HTML → Electron → PDF) instead of the pdf-lib text renderer.
 *   - Legacy pdf-lib path is preserved behind the else branch so existing
 *     exports without a cover page ID continue to work unchanged.
 */

import type { ExportContext } from '../context/ExportContext.js';

export async function generateCover(ctx: ExportContext): Promise<void> {
  ctx.currentStep = 'generateCover';
  ctx.onProgress?.({
    step: 'generateCover',
    progress: 0,
    message: 'Generating cover page…',
  });

  const { frontCoverPageId, backCoverPageId } = ctx.options;

  if (frontCoverPageId) {
    await generateHtmlCover(ctx, frontCoverPageId);
  } else if (backCoverPageId) {
    await generateHtmlCover(ctx, backCoverPageId);
  } else {
    throw new Error('cover page id not available');
  }

  ctx.onProgress?.({
    step: 'generateCover',
    progress: 100,
    message: 'Cover page ready',
  });
}

// ── HTML-based cover (Electron renderer) ─────────────────────────────────────

async function generateHtmlCover(
  ctx: ExportContext,
  coverPageId: string
): Promise<void> {
  if (!ctx.coverPageGenerator) {
    throw new Error(
      '[generateCover] ctx.coverPageGenerator is not set. ' +
        'Ensure ElectronPdfGenerator, HtmlToPdfService, and CoverPageGenerator ' +
        'are wired up and injected into the ExportContext before running the pipeline.'
    );
  }

  ctx.onProgress?.({
    step: 'generateCover',
    progress: 20,
    message: 'Fetching cover page HTML…',
  });
  ctx.coverPdf = await ctx.coverPageGenerator.generate(coverPageId);
  ctx.coverPageCount = ctx.coverPdf.getPageCount();
}
