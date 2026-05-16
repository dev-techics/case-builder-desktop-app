import path from 'node:path';
import type { Bundle as StoredBundle } from '../../../domain/bundle.js';
import type { StoredDocument } from '../../../domain/document.js';
import type { StoredHighlight } from '../../../domain/highlight.js';
import type { StoredRedaction } from '../../../domain/redaction.js';
import type {
  Annotation,
  Bundle,
  ExportDocument,
} from './context/ExportTypes.js';

type BuildExportBundleInput = {
  bundle: StoredBundle;
  storedDocuments: StoredDocument[];
  highlights: StoredHighlight[];
  redactions: StoredRedaction[];
  documentsStorageRoot: string;
};

export function buildExportBundle(input: BuildExportBundleInput): Bundle {
  const orderedDocuments = orderDocuments(input.storedDocuments);
  const annotationsByDocument = buildAnnotationsByDocument(
    input.highlights,
    input.redactions
  );

  return {
    id: input.bundle.id,
    name: input.bundle.name,
    createdAt: toDate(input.bundle.createdAt),
    documents: orderedDocuments.map(document =>
      toExportDocument(document, annotationsByDocument, input.documentsStorageRoot)
    ),
  };
}

function orderDocuments(documents: StoredDocument[]): StoredDocument[] {
  const knownIds = new Set(documents.map(document => document.id));
  const childrenByParentId = new Map<string | null, StoredDocument[]>();

  for (const document of documents) {
    const parentId =
      document.parentId && knownIds.has(document.parentId)
        ? document.parentId
        : null;
    const siblings = childrenByParentId.get(parentId) ?? [];
    siblings.push(document);
    childrenByParentId.set(parentId, siblings);
  }

  const ordered: StoredDocument[] = [];
  const visited = new Set<string>();

  const walk = (parentId: string | null) => {
    const siblings = childrenByParentId.get(parentId) ?? [];

    for (const document of siblings) {
      if (visited.has(document.id)) {
        continue;
      }
      visited.add(document.id);

      if (document.type === 'file') {
        ordered.push(document);
        continue;
      }

      walk(document.id);
    }
  };

  walk(null);

  for (const document of documents) {
    if (visited.has(document.id)) {
      continue;
    }

    if (document.type === 'file') {
      ordered.push(document);
      visited.add(document.id);
      continue;
    }

    walk(document.id);
  }

  return ordered;
}

function buildAnnotationsByDocument(
  highlights: StoredHighlight[],
  redactions: StoredRedaction[]
): Map<string, Annotation[]> {
  const annotationsByDocument = new Map<string, Annotation[]>();

  for (const highlight of highlights) {
    pushAnnotation(annotationsByDocument, highlight.documentId, {
      id: highlight.id,
      type: 'highlight',
      rect: toRect(highlight),
      color: highlight.colorHex,
      opacity: highlight.opacity,
    });
  }

  for (const redaction of redactions) {
    pushAnnotation(annotationsByDocument, redaction.documentId, {
      id: redaction.id,
      type: 'redaction',
      rect: toRect(redaction),
      color: redaction.fillHex,
      opacity: redaction.opacity,
    });
  }

  return annotationsByDocument;
}

function pushAnnotation(
  annotationsByDocument: Map<string, Annotation[]>,
  documentId: string,
  annotation: Annotation
): void {
  const annotations = annotationsByDocument.get(documentId) ?? [];
  annotations.push(annotation);
  annotationsByDocument.set(documentId, annotations);
}

function toRect(annotation: {
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
}) {
  return {
    page: Math.max(0, annotation.pageNumber - 1),
    x: annotation.x,
    y: annotation.y,
    width: annotation.width,
    height: annotation.height,
  };
}

function toExportDocument(
  document: StoredDocument,
  annotationsByDocument: Map<string, Annotation[]>,
  documentsStorageRoot: string
): ExportDocument {
  if (!document.storagePath) {
    throw new Error(`Document "${document.name}" is missing its storage path.`);
  }

  if (!isPdfStoragePath(document.storagePath, document.mimeType)) {
    throw new Error(`Document "${document.name}" is not stored as a PDF.`);
  }

  const filePath = resolveStoredFilePath(documentsStorageRoot, document.storagePath);

  return {
    id: document.id,
    name: document.name,
    filePath,
    mimeType: 'application/pdf',
    annotations: annotationsByDocument.get(document.id) ?? [],
  };
}

function resolveStoredFilePath(
  documentsStorageRoot: string,
  storagePath: string
): string {
  const rootPath = path.resolve(documentsStorageRoot);
  const resolvedPath = path.resolve(rootPath, storagePath);

  if (
    resolvedPath !== rootPath &&
    !resolvedPath.startsWith(`${rootPath}${path.sep}`)
  ) {
    throw new Error('Document storage path escapes the configured storage root.');
  }

  return resolvedPath;
}

function isPdfStoragePath(
  storagePath: string,
  mimeType: string | null
): boolean {
  const normalizedMimeType = mimeType?.trim().toLowerCase();
  return (
    normalizedMimeType === 'application/pdf' ||
    storagePath.toLowerCase().endsWith('.pdf')
  );
}

function toDate(value: string): Date {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}
