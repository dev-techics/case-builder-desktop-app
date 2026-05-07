import path from 'node:path';
import type {
  DocumentImportPreprocessResult,
  DocumentImportProcessingInput,
} from '../../application/ports/documentImportPreprocessor.js';
import type { PdfCompressor } from './compression/pdfCompressor.js';
import { getPdfFileName } from './fileTypes.js';
import { createPreparedDocument, noopCleanup } from './preparedDocument.js';
import {
  createTempDirectoryCleanup,
  removeProcessingTempDirectory,
} from './stagingDirectory.js';

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
  const outputPath = path.join(tempDirectory, pdfFileName);
  const compressionResult = await pdfCompressor.compress(input.path, outputPath);

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
