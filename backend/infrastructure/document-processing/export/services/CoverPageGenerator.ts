/**
 * backend/infrastructure/document-processing/export/services/CoverPageGenerator.ts
 *
 * Replaces the previous pdf-lib cover page generator.
 *
 * Flow:
 *   1. Receive a coverPageId
 *   2. Fetch the stored HTML from SQLite via CoverPageRepository
 *   3. Pass the HTML to HtmlToPdfService (which delegates to ElectronPdfGenerator)
 *   4. Receive the rendered PDF as a Buffer
 *   5. Load the Buffer into a pdf-lib PDFDocument so it fits the existing
 *      pipeline interface (ctx.coverPdf is always a PDFDocument)
 */

import { PDFDocument } from 'pdf-lib';
import type { CoverPageRepository } from '../../../../application/ports/cover-page/coverPageRepository.js';
import type { HtmlToPdfService } from '../../coverpage/htmlToPdfService.js';

export class CoverPageGenerator {
  constructor(
    private readonly coverPageRepository: CoverPageRepository,
    private readonly htmlToPdfService: HtmlToPdfService
  ) {}

  /**
   * Generate a cover page PDFDocument from the HTML stored in the database.
   *
   * @param coverPageId - The primary key of the `cover_pages` row.
   * @returns A pdf-lib PDFDocument containing the rendered cover page.
   * @throws If the cover page record does not exist or has no HTML content.
   * @throws If Electron's PDF renderer fails.
   */
  async generate(coverPageId: string): Promise<PDFDocument> {
    // ── 1. Fetch HTML from SQLite ─────────────────────────────────────────────
    const record = await this.coverPageRepository.getHtmlById(coverPageId);

    if (!record) {
      throw new Error(
        `[CoverPageGenerator] Cover page not found in database (id: "${coverPageId}"). ` +
          'Ensure the cover page has been saved before exporting.'
      );
    }

    // ── 2. Render HTML → PDF Buffer ───────────────────────────────────────────
    const pdfBuffer = await this.htmlToPdfService.convert(record.html, {
      format: 'A4',
      printBackground: true,
      // Zero margins — the cover page HTML controls its own layout/padding
      marginTop: 0,
      marginBottom: 0,
      marginLeft: 0,
      marginRight: 0,
    });

    // ── 3. Wrap the Buffer in a pdf-lib PDFDocument ───────────────────────────
    // The rest of the pipeline (assembleDocuments, etc.) expects a PDFDocument.
    // pdf-lib.load() is the lightest way to wrap already-rendered bytes.
    const pdfDoc = await PDFDocument.load(pdfBuffer);

    return pdfDoc;
  }
}
