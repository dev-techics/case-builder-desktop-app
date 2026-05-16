import { PDFArray, PDFDict, PDFName, PDFNull, PDFNumber } from 'pdf-lib';
import type { ExportContext } from '../context/ExportContext.js';

/**
 * Walk every entry recorded by IndexPageGenerator and attach a PDF /Link
 * annotation that jumps to the matching document's start page.
 *
 * This must run AFTER assembleDocuments so that the assembled PDF's page
 * references are stable and the index page indices are correct.
 */
export async function injectIndexLinks(ctx: ExportContext): Promise<void> {
  ctx.currentStep = 'injectIndexLinks';
  ctx.onProgress?.({
    step: 'injectIndexLinks',
    progress: 0,
    message: 'Injecting index links…',
  });

  if (!ctx.assembledPdf) {
    throw new Error(
      '[injectIndexLinks] assembledPdf is missing — assembleDocuments must run first'
    );
  }

  if (!ctx.indexEntries?.length) {
    ctx.onProgress?.({ step: 'injectIndexLinks', progress: 100 });
    return;
  }

  const pdf = ctx.assembledPdf;
  const { context } = pdf;
  const metaById = new Map(ctx.documentMetadata.map(m => [m.documentId, m]));

  // In the assembled PDF, index pages start right after the cover page(s)
  const indexPageOffset = ctx.coverPageCount;

  for (let i = 0; i < ctx.indexEntries.length; i++) {
    const entry = ctx.indexEntries[i];
    const meta = metaById.get(entry.documentId);
    if (!meta) continue;

    const sourcePageIdx = indexPageOffset + entry.pageIndex;
    const targetPageIdx = meta.startPage - 1; // 1-indexed → 0-indexed

    if (
      sourcePageIdx < 0 ||
      sourcePageIdx >= pdf.getPageCount() ||
      targetPageIdx < 0 ||
      targetPageIdx >= pdf.getPageCount()
    ) {
      continue;
    }

    const sourcePage = pdf.getPage(sourcePageIdx);
    const targetPageRef = pdf.getPage(targetPageIdx).ref;

    const { x, y, width, height } = entry.rect;

    // Destination array: [pageRef /XYZ null null 0]
    // /XYZ with null arguments keeps the current zoom and jumps to page top
    const dest = PDFArray.withContext(context);
    dest.push(targetPageRef);
    dest.push(PDFName.of('XYZ'));
    dest.push(PDFNull);
    dest.push(PDFNull);
    dest.push(PDFNumber.of(0));

    // GoTo action
    const action = PDFDict.withContext(context);
    action.set(PDFName.of('S'), PDFName.of('GoTo'));
    action.set(PDFName.of('D'), dest);

    // Link annotation
    const annot = PDFDict.withContext(context);
    annot.set(PDFName.of('Type'), PDFName.of('Annot'));
    annot.set(PDFName.of('Subtype'), PDFName.of('Link'));
    annot.set(PDFName.of('Rect'), context.obj([x, y, x + width, y + height]));
    annot.set(PDFName.of('Border'), context.obj([0, 0, 0])); // invisible border
    annot.set(PDFName.of('A'), action);

    const annotRef = context.register(annot);

    // Append to the source page's /Annots array (create it if absent)
    const existing = sourcePage.node.get(PDFName.of('Annots'));
    if (existing instanceof PDFArray) {
      existing.push(annotRef);
    } else {
      sourcePage.node.set(PDFName.of('Annots'), context.obj([annotRef]));
    }

    ctx.onProgress?.({
      step: 'injectIndexLinks',
      progress: Math.round(((i + 1) / ctx.indexEntries.length) * 100),
    });
  }

  ctx.onProgress?.({
    step: 'injectIndexLinks',
    progress: 100,
    message: 'Links injected',
  });
}
