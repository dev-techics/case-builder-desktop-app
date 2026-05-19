import path from 'node:path';
import type {
  DocumentImportPreprocessResult,
  DocumentImportProcessingInput,
} from '../../application/ports/documents/documentProcessor.js';
import type { PdfCompressor } from './compression/pdfCompressor.js';
import { getPdfFileName } from './fileTypes.js';
import { createPreparedDocument, noopCleanup } from './preparedDocument.js';
import {
  createTempDirectoryCleanup,
  removeProcessingTempDirectory,
} from './stagingDirectory.js';
import { normalizePdfToA4 } from './conversion/normalizePdfToA4.js';

type PreparePdfImportOptions = {
  input: DocumentImportProcessingInput;
  tempDirectory: string;
  pdfCompressor: PdfCompressor;
};

const createCompressionStatus = (
  input: DocumentImportProcessingInput,
  message?: string
) =>
  message
    ? {
        fileName: input.name,
        status: 'success' as const,
        message,
      }
    : undefined;

// Prepares a PDF import and falls back to the original file when compression is skipped.
export async function preparePdfImport(
  options: PreparePdfImportOptions
): Promise<DocumentImportPreprocessResult> {
  const { input, tempDirectory, pdfCompressor } = options;
  const pdfFileName = getPdfFileName(input.name);

  // Step 1: Normalize to A4
  const a4PdfPath = path.join(tempDirectory, `a4-${pdfFileName}`);
  await normalizePdfToA4(input.path, a4PdfPath);

  // Step 2: Compress the normalized PDF
  const compressedPdfPath = path.join(tempDirectory, pdfFileName);
  const compressionResult = await pdfCompressor.compress(
    a4PdfPath,
    compressedPdfPath
  );

  if (compressionResult.compressed) {
    return {
      document: createPreparedDocument(
        {
          name: pdfFileName,
          path: compressionResult.path,
          mimeType: 'application/pdf',
        },
        createTempDirectoryCleanup(tempDirectory)
      ),
    };
  }

  await removeProcessingTempDirectory(tempDirectory);

  return {
    document: createPreparedDocument(
      {
        name: pdfFileName,
        path: input.path,
        mimeType: 'application/pdf',
      },
      noopCleanup
    ),
    status: createCompressionStatus(input, compressionResult.message),
  };
}
