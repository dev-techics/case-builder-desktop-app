import { PDFDocument } from 'pdf-lib';
import fs from 'node:fs/promises';
import type { ExportDocument } from '../context/ExportTypes.js';

export class PdfAssembler {
  /** Load a PDF from disk. */
  async loadPdf(filePath: string): Promise<PDFDocument> {
    const bytes = await fs.readFile(filePath);
    return PDFDocument.load(bytes);
  }

  async documentToPdf(doc: ExportDocument): Promise<PDFDocument> {
    return this.loadPdf(doc.filePath);
  }

  /**
   * Merge an ordered list of PDFDocuments into a single PDFDocument.
   * Pages are copied in order; no rewriting of existing content occurs.
   */
  async mergePdfs(pdfs: PDFDocument[]): Promise<PDFDocument> {
    const merged = await PDFDocument.create();

    for (const source of pdfs) {
      const indices = source.getPageIndices();
      const copied = await merged.copyPages(source, indices);
      copied.forEach(p => merged.addPage(p));
    }

    return merged;
  }

  /** Return the page count of a PDF file without keeping it in memory. */
  async getPageCount(filePath: string): Promise<number> {
    const pdf = await this.loadPdf(filePath);
    return pdf.getPageCount();
  }
}
