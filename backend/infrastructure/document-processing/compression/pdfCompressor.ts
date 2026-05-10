import { runCommand } from '../gs-command-runner/runCommand.js';

export interface GhostscriptBinaryResolver {
  getBinaryPath(): Promise<string | null>;
  ensureBinaryPath(): Promise<string>;
}

export interface PdfCompressionResult {
  compressed: boolean;
  path: string;
  message?: string;
}

export interface PdfCompressor {
  compress(
    inputPath: string,
    outputPath: string
  ): Promise<PdfCompressionResult>;
}

type GhostscriptPdfCompressorOptions = {
  ghostscriptManager: GhostscriptBinaryResolver;
  requireGhostscript?: boolean;
};

const buildErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Failed to prepare the document.';

export class GhostscriptPdfCompressor implements PdfCompressor {
  private readonly ghostscriptManager: GhostscriptBinaryResolver;
  private readonly requireGhostscript: boolean;

  constructor(options: GhostscriptPdfCompressorOptions) {
    this.ghostscriptManager = options.ghostscriptManager;
    this.requireGhostscript = options.requireGhostscript ?? false;
  }

  // Compresses a PDF when Ghostscript is available for the current machine.
  async compress(
    inputPath: string,
    outputPath: string
  ): Promise<PdfCompressionResult> {
    const ghostscriptPath = await this.resolveGhostscriptPath();
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
        throw new Error(buildErrorMessage(error));
      }

      return {
        compressed: false,
        path: inputPath,
        message:
          'Ghostscript compression failed, so the file was imported without compression.',
      };
    }
  }

  private async resolveGhostscriptPath() {
    try {
      return this.requireGhostscript
        ? await this.ghostscriptManager.ensureBinaryPath()
        : await this.ghostscriptManager.getBinaryPath();
    } catch (error) {
      if (this.requireGhostscript) {
        throw error;
      }

      return null;
    }
  }
}
