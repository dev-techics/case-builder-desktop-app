// infrastructure/document-processing/pdfLibProcessor/PdfLibProcessor.ts
import { PDFDocument, degrees } from 'pdf-lib';
import fs from 'node:fs/promises';
import type { RotateDocumentProcessor } from '../../../application/ports/documents/documentProcessor.js';

export class PdfLibProcessor implements RotateDocumentProcessor {
  async getPageCount(filePath: string): Promise<number> {
    const buffer = await fs.readFile(filePath);
    const pdf = await PDFDocument.load(buffer);
    return pdf.getPageCount();
  }

  async rotatePage(input: {
    filePath: string;
    pageNumber: number;
    rotation: 0 | 90 | 180 | 270;
  }): Promise<void> {
    const buffer = await fs.readFile(input.filePath);
    const pdf = await PDFDocument.load(buffer);

    const pageIndex = input.pageNumber - 1; // pdf-lib is 0-based
    const page = pdf.getPage(pageIndex);

    const currentRotation = page.getRotation().angle;
    const newRotation = (currentRotation + input.rotation) % 360;

    page.setRotation(degrees(newRotation));

    const savedBuffer = await pdf.save();
    await fs.writeFile(input.filePath, savedBuffer);
  }
}
