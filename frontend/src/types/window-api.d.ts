import type { BundleStatus } from "@case-builder/ui";
import type { FileTree } from "@/features/file-explorer/types/fileTree";
import type { CreateHighlightRequest } from "@/features/toolbar/types/types";

export {};

// ─── Shared Types ─────────────────────────────────────────────────────────────

type DocumentImportStatus = {
  fileName: string;
  status: 'success' | 'failed';
  message?: string;
};

type DesktopBundleMetadata = {
  [key: string]: unknown;
};

type DesktopExportBundleResponse = {
  canceled: boolean;
  outputPath?: string;
  pageCount?: number;
};

// ─── Highlight Types ──────────────────────────────────────────────────────────

type DesktopHighlightRecord = {
  id: string;
  bundleId: string;
  documentId: string;
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  colorName: string;
  colorHex: string;
  colorRgb: {
    r: number;
    g: number;
    b: number;
  };
  opacity: number;
  createdAt: string;
  updatedAt: string;
};

// ─── Comment Types ────────────────────────────────────────────────────────────

type DesktopCommentRecord = {
  id: string;
  bundleId: string;
  documentId: string;
  pageNumber: number;
  text: string;
  selectedText: string;
  x: number;
  y: number;
  pageY: number;
  resolved: boolean;
  createdAt: string;
  updatedAt: string;
};

type CreateCommentRequest = {
  document_id: string;
  page_number: number;
  text: string;
  selected_text?: string;
  x: number;
  y: number;
  page_y: number;
};

// ─── Redaction Types ──────────────────────────────────────────────────────────

type DesktopRedactionRecord = {
  id: string;
  bundleId: string;
  documentId: string;
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
  fillHex: string;
  opacity: number;
  borderHex: string;
  borderWidth: number;
  createdAt: string;
  updatedAt: string;
};

type CreateRedactionRequest = {
  document_id: string;
  page_number: number;
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
  fill_hex: string;
  opacity: number;
  border_hex: string;
  border_width: number;
};

// ─── Cover Page Types ─────────────────────────────────────────────────────────

export type DesktopCoverPageRecord = {
  id: string;
  name: string;
  description: string;
  type: 'front' | 'back';
  isDefault: boolean;
  html: string;
  designJson: string;
  createdAt: string;
  updatedAt: string;
};

type CreateCoverPageRequest = {
  name: string;
  description?: string;
  type: 'front' | 'back';
  isDefault?: boolean;
  html?: string;
  designJson?: string;
};

type UpdateCoverPageRequest = {
  name?: string;
  description?: string;
  type?: 'front' | 'back';
  isDefault?: boolean;
  html?: string;
  designJson?: string;
};

// ─── Window API ───────────────────────────────────────────────────────────────

declare global {
  interface Window {
    api?: {
      isDesktop?: true;

      // ─── Bundles ───────────────────────────────────────────────────────────
      createBundle: (
        input:
          | {
              name: string;
              caseNumber?: string;
              status?: string;
              description?: string;
              tags?: string[];
            }
          | string
      ) => Promise<unknown>;
      getBundles: () => Promise<unknown[]>;
      deleteBundle: (id: string | number) => Promise<void>;
      updateBundle: (input: {
        id: string | number;
        name?: string;
        status?: BundleStatus;
      }) => Promise<unknown>;
      getBundleMetadata: (
        bundleId: string | number
      ) => Promise<DesktopBundleMetadata>;
      updateBundleMetadata: (input: {
        bundleId: string | number;
        metadata: DesktopBundleMetadata;
      }) => Promise<DesktopBundleMetadata>;
      exportBundle: (input: {
        bundleId: string;
        frontCoverPageId?: string;
        backCoverPageId?: string;
        includeIndex?: boolean;
        compress?: boolean;
        fileName?: string;
      }) => Promise<DesktopExportBundleResponse>;

      // ─── Documents ─────────────────────────────────────────────────────────
      getDocumentsTree: (bundleId: string | number) => Promise<FileTree>;
      createFolder: (input: {
        bundleId: string | number;
        name: string;
        parentId?: string | null;
      }) => Promise<{
        id: string;
        name: string;
        type: 'folder';
        parentId: string | null;
      }>;
      reorderDocuments: (input: {
        bundleId: string | number;
        items: Array<{ id: string | number; order: number }>;
      }) => Promise<FileTree>;
      moveDocument: (input: {
        id: string | number;
        newParentId: string | null;
      }) => Promise<FileTree>;
      deleteDocument: (input: { id: string | number }) => Promise<void>;
      renameDocument: (input: {
        id: string | number;
        name: string;
      }) => Promise<{ id: string; name: string }>;
      rotateDocument: (input: {
        bundleId: string;
        documentId: string;
        pageNumber: number;
        rotation: number;
      }) => Promise<{ documentUrl?: string }>;
      importDocuments: (input: {
        bundleId: string | number;
        parentId?: string | null;
        files: Array<{
          name: string;
          path: string;
          mimeType?: string | null;
        }>;
      }) => Promise<{
        documents: Array<{
          id: string | number;
          parentId: string | null;
          name: string;
          type: string;
          url: string;
        }>;
        conversionStatuses?: DocumentImportStatus[];
      }>;
      getPathForFile: (file: File) => string;

      // ─── Highlights ────────────────────────────────────────────────────────
      getHighlights: (
        bundleId: string | number
      ) => Promise<DesktopHighlightRecord[]>;
      createHighlight: (input: {
        bundleId: string | number;
        data: CreateHighlightRequest;
      }) => Promise<DesktopHighlightRecord>;
      deleteHighlight: (input: {
        id: string | number;
      }) => Promise<{ id: string }>;

      // ─── Comments ──────────────────────────────────────────────────────────
      getComments: (
        bundleId: string | number
      ) => Promise<DesktopCommentRecord[]>;
      createComment: (input: {
        bundleId: string | number;
        data: CreateCommentRequest;
      }) => Promise<DesktopCommentRecord>;
      deleteComment: (input: {
        id: string | number;
      }) => Promise<{ id: string }>;

      // ─── Redactions ────────────────────────────────────────────────────────
      getRedactions: (
        bundleId: string | number
      ) => Promise<DesktopRedactionRecord[]>;
      createRedaction: (input: {
        bundleId: string | number;
        data: CreateRedactionRequest;
      }) => Promise<DesktopRedactionRecord>;
      deleteRedaction: (input: {
        id: string | number;
      }) => Promise<{ id: string }>;

      // ─── Cover Pages ──────────────────────────────────────────────────────
        listCoverPages: () => Promise<DesktopCoverPageRecord[]>;
        getCoverPageById: (id: string) => Promise<DesktopCoverPageRecord>;
        createCoverPage: (
          payload: CreateCoverPageRequest
        ) => Promise<DesktopCoverPageRecord>;
        updateCoverPage: (
          id: string,
          data: UpdateCoverPageRequest
        ) => Promise<void>;
        deleteCoverPage: (id: string) => Promise<{ id: string }>;
    };
  }
}