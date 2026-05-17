import { contextBridge } from 'electron';
import { documentsApi } from './documents.js';
import { bundlesApi } from './bundles.js';
import { highlightsApi } from './highlights.js';
import { commentsApi } from './comments.js';
import { redactionsApi } from './redactions.js';
import { coverPageApi } from './coverPage.js';

contextBridge.exposeInMainWorld('api', {
  isDesktop: true,
  ...documentsApi,
  ...bundlesApi,
  ...highlightsApi,
  ...commentsApi,
  ...redactionsApi,
  ...coverPageApi,
});
