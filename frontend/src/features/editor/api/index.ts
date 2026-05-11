import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';

const getDesktopApi = () =>
  typeof window !== 'undefined' && window.api?.isDesktop ? window.api : undefined;

const toIpcError = (error: unknown): FetchBaseQueryError => ({
  status: 'CUSTOM_ERROR',
  error: error instanceof Error ? error.message : 'IPC request failed',
});

type RotateDocumentPageResponse = {
  documentId: string;
  pageNumber: number;
  documentUrl?: string;
};

type RotateDocumentPageRequest = {
  bundleId: string;
  documentId: string;
  pageNumber: number;
  rotation: number;
};

export const editorApi = createApi({
  reducerPath: 'editorApi',
  baseQuery: fakeBaseQuery<FetchBaseQueryError>(),
  endpoints: build => ({
    rotateDocumentPage: build.mutation<
      RotateDocumentPageResponse,
      RotateDocumentPageRequest
    >({
      async queryFn({ bundleId, documentId, pageNumber, rotation }) {
        const desktopApi = getDesktopApi();

        if (!desktopApi?.rotateDocument) {
          return {
            error: toIpcError(new Error('Desktop API unavailable')),
          };
        }

        try {
          const response = await desktopApi.rotateDocument({
            bundleId,
            documentId,
            pageNumber,
            rotation,
          });

          return {
            data: {
              documentId,
              pageNumber,
              documentUrl: response.documentUrl,
            },
          };
        } catch (error) {
          return { error: toIpcError(error) };
        }
      },
    }),
  }),
});

export const { useRotateDocumentPageMutation } = editorApi;
