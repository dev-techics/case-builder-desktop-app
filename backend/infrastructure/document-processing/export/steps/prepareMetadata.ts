import type { ExportContext } from '../context/ExportContext.js';
import type { DocumentMetadata } from '../context/ExportTypes.js';
import { PdfAssembler } from '../services/PdfAssembler.js';
import { IndexPageGenerator } from '../services/IndexPageGenerator.js';

/**
 * Pass 1 — resolve page counts for every document in the bundle.
 * Pass 2 — calculate each document's 1-indexed start page in the final PDF,
 *           accounting for the cover page and estimated index page count.
 *
 * The index page estimate is deterministic (based purely on document count),
 * so the startPage values written here will match the assembled PDF exactly.
 */
export async function prepareMetadata(ctx: ExportContext): Promise<void> {
  ctx.currentStep = 'prepareMetadata';
  ctx.onProgress?.({
    step: 'prepareMetadata',
    progress: 0,
    message: 'Analysing documents…',
  });

  const assembler = new PdfAssembler();
  const { documents } = ctx.bundle;

  // ── Pass 1: collect page counts ───────────────────────────────────────────
  for (let i = 0; i < documents.length; i++) {
    const doc = documents[i];

    ctx.onProgress?.({
      step: 'prepareMetadata',
      progress: Math.round((i / documents.length) * 85),
      message: `Analysing: ${doc.name}`,
    });

    doc.pageCount = await assembler.getPageCount(doc.filePath);
  }

  // ── Pass 2: calculate 1-indexed start pages ───────────────────────────────
  const coverPages = (ctx.options.includeFrontCover ?? ctx.options.includeCover)
    ? 1
    : 0;
  const indexPages = ctx.options.includeIndex
    ? IndexPageGenerator.estimatePageCount(documents.length)
    : 0;

  let nextPage = 1 + coverPages + indexPages;
  const metadata: DocumentMetadata[] = [];

  for (const doc of documents) {
    metadata.push({
      documentId: doc.id,
      name: doc.name,
      startPage: nextPage,
      pageCount: doc.pageCount!,
    });
    nextPage += doc.pageCount!;
  }

  ctx.documentMetadata = metadata;
  ctx.onProgress?.({
    step: 'prepareMetadata',
    progress: 100,
    message: 'Metadata ready',
  });
}
