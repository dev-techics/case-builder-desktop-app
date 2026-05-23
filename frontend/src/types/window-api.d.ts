// frontend/src/types/window-api.d.ts

import type {
  DesktopAuthUser,
  DesktopAuthSession,
  DesktopAuthResult,
  DesktopLoginInput,
  DesktopRegisterInput,
} from './desktop/auth.types';
import type {
  DesktopBundleMetadata,
  DesktopCreateBundleInput,
  DesktopUpdateBundleInput,
  DesktopExportBundleInput,
  DesktopExportBundleResponse,
} from './desktop/bundle.types';
import type {
  DesktopCreateFolderInput,
  DesktopCreateFolderResponse,
  DesktopReorderDocumentsInput,
  DesktopMoveDocumentInput,
  DesktopDeleteDocumentInput,
  DesktopRenameDocumentInput,
  DesktopRenameDocumentResponse,
  DesktopRotateDocumentInput,
  DesktopRotateDocumentResponse,
  DesktopImportDocumentsInput,
  DesktopImportDocumentsResponse,
  FileTree,
} from './desktop/document.types';
import type {
  DesktopHighlightRecord,
  DesktopCreateHighlightInput,
  DesktopDeleteHighlightInput,
} from './desktop/highlight.types';
import type {
  DesktopCommentRecord,
  DesktopCreateCommentInput,
  DesktopDeleteCommentInput,
} from './desktop/comment.types';
import type {
  DesktopRedactionRecord,
  DesktopCreateRedactionInput,
  DesktopDeleteRedactionInput,
} from './desktop/redaction.types';
import type {
  DesktopCoverPageRecord,
  CreateCoverPageRequest,
  UpdateCoverPageRequest,
} from './desktop/cover-page.types';
import type { LicenseCache } from './desktop/license.types';
import type { UpdaterEventCallback } from './desktop/updater.types';

export {};

declare global {
  interface Window {
    api?: {
      isDesktop?: true;

      // ─── Bundles ─────────────────────────────────────────────────
      createBundle: (input: DesktopCreateBundleInput) => Promise<unknown>;
      getBundles: () => Promise<unknown[]>;
      deleteBundle: (id: string | number) => Promise<void>;
      updateBundle: (input: DesktopUpdateBundleInput) => Promise<unknown>;
      getBundleMetadata: (bundleId: string | number) => Promise<DesktopBundleMetadata>;
      updateBundleMetadata: (input: {
        bundleId: string | number;
        metadata: DesktopBundleMetadata;
      }) => Promise<DesktopBundleMetadata>;
      exportBundle: (input: DesktopExportBundleInput) => Promise<DesktopExportBundleResponse>;

      // ─── Documents ───────────────────────────────────────────────
      getDocumentsTree: (bundleId: string | number) => Promise<FileTree>;
      createFolder: (input: DesktopCreateFolderInput) => Promise<DesktopCreateFolderResponse>;
      reorderDocuments: (input: DesktopReorderDocumentsInput) => Promise<FileTree>;
      moveDocument: (input: DesktopMoveDocumentInput) => Promise<FileTree>;
      deleteDocument: (input: DesktopDeleteDocumentInput) => Promise<void>;
      renameDocument: (input: DesktopRenameDocumentInput) => Promise<DesktopRenameDocumentResponse>;
      rotateDocument: (input: DesktopRotateDocumentInput) => Promise<DesktopRotateDocumentResponse>;
      importDocuments: (input: DesktopImportDocumentsInput) => Promise<DesktopImportDocumentsResponse>;
      getPathForFile: (file: File) => string;

      // ─── Highlights ──────────────────────────────────────────────
      getHighlights: (bundleId: string | number) => Promise<DesktopHighlightRecord[]>;
      createHighlight: (input: DesktopCreateHighlightInput) => Promise<DesktopHighlightRecord>;
      deleteHighlight: (input: DesktopDeleteHighlightInput) => Promise<{ id: string }>;

      // ─── Comments ────────────────────────────────────────────────
      getComments: (bundleId: string | number) => Promise<DesktopCommentRecord[]>;
      createComment: (input: DesktopCreateCommentInput) => Promise<DesktopCommentRecord>;
      deleteComment: (input: DesktopDeleteCommentInput) => Promise<{ id: string }>;

      // ─── Redactions ──────────────────────────────────────────────
      getRedactions: (bundleId: string | number) => Promise<DesktopRedactionRecord[]>;
      createRedaction: (input: DesktopCreateRedactionInput) => Promise<DesktopRedactionRecord>;
      deleteRedaction: (input: DesktopDeleteRedactionInput) => Promise<{ id: string }>;

      // ─── Cover Pages ─────────────────────────────────────────────
      listCoverPages: () => Promise<DesktopCoverPageRecord[]>;
      getCoverPageById: (id: string) => Promise<DesktopCoverPageRecord>;
      createCoverPage: (payload: CreateCoverPageRequest) => Promise<DesktopCoverPageRecord>;
      updateCoverPage: (id: string, data: UpdateCoverPageRequest) => Promise<void>;
      deleteCoverPage: (id: string) => Promise<{ id: string }>;

      // ─── Auth ────────────────────────────────────────────────────
      getSession: () => Promise<DesktopAuthSession>;
      login: (input: DesktopLoginInput) => Promise<DesktopAuthResult>;
      register: (input: DesktopRegisterInput) => Promise<DesktopAuthResult>;
      logout: () => Promise<{ success: boolean }>;

      // ─── License ─────────────────────────────────────────────────
      checkLicense: () => Promise<LicenseCache>;

      // ─── Subscription ────────────────────────────────────────────
      openCheckout: () => Promise<{ success: boolean; url?: string; error?: string }>;

      // ─── Auto Updater ────────────────────────────────────────────
      onUpdateAvailable: (cb: UpdaterEventCallback) => void;
      onUpdateDownloaded: (cb: UpdaterEventCallback) => void;
      installUpdate: () => void;
    };
  }
}