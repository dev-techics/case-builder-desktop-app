import { PDFDocument, PDFPage, StandardFonts, rgb } from 'pdf-lib';
import type { DocumentMetadata, IndexEntry } from '../context/ExportTypes.js';

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 72;
const LINE_H = 22;
// Space consumed by the title + rule + column-header block at the top of each page
const HEADER_H = 56;

/** Rows that fit in the body of a single index page */
export const INDEX_ROWS_PER_PAGE = Math.floor(
  (PAGE_H - MARGIN * 2 - HEADER_H) / LINE_H
);

export interface IndexGenerationResult {
  pdf: PDFDocument;
  /** One entry per document row — consumed by injectIndexLinks */
  entries: IndexEntry[];
}

export class IndexPageGenerator {
  /**
   * Estimate the number of pages an index for `count` documents will produce.
   * Used by prepareMetadata before the index is actually generated so that
   * document start-pages can be calculated accurately.
   */
  static estimatePageCount(count: number): number {
    if (count === 0) return 0;
    return Math.ceil(count / INDEX_ROWS_PER_PAGE);
  }

  async generate(metadata: DocumentMetadata[]): Promise<IndexGenerationResult> {
    const doc = await PDFDocument.create();
    const bold = await doc.embedFont(StandardFonts.HelveticaBold);
    const regular = await doc.embedFont(StandardFonts.Helvetica);
    const entries: IndexEntry[] = [];

    let currentPageIndex = -1; // incremented on the first addPage call
    let page!: PDFPage;
    let y = 0;

    const addPage = (): void => {
      page = doc.addPage([PAGE_W, PAGE_H]);
      currentPageIndex++;
      y = PAGE_H - MARGIN;

      // ── Page header ────────────────────────────────────────────────────────
      page.drawText('INDEX OF DOCUMENTS', {
        x: MARGIN,
        y,
        size: 14,
        font: bold,
        color: rgb(0.1, 0.1, 0.1),
      });
      y -= 10;

      page.drawLine({
        start: { x: MARGIN, y },
        end: { x: PAGE_W - MARGIN, y },
        thickness: 1,
        color: rgb(0.7, 0.7, 0.7),
      });
      y -= LINE_H;

      // Column labels
      const labelColor = rgb(0.5, 0.5, 0.5);
      page.drawText('No.', {
        x: MARGIN,
        y,
        size: 9,
        font: bold,
        color: labelColor,
      });
      page.drawText('Document Name', {
        x: MARGIN + 36,
        y,
        size: 9,
        font: bold,
        color: labelColor,
      });
      page.drawText('Page', {
        x: PAGE_W - MARGIN - 30,
        y,
        size: 9,
        font: bold,
        color: labelColor,
      });
      y -= LINE_H;
    };

    addPage();

    // ── Rows ──────────────────────────────────────────────────────────────────
    for (let i = 0; i < metadata.length; i++) {
      if (y < MARGIN + LINE_H) {
        addPage();
      }

      const meta = metadata[i];

      // Alternate row shading
      if (i % 2 === 0) {
        page.drawRectangle({
          x: MARGIN - 4,
          y: y - 4,
          width: PAGE_W - 2 * MARGIN + 8,
          height: LINE_H - 2,
          color: rgb(0.95, 0.96, 0.99),
        });
      }

      page.drawText(String(i + 1), {
        x: MARGIN,
        y,
        size: 10,
        font: regular,
        color: rgb(0.4, 0.4, 0.4),
      });

      page.drawText(this.truncate(meta.name, 54), {
        x: MARGIN + 36,
        y,
        size: 10,
        font: regular,
        color: rgb(0.1, 0.1, 0.1),
      });

      page.drawText(String(meta.startPage), {
        x: PAGE_W - MARGIN - 30,
        y,
        size: 10,
        font: regular,
        color: rgb(0.15, 0.35, 0.75),
      });

      // Record the row's bounding rect so injectIndexLinks can turn it into a link
      entries.push({
        documentId: meta.documentId,
        pageIndex: currentPageIndex,
        rect: {
          x: MARGIN - 4,
          y: y - 4,
          width: PAGE_W - 2 * MARGIN + 8,
          height: LINE_H - 2,
        },
      });

      y -= LINE_H;
    }

    return { pdf: doc, entries };
  }

  private truncate(text: string, max: number): string {
    return text.length > max ? `${text.slice(0, max - 1)}\u2026` : text;
  }
}
