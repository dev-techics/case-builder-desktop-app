// frontend/src/types/index.ts

export type { LicenseStatus, LicenseCache } from './desktop/license.types';
export type {
  DesktopAuthUser,
  DesktopAuthSession,
  DesktopAuthResult,
  DesktopLoginInput,
  DesktopRegisterInput,
} from './desktop/auth.types';
export type {
  DesktopBundleMetadata,
  DesktopCreateBundleInput,
  DesktopUpdateBundleInput,
  DesktopExportBundleInput,
  DesktopExportBundleResponse,
} from './desktop/bundle.types';
export type {
  DocumentImportStatus,
  DesktopImportDocumentsInput,
  DesktopImportDocumentsResponse,
} from './desktop/document.types';
export type {
  DesktopHighlightRecord,
  DesktopCreateHighlightInput,
} from './desktop/highlight.types';
export type {
  DesktopCommentRecord,
  CreateCommentRequest,
  DesktopCreateCommentInput,
} from './desktop/comment.types';
export type {
  DesktopRedactionRecord,
  CreateRedactionRequest,
  DesktopCreateRedactionInput,
} from './desktop/redaction.types';
export type {
  DesktopCoverPageRecord,
  CreateCoverPageRequest,
  UpdateCoverPageRequest,
} from './desktop/cover-page.types';