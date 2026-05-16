import type { PdfCompressor } from '../../compression/pdfCompressor.js';
import type { ExportContext } from './ExportContext.js';
import type {
  Bundle,
  ExportOptions,
  OnProgress,
  PageDecoration,
} from './ExportTypes.js';

type CreateExportContextExtras = {
  pageDecoration?: Partial<PageDecoration>;
  pdfCompressor?: PdfCompressor;
};

export function createExportContext(
  bundle: Bundle,
  options: ExportOptions,
  onProgress?: OnProgress,
  extras: CreateExportContextExtras = {}
): ExportContext {
  return {
    bundle,
    options,
    onProgress,
    currentStep: 'idle',
    documentMetadata: [],
    coverPageCount: 0,
    backCoverPageCount: 0,
    indexPageCount: 0,
    pageDecoration: {
      headerLeft: extras.pageDecoration?.headerLeft ?? '',
      headerRight: extras.pageDecoration?.headerRight ?? '',
      footer: extras.pageDecoration?.footer ?? '',
      showPageNumbers: extras.pageDecoration?.showPageNumbers ?? true,
    },
    pdfCompressor: extras.pdfCompressor,
  };
}
