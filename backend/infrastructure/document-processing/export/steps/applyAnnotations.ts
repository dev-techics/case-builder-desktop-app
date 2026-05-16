import type { ExportContext } from '../context/ExportContext.js';
import { AnnotationService } from '../services/AnnotationService.js';

export async function applyAnnotations(ctx: ExportContext): Promise<void> {
  ctx.currentStep = 'applyAnnotations';
  ctx.onProgress?.({
    step: 'applyAnnotations',
    progress: 0,
    message: 'Applying annotations…',
  });

  if (!ctx.assembledPdf) {
    throw new Error(
      '[applyAnnotations] assembledPdf is missing — assembleDocuments must run first'
    );
  }

  const service = new AnnotationService();
  await service.applyAll(
    ctx.assembledPdf,
    ctx.bundle.documents,
    ctx.documentMetadata
  );

  ctx.onProgress?.({
    step: 'applyAnnotations',
    progress: 100,
    message: 'Annotations applied',
  });
}
