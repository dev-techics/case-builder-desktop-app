import type {
  DocumentImportPreprocessResult,
  DocumentProcessor,
  DocumentImportProcessingInput,
} from '../../application/ports/documents/documentProcessor.js';
import type { PdfCompressor } from './compression/pdfCompressor.js';
import type { DocumentToPdfConverter } from './conversion/docToPdf.js';
import { isPdfFile } from './fileTypes.js';
import { prepareNonPdfImport } from './prepareNonPdfImport.js';
import { preparePdfImport } from './preparePdfImport.js';
import {
  createProcessingTempDirectory,
  removeProcessingTempDirectory,
} from './stagingDirectory.js';

type InfrastructureDocumentImportPreprocessorOptions = {
  pdfCompressor: PdfCompressor;
  documentToPdfConverter: DocumentToPdfConverter;
};

const buildFailureMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Failed to prepare the document.';

const createFailedResult = (
  fileName: string,
  error: unknown
): DocumentImportPreprocessResult => ({
  document: null,
  status: {
    fileName,
    status: 'failed',
    message: buildFailureMessage(error),
  },
});

export class InfrastructureDocumentImportPreprocessor implements DocumentProcessor {
  private readonly pdfCompressor: PdfCompressor;
  private readonly documentToPdfConverter: DocumentToPdfConverter;

  constructor(options: InfrastructureDocumentImportPreprocessorOptions) {
    this.pdfCompressor = options.pdfCompressor;
    this.documentToPdfConverter = options.documentToPdfConverter;
  }

  async preprocess(
    input: DocumentImportProcessingInput
  ): Promise<DocumentImportPreprocessResult> {
    let tempDirectory: string | null = null;

    try {
      tempDirectory = await createProcessingTempDirectory();

      if (isPdfFile(input)) {
        return preparePdfImport({
          input,
          tempDirectory,
          pdfCompressor: this.pdfCompressor,
        });
      }

      return prepareNonPdfImport({
        input,
        tempDirectory,
        pdfCompressor: this.pdfCompressor,
        documentToPdfConverter: this.documentToPdfConverter,
      });
    } catch (error) {
      if (tempDirectory) {
        await removeProcessingTempDirectory(tempDirectory);
      }

      return createFailedResult(input.name, error);
    }
  }
}
