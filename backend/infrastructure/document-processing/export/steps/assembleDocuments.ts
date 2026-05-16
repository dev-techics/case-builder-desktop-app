import type { PDFDocument } from 'pdf-lib';
import type { ExportContext } from '../context/ExportContext.js';
import { PdfAssembler } from '../services/PdfAssembler.js';

/**
 * Merge everything into a single PDFDocument in the correct order:
 *   [cover?] [index?] [doc1] [doc2] … [docN]
 *
 * The result is stored in ctx.assembledPdf. All subsequent steps mutate
 * that same object — no re-merging is needed.
 */
export async function assembleDocuments(ctx: ExportContext): Promise<void> {
  ctx.currentStep = 'assembleDocuments';
  ctx.onProgress?.({
    step: 'assembleDocuments',
    progress: 0,
    message: 'Assembling documents…',
  });

  const assembler = new PdfAssembler();
  const parts: PDFDocument[] = [];

  if (ctx.coverPdf) parts.push(ctx.coverPdf);
  if (ctx.indexPdf) parts.push(ctx.indexPdf);

  const { documents } = ctx.bundle;

  for (let i = 0; i < documents.length; i++) {
    ctx.onProgress?.({
      step: 'assembleDocuments',
      progress: Math.round((i / documents.length) * 95),
      message: `Adding: ${documents[i].name}`,
    });

    parts.push(await assembler.documentToPdf(documents[i]));
  }

  if (ctx.backCoverPdf) {
    parts.push(ctx.backCoverPdf);
  }

  ctx.assembledPdf = await assembler.mergePdfs(parts);

  ctx.onProgress?.({
    step: 'assembleDocuments',
    progress: 100,
    message: 'Assembly complete',
  });
}
