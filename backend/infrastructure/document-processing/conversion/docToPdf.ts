import { runCommand } from '../gs-command-runner/runCommand.js';

export interface DocumentToPdfConverter {
  convert(inputPath: string, outputDirectory: string): Promise<void>;
}

type OfficeDocumentToPdfConverterOptions = {
  officeConverterCommand?: string | null;
};

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

const getConfiguredConverterCommand = (
  officeConverterCommand: string | null
) => {
  if (officeConverterCommand) {
    return officeConverterCommand;
  }

  return process.env.CASE_BUILDER_PDF_CONVERTER_PATH?.trim() || null;
};

const getConverterCandidates = () =>
  OFFICE_CONVERTER_CANDIDATES[process.platform] ?? ['soffice', 'libreoffice'];

export class OfficeDocumentToPdfConverter implements DocumentToPdfConverter {
  private readonly officeConverterCommand: string | null;
  private resolvedCommand: Promise<string | null> | null = null;

  constructor(options: OfficeDocumentToPdfConverterOptions = {}) {
    this.officeConverterCommand =
      options.officeConverterCommand?.trim() || null;
  }

  // Converts a supported office document into a PDF using LibreOffice.
  async convert(inputPath: string, outputDirectory: string): Promise<void> {
    const converterCommand = await this.resolveCommand();
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
      outputDirectory,
      inputPath,
    ]);
  }

  private async resolveCommand() {
    this.resolvedCommand ??= this.findCommand().catch(error => {
      this.resolvedCommand = null;
      throw error;
    });

    return this.resolvedCommand;
  }

  private async findCommand() {
    const configuredCommand = getConfiguredConverterCommand(
      this.officeConverterCommand
    );
    if (configuredCommand) {
      return configuredCommand;
    }

    for (const candidate of getConverterCandidates()) {
      try {
        await runCommand(candidate, ['--version']);
        return candidate;
      } catch {
        continue;
      }
    }

    return null;
  }
}
