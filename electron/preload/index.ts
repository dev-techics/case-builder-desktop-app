import { contextBridge } from 'electron';
import { documentsApi } from './documents.js';
import { bundlesApi } from './bundles.js';
import { highlightsApi } from './highlights.js';
import { commentsApi } from './comments.js';
import { redactionsApi } from './redactions.js';

contextBridge.exposeInMainWorld('api', {
  ...documentsApi,
  ...bundlesApi,
  ...highlightsApi,
  ...commentsApi,
  ...redactionsApi,
});
