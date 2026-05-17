// ─── Annotation ───────────────────────────────────────────────────────────────

export type AnnotationType = 'highlight' | 'redaction';

export interface AnnotationRect {
  /** PDF user-space units from the left edge */
  x: number;
  /** PDF user-space units from the bottom edge */
  y: number;
  width: number;
  height: number;
  /** 0-indexed page within the source document */
  page: number;
}

export interface Annotation {
  id: string;
  type: AnnotationType;
  rect: AnnotationRect;
  /** CSS hex color string used for highlights — e.g. '#FFFF00' */
  color?: string;
  opacity?: number;
}

// ─── Document / Bundle ────────────────────────────────────────────────────────

export type DocumentMimeType = 'application/pdf';

export interface ExportDocument {
  id: string;
  name: string;
  filePath: string;
  mimeType: 'application/pdf';
  annotations: Annotation[];
  /** Populated by the prepareMetadata step */
  pageCount?: number;
}

export interface Bundle {
  id: string;
  name: string;
  /** Ordered list — the final PDF preserves this order */
  documents: ExportDocument[];
  createdAt: Date;
}

export interface PageDecoration {
  headerLeft: string;
  headerRight: string;
  footer: string;
  showPageNumbers: boolean;
}

// ─── Export options ───────────────────────────────────────────────────────────

export interface ExportOptions {
  /** Absolute path where the final PDF will be written */
  outputPath: string;
  frontCoverPageId?: string;
  backCoverPageId?: string;
  includeIndex?: boolean;
  applyAnnotations?: boolean;
  applyPageDecorations?: boolean;
  /** Requires includeIndex to be true */
  injectIndexLinks?: boolean;
  /** Run Ghostscript compression after saving */
  compress?: boolean;
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export interface DocumentMetadata {
  documentId: string;
  name: string;
  /** 1-indexed page in the final assembled PDF */
  startPage: number;
  pageCount: number;
}

/** Position of a single row inside the generated index PDF — used by injectIndexLinks */
export interface IndexEntry {
  documentId: string;
  /** 0-indexed page within the index PDF (not the assembled PDF) */
  pageIndex: number;
  /** Clickable rectangle in PDF user-space */
  rect: { x: number; y: number; width: number; height: number };
}

// ─── Progress ─────────────────────────────────────────────────────────────────

export type ExportStep =
  | 'idle'
  | 'prepareMetadata'
  | 'generateCover'
  | 'generateBackCover'
  | 'generateIndex'
  | 'assembleDocuments'
  | 'applyAnnotations'
  | 'applyPageDecorations'
  | 'injectIndexLinks'
  | 'saveOutput'
  | 'done'
  | 'error';

export interface ProgressEvent {
  step: ExportStep;
  /** 0–100 */
  progress: number;
  message?: string;
}

export type OnProgress = (event: ProgressEvent) => void;
