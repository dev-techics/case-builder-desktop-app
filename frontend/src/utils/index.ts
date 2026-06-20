import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";

export const toIpcError = (error: unknown): FetchBaseQueryError  => ({
  status: 'CUSTOM_ERROR' as const,
  error: error instanceof Error ? error.message : 'IPC request failed',
});