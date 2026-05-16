import { PDFDocument, PDFPage, rgb } from 'pdf-lib';
import type {
  Annotation,
  DocumentMetadata,
  ExportDocument,
} from '../context/ExportTypes.js';

export class AnnotationService {
  /**
   * Apply all annotations from every document onto the assembled PDF.
   *
   * `metadata` provides the page offset of each document in the assembled PDF
   * so that annotation coordinates can be mapped to the correct global page.
   */
  async applyAll(
    pdf: PDFDocument,
    documents: ExportDocument[],
    metadata: DocumentMetadata[]
  ): Promise<void> {
    const metaById = new Map(metadata.map(m => [m.documentId, m]));

    for (const doc of documents) {
      if (!doc.annotations.length) continue;

      const meta = metaById.get(doc.id);
      if (!meta) {
        console.warn(
          `[AnnotationService] No metadata found for document "${doc.name}" — skipping`
        );
        continue;
      }

      for (const annotation of doc.annotations) {
        // Convert the per-document page index to a global page index (0-indexed)
        const globalPage = meta.startPage - 1 + annotation.rect.page;

        if (globalPage < 0 || globalPage >= pdf.getPageCount()) {
          console.warn(
            `[AnnotationService] Page ${globalPage} is out of range for "${doc.name}" — skipping annotation ${annotation.id}`
          );
          continue;
        }

        const page = pdf.getPage(globalPage);

        switch (annotation.type) {
          case 'highlight':
            this.drawHighlight(page, annotation);
            break;
          case 'redaction':
            this.drawRedaction(page, annotation);
            break;
        }
      }
    }
  }

  // ── Private drawing helpers ────────────────────────────────────────────────

  private drawHighlight(page: PDFPage, annotation: Annotation): void {
    const { x, y, width, height } = annotation.rect;
    page.drawRectangle({
      x,
      y,
      width,
      height,
      color: this.hexToRgb(annotation.color ?? '#FFFF00'),
      opacity: this.normalizeOpacity(annotation.opacity, 0.35),
    });
  }

  private drawRedaction(page: PDFPage, annotation: Annotation): void {
    const { x, y, width, height } = annotation.rect;
    // Solid black — fully covers the underlying content
    page.drawRectangle({
      x,
      y,
      width,
      height,
      color: this.hexToRgb(annotation.color ?? '#000000'),
      opacity: this.normalizeOpacity(annotation.opacity, 1),
    });
  }

  private hexToRgb(hex: string): ReturnType<typeof rgb> {
    const clean = hex.replace('#', '').padEnd(6, '0');
    return rgb(
      parseInt(clean.slice(0, 2), 16) / 255,
      parseInt(clean.slice(2, 4), 16) / 255,
      parseInt(clean.slice(4, 6), 16) / 255
    );
  }

  private normalizeOpacity(value: number | undefined, fallback: number): number {
    return typeof value === 'number' && value >= 0 && value <= 1
      ? value
      : fallback;
  }
}
