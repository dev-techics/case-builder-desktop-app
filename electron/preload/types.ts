import type { documentsApi } from './documents.js';
import type { bundlesApi } from './bundles.js';
import type { highlightsApi } from './highlights.js';
import type { commentsApi } from './comments.js';
import type { redactionsApi } from './redactions.js';
import type { coverPageApi } from './coverPage.js';
import { authApi } from './auth.js';

export type DesktopApi = { isDesktop: true } & typeof documentsApi &
  typeof bundlesApi &
  typeof highlightsApi &
  typeof commentsApi &
  typeof redactionsApi &
  typeof coverPageApi &
  typeof authApi;

declare global {
  interface Window {
    api: DesktopApi;
  }
}
