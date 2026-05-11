import type { BundleStatus } from "@case-builder/ui";
import type { FileTree } from "@/features/file-explorer/types/fileTree";
import type { CreateHighlightRequest } from "@/features/toolbar/types/types";

export {};

type DocumentImportStatus = {
  fileName: string;
  status: 'success' | 'failed';
  message?: string;
};

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

declare global {
  interface Window {
    api?: {
      isDesktop?: boolean;
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
        items: Array<{
          id: string | number;
          order: number;
        }>;
      }) => Promise<FileTree>;
      moveDocument: (input: {
        id: string | number;
        newParentId: string | null;
      }) => Promise<FileTree>;
      deleteDocument: (input: { id: string | number }) => Promise<void>;
      renameDocument: (input: {
        id: string | number;
        name: string;
      }) => Promise<{
        id: string;
        name: string;
      }>;
      rotateDocument: (input: {
        bundleId: string;
        documentId: string;
        pageNumber: number;
        rotation: number;
      }) => Promise<{
        documentUrl?: string;
      }>;
      getHighlights: (
        bundleId: string | number
      ) => Promise<DesktopHighlightRecord[]>;
      createHighlight: (input: {
        bundleId: string | number;
        data: CreateHighlightRequest;
      }) => Promise<DesktopHighlightRecord>;
      deleteHighlight: (input: {
        id: string | number;
      }) => Promise<{
        id: string;
      }>;
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
    };
  }
}
