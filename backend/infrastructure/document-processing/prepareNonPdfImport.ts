import path from 'node:path';
import type {
  DocumentImportPreprocessResult,
  DocumentImportProcessingInput,
} from '../../application/ports/documents/documentProcessor.js';
import type { PdfCompressor } from './compression/pdfCompressor.js';
import type { DocumentToPdfConverter } from './conversion/docToPdf.js';
import { convertImageToPdf } from './conversion/imageToPdf.js';
import { normalizePdfToA4 } from './conversion/normalizePdfToA4.js';
import { resolveConvertedPdfPath } from './conversion/resolveConvertedPdfPath.js';
import { getPdfFileName, isImageFile } from './fileTypes.js';
import { createPreparedDocument } from './preparedDocument.js';
import { createTempDirectoryCleanup } from './stagingDirectory.js';

type PrepareNonPdfImportOptions = {
  input: DocumentImportProcessingInput;
  tempDirectory: string;
  pdfCompressor: PdfCompressor;
  documentToPdfConverter: DocumentToPdfConverter;
};

const buildSuccessMessage = (compressed: boolean, message?: string) =>
  compressed
    ? 'Converted to an A4 PDF and compressed before import.'
    : (message ?? 'Converted to an A4 PDF before import.');

// *Converts a non-PDF import into a staged PDF file ready for storage.
export async function prepareNonPdfImport(
  options: PrepareNonPdfImportOptions
): Promise<DocumentImportPreprocessResult> {
  const { input, tempDirectory, pdfCompressor, documentToPdfConverter } =
    options;
  const pdfFileName = getPdfFileName(input.name);
  const convertedPdfPath = path.join(tempDirectory, pdfFileName);

  if (isImageFile(input)) {
    await convertImageToPdf(input.path, convertedPdfPath);
  } else {
    await documentToPdfConverter.convert(input.path, tempDirectory);
  }

  const conversionOutputPath = await resolveConvertedPdfPath(
    tempDirectory,
    input.path,
    convertedPdfPath
  );
  const a4PdfPath = path.join(tempDirectory, `a4-${pdfFileName}`);
  await normalizePdfToA4(conversionOutputPath, a4PdfPath);
  const compressedPdfPath = path.join(
    tempDirectory,
    `compressed-${pdfFileName}`
  );
  const compressionResult = await pdfCompressor.compress(
    a4PdfPath,
    compressedPdfPath
  );

  return {
    document: createPreparedDocument(
      {
        name: pdfFileName,
        path: compressionResult.path,
        mimeType: 'application/pdf',
      },
      createTempDirectoryCleanup(tempDirectory)
    ),
    status: {
      fileName: input.name,
      status: 'success',
      message: buildSuccessMessage(
        compressionResult.compressed,
        compressionResult.message
      ),
    },
  };
}
