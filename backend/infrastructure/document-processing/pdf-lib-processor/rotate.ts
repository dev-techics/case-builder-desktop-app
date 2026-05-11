// infrastructure/document-processing/pdfLibProcessor/PdfLibProcessor.ts
import { PDFDocument, degrees } from 'pdf-lib';
import fs from 'node:fs/promises';
import type { RotateDocumentProcessor } from '../../../application/ports/documents/documentProcessor.js';

export class DocumentRotateProcessor implements RotateDocumentProcessor {
  private async loadPdf(filePath: string) {
    const buffer = await fs.readFile(filePath);
    return PDFDocument.load(buffer);
  }

  private async savePdf(filePath: string, pdf: PDFDocument) {
    const savedBuffer = await pdf.save();
    await fs.writeFile(filePath, savedBuffer);
  }

  async getPageCount(filePath: string): Promise<number> {
    const pdf = await this.loadPdf(filePath);
    return pdf.getPageCount();
  }

  async rotatePage(input: {
    filePath: string;
    pageNumber: number;
    rotation: 0 | 90 | 180 | 270;
  }): Promise<void> {
    const pdf = await this.loadPdf(input.filePath);

    const pageIndex = input.pageNumber - 1; // pdf-lib is 0-based
    const page = pdf.getPage(pageIndex);

    const currentRotation = page.getRotation().angle;
    const newRotation = (currentRotation + input.rotation) % 360;

    page.setRotation(degrees(newRotation));
    await this.savePdf(input.filePath, pdf);
  }
}
