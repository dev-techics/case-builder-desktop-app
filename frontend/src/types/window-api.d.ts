import type { BundleStatus } from "@case-builder/ui";
import type { FileTree } from "@/features/file-explorer/types/fileTree";

export {};

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
        conversionStatuses?: unknown[];
      }>;
      getPathForFile: (file: File) => string;
    };
  }
}
