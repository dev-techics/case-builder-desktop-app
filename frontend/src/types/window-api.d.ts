import type {
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
  DesktopMergeDocumentsInput,
  DesktopMergeDocumentsResponse,
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

type DesktopProtocolPayload = {
  url: string;
  host: string;
  path: string;
  params: Record<string, string>;
};

declare global {
  interface Window {
    api?: {
      isDesktop?: true;
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
      getDocumentsTree: (bundleId: string | number) => Promise<FileTree>;
      createFolder: (input: DesktopCreateFolderInput) => Promise<DesktopCreateFolderResponse>;
      reorderDocuments: (input: DesktopReorderDocumentsInput) => Promise<FileTree>;
      moveDocument: (input: DesktopMoveDocumentInput) => Promise<FileTree>;
      deleteDocument: (input: DesktopDeleteDocumentInput) => Promise<void>;
      renameDocument: (input: DesktopRenameDocumentInput) => Promise<DesktopRenameDocumentResponse>;
      rotateDocument: (input: DesktopRotateDocumentInput) => Promise<DesktopRotateDocumentResponse>;
      mergeDocuments: (input: DesktopMergeDocumentsInput) => Promise<DesktopMergeDocumentsResponse>;
      importDocuments: (input: DesktopImportDocumentsInput) => Promise<DesktopImportDocumentsResponse>;
      getPathForFile: (file: File) => string;
      getHighlights: (bundleId: string | number) => Promise<DesktopHighlightRecord[]>;
      createHighlight: (input: DesktopCreateHighlightInput) => Promise<DesktopHighlightRecord>;
      deleteHighlight: (input: DesktopDeleteHighlightInput) => Promise<{ id: string }>;
      getComments: (bundleId: string | number) => Promise<DesktopCommentRecord[]>;
      createComment: (input: DesktopCreateCommentInput) => Promise<DesktopCommentRecord>;
      deleteComment: (input: DesktopDeleteCommentInput) => Promise<{ id: string }>;
      getRedactions: (bundleId: string | number) => Promise<DesktopRedactionRecord[]>;
      createRedaction: (input: DesktopCreateRedactionInput) => Promise<DesktopRedactionRecord>;
      deleteRedaction: (input: DesktopDeleteRedactionInput) => Promise<{ id: string }>;
      listCoverPages: () => Promise<DesktopCoverPageRecord[]>;
      getCoverPageById: (id: string) => Promise<DesktopCoverPageRecord>;
      createCoverPage: (payload: CreateCoverPageRequest) => Promise<DesktopCoverPageRecord>;
      updateCoverPage: (id: string, data: UpdateCoverPageRequest) => Promise<void>;
      deleteCoverPage: (id: string) => Promise<{ id: string }>;
      getSession: () => Promise<DesktopAuthSession>;
      login: (input: DesktopLoginInput) => Promise<DesktopAuthResult>;
      register: (input: DesktopRegisterInput) => Promise<DesktopAuthResult>;
      logout: () => Promise<{ success: boolean }>;
      checkLicense: () => Promise<LicenseCache>;
      openCheckout: (input?: {
        planId?: string;
        billingInterval?: 'monthly' | 'yearly';
      }) => Promise<{
        success: boolean;
        checkoutUrl?: string;
        approvalUrl?: string;
        paypalSubscriptionId?: string;
        subscriptionId?: string | number;
        status?: string;
        url?: string;
        error?: string;
      }>;
      getSubscriptionStatus: () => Promise<{
        success: boolean;
        status?: string;
        is_active?: boolean;
        days_left?: number;
        expires_at?: string | null;
        next_billing_at?: string | null;
        subscription?: {
          id: string | number;
          status: string;
          plan: string | null;
          plan_name: string | null;
          paypal_subscription_id: string | null;
          amount: string | null;
          currency: string | null;
        } | null;
        license?: LicenseCache | null;
        error?: string;
      }>;
      startTrial: () => Promise<{
        success: boolean;
        status?: string;
        message: string;
        license?: LicenseCache | null;
        error?: string;
      }>;
      onProtocolUrl: (
        cb: (payload: DesktopProtocolPayload) => void
      ) => () => void;
      onUpdateAvailable: (cb: UpdaterEventCallback) => void;
      onUpdateDownloaded: (cb: UpdaterEventCallback) => void;
      installUpdate: () => void;
    };
  }
}
