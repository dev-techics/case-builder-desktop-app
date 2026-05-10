import path from 'node:path';
import type { DocumentImportProcessingInput } from '../../application/ports/documents/documentProcessor.js';

const PDF_MIME_TYPES = new Set([
  'application/pdf',
  'application/x-pdf',
  'application/acrobat',
  'applications/vnd.pdf',
  'text/pdf',
  'text/x-pdf',
]);

const IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/bmp',
  'image/tiff',
  'image/webp',
]);

const IMAGE_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.bmp',
  '.tif',
  '.tiff',
  '.webp',
]);

const getNormalizedMimeType = (mimeType?: string | null) =>
  mimeType?.trim().toLowerCase() ?? '';

// Returns the PDF filename that should be stored for the imported document.
export const getPdfFileName = (fileName: string) => {
  const parsedPath = path.parse(fileName);
  const baseName = parsedPath.name || parsedPath.base || 'document';
  return `${baseName}.pdf`;
};

// Detects whether the import input is already a PDF.
export const isPdfFile = (input: DocumentImportProcessingInput) => {
  const normalizedMimeType = getNormalizedMimeType(input.mimeType);
  if (normalizedMimeType && PDF_MIME_TYPES.has(normalizedMimeType)) {
    return true;
  }

  return path.extname(input.name).toLowerCase() === '.pdf';
};

// Detects whether the import input should be treated as an image.
export const isImageFile = (input: DocumentImportProcessingInput) => {
  const normalizedMimeType = getNormalizedMimeType(input.mimeType);
  if (normalizedMimeType && IMAGE_MIME_TYPES.has(normalizedMimeType)) {
    return true;
  }

  return IMAGE_EXTENSIONS.has(path.extname(input.name).toLowerCase());
};
