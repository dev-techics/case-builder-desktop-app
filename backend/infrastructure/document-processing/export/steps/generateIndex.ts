import type { ExportContext } from '../context/ExportContext.js';
import { IndexPageGenerator } from '../services/IndexPageGenerator.js';

export async function generateIndex(ctx: ExportContext): Promise<void> {
  ctx.currentStep = 'generateIndex';
  ctx.onProgress?.({ step: 'generateIndex', progress: 0, message: 'Generating index…' });

  const generator = new IndexPageGenerator();
  const { pdf, entries } = await generator.generate(ctx.documentMetadata);

  ctx.indexPdf = pdf;
  ctx.indexPageCount = pdf.getPageCount();
  ctx.indexEntries = entries;

  ctx.onProgress?.({ step: 'generateIndex', progress: 100, message: 'Index ready' });
}
