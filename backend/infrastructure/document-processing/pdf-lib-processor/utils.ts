// infrastructure/document-processing/pdfLibProcessor/PdfLibProcessor.ts
import { PDFDocument } from 'pdf-lib';
import fs from 'node:fs/promises';

async getPageCount(filePath: string): Promise<number> {
  const buffer = await fs.readFile(filePath);
  const pdf = await PDFDocument.load(buffer);
  return pdf.getPageCount();
}