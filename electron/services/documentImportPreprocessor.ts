import { nativeImage } from 'electron';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { PDFDocument } from 'pdf-lib';
import type {
  DocumentImportPreprocessResult,
  DocumentImportPreprocessor,
  DocumentImportProcessingInput,
  PreparedImportDocument,
} from '../../backend/application/ports/documentImportPreprocessor.js';
import { runCommand } from './commandRunner.js';
import { GhostscriptManager } from './ghostscriptManager.js';

type ElectronDocumentImportPreprocessorOptions = {
  ghostscriptManager: GhostscriptManager;
  requireGhostscript?: boolean;
  officeConverterCommand?: string | null;
};

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

const OFFICE_CONVERTER_CANDIDATES: Record<NodeJS.Platform, string[]> = {
  aix: ['soffice', 'libreoffice'],
  android: ['soffice', 'libreoffice'],
  darwin: ['soffice', 'libreoffice'],
  freebsd: ['soffice', 'libreoffice'],
  haiku: ['soffice', 'libreoffice'],
  linux: ['soffice', 'libreoffice'],
  openbsd: ['soffice', 'libreoffice'],
  sunos: ['soffice', 'libreoffice'],
  win32: ['soffice.exe', 'soffice', 'libreoffice.exe', 'libreoffice'],
  cygwin: ['soffice', 'libreoffice'],
  netbsd: ['soffice', 'libreoffice'],
};

const getNormalizedMimeType = (mimeType?: string | null) =>
  mimeType?.trim().toLowerCase() ?? '';

const replaceExtensionWithPdf = (fileName: string) => {
  const parsedPath = path.parse(fileName);
  const baseName = parsedPath.name || parsedPath.base || 'document';
  return `${baseName}.pdf`;
};

const buildFailureMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Failed to prepare the document.';

const isPdfFile = (input: DocumentImportProcessingInput) => {
  const normalizedMimeType = getNormalizedMimeType(input.mimeType);
  if (normalizedMimeType && PDF_MIME_TYPES.has(normalizedMimeType)) {
    return true;
  }

  return path.extname(input.name).toLowerCase() === '.pdf';
};

const isImageFile = (input: DocumentImportProcessingInput) => {
  const normalizedMimeType = getNormalizedMimeType(input.mimeType);
  if (normalizedMimeType && IMAGE_MIME_TYPES.has(normalizedMimeType)) {
    return true;
  }

  return IMAGE_EXTENSIONS.has(path.extname(input.name).toLowerCase());
};

const createNoopCleanup = async () => {};

const createPreparedDocument = (
  input: Omit<PreparedImportDocument, 'cleanup'>,
  cleanup: PreparedImportDocument['cleanup']
): PreparedImportDocument => ({
  ...input,
  cleanup,
});

export class ElectronDocumentImportPreprocessor implements DocumentImportPreprocessor {
  private readonly ghostscriptManager: GhostscriptManager;
  private readonly requireGhostscript: boolean;
  private readonly officeConverterCommand: string | null;
  private resolvedOfficeConverterCommand: Promise<string | null> | null = null;

  constructor(options: ElectronDocumentImportPreprocessorOptions) {
    this.ghostscriptManager = options.ghostscriptManager;
    this.requireGhostscript = options.requireGhostscript ?? false;
    this.officeConverterCommand = options.officeConverterCommand ?? null;
  }

  async preprocess(
    input: DocumentImportProcessingInput
  ): Promise<DocumentImportPreprocessResult> {
    let tempDirectory: string | null = null;

    try {
      tempDirectory = await fs.mkdtemp(
        path.join(os.tmpdir(), 'case-builder-import-')
      );

      if (isPdfFile(input)) {
        return this.preparePdfImport(input, tempDirectory);
      }

      return this.prepareNonPdfImport(input, tempDirectory);
    } catch (error) {
      if (tempDirectory) {
        await fs.rm(tempDirectory, { recursive: true, force: true });
      }

      return {
        document: null,
        status: {
          fileName: input.name,
          status: 'failed',
          message: buildFailureMessage(error),
        },
      };
    }
  }

  private async preparePdfImport(
    input: DocumentImportProcessingInput,
    tempDirectory: string
  ): Promise<DocumentImportPreprocessResult> {
    const outputPath = path.join(
      tempDirectory,
      replaceExtensionWithPdf(input.name)
    );
    const compressionResult = await this.compressPdf(input.path, outputPath);

    if (compressionResult.compressed) {
      return {
        document: createPreparedDocument(
          {
            name: replaceExtensionWithPdf(input.name),
            path: compressionResult.path,
            mimeType: 'application/pdf',
          },
          async () => {
            await fs.rm(tempDirectory, { recursive: true, force: true });
          }
        ),
      };
    }

    await fs.rm(tempDirectory, { recursive: true, force: true });

    return {
      document: createPreparedDocument(
        {
          name: replaceExtensionWithPdf(input.name),
          path: input.path,
          mimeType: 'application/pdf',
        },
        createNoopCleanup
      ),
      status: {
        fileName: input.name,
        status: 'success',
        message: compressionResult.message,
      },
    };
  }

  private async prepareNonPdfImport(
    input: DocumentImportProcessingInput,
    tempDirectory: string
  ): Promise<DocumentImportPreprocessResult> {
    const pdfFileName = replaceExtensionWithPdf(input.name);
    const convertedPdfPath = path.join(tempDirectory, pdfFileName);

    if (isImageFile(input)) {
      await this.convertImageToPdf(input.path, convertedPdfPath);
    } else {
      await this.convertOfficeDocumentToPdf(input.path, tempDirectory);
    }

    const conversionOutputPath = await this.resolveConvertedPdfPath(
      tempDirectory,
      input.path,
      convertedPdfPath
    );
    const compressedPdfPath = path.join(
      tempDirectory,
      `compressed-${pdfFileName}`
    );
    const compressionResult = await this.compressPdf(
      conversionOutputPath,
      compressedPdfPath
    );

    return {
      document: createPreparedDocument(
        {
          name: pdfFileName,
          path: compressionResult.path,
          mimeType: 'application/pdf',
        },
        async () => {
          await fs.rm(tempDirectory, { recursive: true, force: true });
        }
      ),
      status: {
        fileName: input.name,
        status: 'success',
        message: compressionResult.compressed
          ? 'Converted to PDF and compressed before import.'
          : (compressionResult.message ?? 'Converted to PDF before import.'),
      },
    };
  }

  private async compressPdf(inputPath: string, outputPath: string) {
    let ghostscriptPath: string | null = null;

    try {
      ghostscriptPath = this.requireGhostscript
        ? await this.ghostscriptManager.ensureBinaryPath()
        : await this.ghostscriptManager.getBinaryPath();
    } catch (error) {
      if (this.requireGhostscript) {
        throw error;
      }
    }

    if (!ghostscriptPath) {
      return {
        compressed: false,
        path: inputPath,
        message:
          'Ghostscript was unavailable, so the file was imported without compression.',
      };
    }

    try {
      await runCommand(ghostscriptPath, [
        '-sDEVICE=pdfwrite',
        '-dCompatibilityLevel=1.4',
        '-dPDFSETTINGS=/ebook',
        '-dDetectDuplicateImages=true',
        '-dCompressFonts=true',
        '-dNOPAUSE',
        '-dQUIET',
        '-dBATCH',
        `-sOutputFile=${outputPath}`,
        inputPath,
      ]);

      return {
        compressed: true,
        path: outputPath,
      };
    } catch (error) {
      if (this.requireGhostscript) {
        throw new Error(buildFailureMessage(error));
      }

      return {
        compressed: false,
        path: inputPath,
        message:
          'Ghostscript compression failed, so the file was imported without compression.',
      };
    }
  }

  private async convertImageToPdf(inputPath: string, outputPath: string) {
    const image = nativeImage.createFromPath(inputPath);
    if (image.isEmpty()) {
      throw new Error('The selected image could not be converted to PDF.');
    }

    const pngBytes = image.toPNG();
    const pdfDocument = await PDFDocument.create();
    const embeddedImage = await pdfDocument.embedPng(pngBytes);
    const { width, height } = embeddedImage.scale(1);
    const page = pdfDocument.addPage([width, height]);

    page.drawImage(embeddedImage, {
      x: 0,
      y: 0,
      width,
      height,
    });

    await fs.writeFile(outputPath, await pdfDocument.save());
  }

  private async convertOfficeDocumentToPdf(
    inputPath: string,
    tempDirectory: string
  ) {
    const converterCommand = await this.resolveOfficeConverterCommand();
    if (!converterCommand) {
      throw new Error(
        [
          'This file type needs a PDF converter.',
          'Install LibreOffice/soffice or set `CASE_BUILDER_PDF_CONVERTER_PATH`.',
        ].join(' ')
      );
    }

    await runCommand(converterCommand, [
      '--headless',
      '--convert-to',
      'pdf',
      '--outdir',
      tempDirectory,
      inputPath,
    ]);
  }

  private async resolveOfficeConverterCommand() {
    if (!this.resolvedOfficeConverterCommand) {
      this.resolvedOfficeConverterCommand =
        this.findOfficeConverterCommand().catch(error => {
          this.resolvedOfficeConverterCommand = null;
          throw error;
        });
    }

    return this.resolvedOfficeConverterCommand;
  }

  private async findOfficeConverterCommand() {
    if (this.officeConverterCommand) {
      return this.officeConverterCommand;
    }

    const configuredPath =
      process.env.CASE_BUILDER_PDF_CONVERTER_PATH?.trim() || '';
    if (configuredPath) {
      return configuredPath;
    }

    const candidates = OFFICE_CONVERTER_CANDIDATES[
      process.platform as NodeJS.Platform
    ] ?? ['soffice', 'libreoffice'];

    for (const candidate of candidates) {
      try {
        await runCommand(candidate, ['--version']);
        return candidate;
      } catch {
        continue;
      }
    }

    return null;
  }

  private async resolveConvertedPdfPath(
    tempDirectory: string,
    sourcePath: string,
    defaultOutputPath: string
  ) {
    try {
      await fs.access(defaultOutputPath);
      return defaultOutputPath;
    } catch {
      const expectedPath = path.join(
        tempDirectory,
        `${path.parse(sourcePath).name}.pdf`
      );

      try {
        await fs.access(expectedPath);
        return expectedPath;
      } catch {
        const tempEntries = await fs.readdir(tempDirectory);
        const discoveredPdfName = tempEntries.find(entry =>
          entry.toLowerCase().endsWith('.pdf')
        );

        if (!discoveredPdfName) {
          throw new Error(
            'The file was converted, but no PDF output was found.'
          );
        }

        return path.join(tempDirectory, discoveredPdfName);
      }
    }
  }
}
