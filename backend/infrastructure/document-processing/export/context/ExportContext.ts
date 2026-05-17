import type { PDFDocument } from 'pdf-lib';
import type { PdfCompressor } from '../../compression/pdfCompressor.js';
import type {
  Bundle,
  DocumentMetadata,
  ExportOptions,
  ExportStep,
  IndexEntry,
  OnProgress,
  PageDecoration,
} from './ExportTypes.js';
import { CoverPageGenerator } from '../services/CoverPageGenerator.js';

/**
 * Mutable context object passed through every step of the export pipeline.
 *
 * Steps read their inputs from context and write their outputs back to it.
 * This keeps the pipeline orchestrator simple (it just runs steps in order)
 * and makes each step independently testable.
 */
export interface ExportContext {
  // ── Immutable inputs ──────────────────────────────────────────────────────
  bundle: Bundle;
  options: ExportOptions;
  onProgress?: OnProgress;
  coverPageGenerator?: CoverPageGenerator;

  // ── Pipeline state (mutated by steps) ────────────────────────────────────

  currentStep: ExportStep;

  /** Set by prepareMetadata */
  documentMetadata: DocumentMetadata[];

  /** Set by generateCover */
  coverPdf?: PDFDocument;
  coverPageCount: number;

  /** Set by generateBackCover */
  backCoverPdf?: PDFDocument;
  backCoverPageCount: number;

  /** Set by generateIndex */
  indexPdf?: PDFDocument;
  indexPageCount: number;
  indexEntries?: IndexEntry[];

  /** Decorative bundle-level text applied during export */
  pageDecoration: PageDecoration;
  pdfCompressor?: PdfCompressor;

  /** Set by assembleDocuments — the working copy that all subsequent steps modify */
  assembledPdf?: PDFDocument;

  /** Set by saveOutput */
  outputPath?: string;
}
