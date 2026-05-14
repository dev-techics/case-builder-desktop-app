import type { documentsApi } from './documents.js';
import type { bundlesApi } from './bundles.js';
import type { highlightsApi } from './highlights.js';
import type { commentsApi } from './comments.js';
import type { redactionsApi } from './redactions.js';
export type DesktopApi = { isDesktop: true } &
  typeof documentsApi &
  typeof bundlesApi &
  typeof highlightsApi &
  typeof commentsApi &
  typeof redactionsApi;

declare global {
  interface Window {
    api: DesktopApi;
  }
}
