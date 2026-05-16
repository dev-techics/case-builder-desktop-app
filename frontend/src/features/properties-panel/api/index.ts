import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import camelcaseKeys from 'camelcase-keys';

const BASE_URL = import.meta.env.VITE_BASE_URL;

const getDesktopApi = () =>
  typeof window === 'undefined' ? undefined : window.api;

const toIpcError = (error: unknown): FetchBaseQueryError => ({
  status: 'CUSTOM_ERROR',
  error: error instanceof Error ? error.message : 'IPC request failed',
});

export type ExportCompressionProfile =
  | 'none'
  | 'balanced'
  | 'small'
  | 'tiny'
  | 'extreme';

type RawMetadataPayload = {
  headerLeft?: string;
  headerRight?: string;
  header_left?: string;
  header_right?: string;
  footer?: string;
};

type MetadataResponse =
  | RawMetadataPayload
  | {
      metadata?: RawMetadataPayload | null;
    }
  | null
  | undefined;

export type PropertiesPanelMetadata = {
  headerLeft: string;
  headerRight: string;
  footer: string;
};

export type SaveMetaDataPayload = PropertiesPanelMetadata;

type RawDocumentMetadataResponse = {
  size?: number | string | null;
  original_name?: string | null;
  file_size?: number | string | null;
  page_count?: number | string | null;
  last_modified_at?: string | null;
};

type CamelizedDocumentMetadata = {
  size?: unknown;
  originalName?: unknown;
  fileSize?: unknown;
  pageCount?: unknown;
  lastModifiedAt?: unknown;
};

export type DocumentMetadata = {
  fileSizeBytes: number | null;
  originalName: string;
  pageCount: number | null;
  lastModifiedAt: string | null;
};
// Convert server response to match our redux state
const normalizeMetadata = (
  response: MetadataResponse
): PropertiesPanelMetadata => {
  const metadata = ((
    response as { metadata?: RawMetadataPayload | null } | null | undefined
  )?.metadata ??
    (response as RawMetadataPayload | null | undefined) ??
    {}) as RawMetadataPayload;

  return {
    headerLeft:
      typeof metadata.headerLeft === 'string'
        ? metadata.headerLeft
        : typeof metadata.header_left === 'string'
          ? metadata.header_left
          : '',
    headerRight:
      typeof metadata.headerRight === 'string'
        ? metadata.headerRight
        : typeof metadata.header_right === 'string'
          ? metadata.header_right
          : '',
    footer: typeof metadata.footer === 'string' ? metadata.footer : '',
  };
};

const toFiniteNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsedValue = Number.parseInt(value, 10);
    return Number.isFinite(parsedValue) ? parsedValue : null;
  }

  return null;
};

const toStringOrEmpty = (value: unknown): string =>
  typeof value === 'string' ? value : '';

const normalizeDocumentMetadata = (
  response: RawDocumentMetadataResponse | null | undefined
): DocumentMetadata => {
  const metadata = response
    ? (camelcaseKeys(response, { deep: true }) as CamelizedDocumentMetadata)
    : {};

  const fileSizeBytes =
    toFiniteNumber(metadata.fileSize) ?? toFiniteNumber(metadata.size);
  const pageCount = toFiniteNumber(metadata.pageCount);
  const lastModifiedAt = toStringOrEmpty(metadata.lastModifiedAt);

  return {
    fileSizeBytes,
    originalName: toStringOrEmpty(metadata.originalName),
    pageCount: pageCount !== null && pageCount >= 0 ? pageCount : null,
    lastModifiedAt: lastModifiedAt || null,
  };
};

export const propertiesPanelApi = createApi({
  reducerPath: 'propertiesPanelApi',
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
    credentials: 'include',
    prepareHeaders: headers => {
      if (!headers.has('accept')) {
        headers.set('accept', 'application/json');
      }
      const token = localStorage.getItem('access_token');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: builder => ({
    /*-----------------------------
        Save metadata to db
    -------------------------------*/
    saveMetaData: builder.mutation<
      PropertiesPanelMetadata,
      { bundleId: string; payload: SaveMetaDataPayload }
    >({
      async queryFn({ bundleId, payload }) {
        const desktopApi = getDesktopApi();
        
        if (!desktopApi?.updateBundleMetadata) {
          return {
            error: toIpcError(new Error('Desktop API unavailable :(')),
          };
        }

        try {
          const metadata = await desktopApi.updateBundleMetadata({
            bundleId,
            metadata: payload,
          });

          return { data: normalizeMetadata(metadata) };
        } catch (error) {
          return { error: toIpcError(error) };
        }
      },

      // Optimistically update the cache for getMetaData query
      async onQueryStarted(
        { bundleId, payload },
        { dispatch, queryFulfilled }
      ) {
        const patchResult = dispatch(
          propertiesPanelApi.util.updateQueryData(
            'getMetaData',
            { bundleId },
            draft => {
              if (!draft) {
                return;
              }

              draft.headerLeft = payload.headerLeft;
              draft.headerRight = payload.headerRight;
              draft.footer = payload.footer;
            }
          )
        );

        try {
          const { data } = await queryFulfilled;
          dispatch(
            propertiesPanelApi.util.upsertQueryData(
              'getMetaData',
              { bundleId },
              data
            )
          );
        } catch {
          patchResult.undo();
        }
      },
    }),
    /*------------------------------
        Get metadata from backend
    --------------------------------*/
    getMetaData: builder.query<PropertiesPanelMetadata, { bundleId: string }>({
      async queryFn({ bundleId }) {
        const desktopApi = getDesktopApi();

        if (!desktopApi?.getBundleMetadata) {
          return {
            error: toIpcError(new Error('Desktop API unavailable')),
          };
        }

        try {
          const metadata = await desktopApi.getBundleMetadata(bundleId);
          return { data: normalizeMetadata(metadata) };
        } catch (error) {
          return { error: toIpcError(error) };
        }
      },
    }),

    /*------------------------
      Get document metadata
    --------------------------*/
    getDocumentMetadata: builder.query<DocumentMetadata, string>({
      query: documentId => ({
        url: `/api/documents/${documentId}/document-metadata`,
        method: 'GET',
      }),
      transformResponse: normalizeDocumentMetadata,
      keepUnusedDataFor: 300,
    }),
  }),
});

export const {
  useSaveMetaDataMutation,
  useGetMetaDataQuery,
  useGetDocumentMetadataQuery,
} = propertiesPanelApi;
