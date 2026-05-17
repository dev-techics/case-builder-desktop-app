import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import type { CoverPageTemplate } from '../types';
import type { DesktopCoverPageRecord } from '@/types/window-api';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const toIpcError = (error: unknown): FetchBaseQueryError => ({
  status: 'CUSTOM_ERROR',
  error: error instanceof Error ? error.message : 'IPC request failed',
});

const mapCoverPage = (record: DesktopCoverPageRecord): CoverPageTemplate => ({
  id: record.id,
  name: record.name,
  description: record.description,
  type: record.type,
  isDefault: record.isDefault,
  html: record.html,
  builderState: record.designJson || null,
  createdAt: record.createdAt,
  updatedAt: record.updatedAt,
});

// ─── Payload Types ────────────────────────────────────────────────────────────

type CoverPagePayload = {
  name: string;
  description?: string;
  type: 'front' | 'back';
  isDefault?: boolean;
  html?: string;
  designJson?: string;
};

type BundleMetadataPayload = {
  front_cover_page_id?: string | null;
  back_cover_page_id?: string | null;
};

// ─── API Slice ────────────────────────────────────────────────────────────────

const coverPageApi = createApi({
  reducerPath: 'coverPageApi',
  baseQuery: fakeBaseQuery(),
  tagTypes: ['CoverPage'],
  endpoints: (build) => ({

    /*------------------------------------
        Fetch all cover page templates
    --------------------------------------*/
    getTemplates: build.query<CoverPageTemplate[], void>({
      queryFn: async () => {
        try {
          const coverPages = await window.api!.listCoverPages();
          return { data: coverPages.map(mapCoverPage) };
        } catch (error) {
          return { error: toIpcError(error) };
        }
      },
      providesTags: (result) =>
        result
          ? [
              { type: 'CoverPage', id: 'LIST' },
              ...result.map((template) => ({
                type: 'CoverPage' as const,
                id: template.id,
              })),
            ]
          : [{ type: 'CoverPage', id: 'LIST' }],
    }),

    /*--------------------------------------
        Fetch a single cover page by id
    ----------------------------------------*/
    getTemplate: build.query<CoverPageTemplate, string>({
      queryFn: async (id) => {
        try {
          const coverPage = await window.api!.getCoverPageById(id);
          return { data: mapCoverPage(coverPage) };
        } catch (error) {
          return { error: toIpcError(error) };
        }
      },
      providesTags: (_result, _error, id) => [{ type: 'CoverPage', id }],
    }),

    /*-----------------------------
        Create a new cover page
    -------------------------------*/
    createCoverPage: build.mutation<CoverPageTemplate, CoverPagePayload>({
      queryFn: async (payload) => {
        try {
          const coverPage = await window.api!.createCoverPage(payload);
          return { data: mapCoverPage(coverPage) };
        } catch (error) {
          return { error: toIpcError(error) };
        }
      },
      invalidatesTags: [{ type: 'CoverPage', id: 'LIST' }],
    }),

    /*--------------------------------
        Update an existing cover page
    ----------------------------------*/
    updateCoverPage: build.mutation<
      CoverPageTemplate,
      { id: string; data: CoverPagePayload }
    >({
      queryFn: async ({ id, data }) => {
        try {
          await window.api!.updateCoverPage(id, data);
          const updated = await window.api!.getCoverPageById(id);
          return { data: mapCoverPage(updated) };
        } catch (error) {
          return { error: toIpcError(error) };
        }
      },
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'CoverPage', id },
        { type: 'CoverPage', id: 'LIST' },
      ],
    }),

    /*--------------------------
        Delete a cover page
    ----------------------------*/
    deleteCoverPage: build.mutation<void, string>({
      queryFn: async (id) => {
        try {
          await window.api!.deleteCoverPage(id);
          return { data: undefined };
        } catch (error) {
          return { error: toIpcError(error) };
        }
      },
      invalidatesTags: (_result, _error, id) => [
        { type: 'CoverPage', id },
        { type: 'CoverPage', id: 'LIST' },
      ],
    }),

    /*-----------------------------------------------
        Update bundle metadata with cover page ids
    -------------------------------------------------*/
    updateBundleMetadata: build.mutation<
      unknown,
      { bundleId: string; metadata: BundleMetadataPayload }
    >({
      queryFn: async ({ bundleId, metadata }) => {
        try {
          const response = await window.api!.updateBundleMetadata({
            bundleId,
            metadata,
          });
          return { data: response };
        } catch (error) {
          return { error: toIpcError(error) };
        }
      },
    }),

  }),
});

export const {
  useGetTemplatesQuery,
  useGetTemplateQuery,
  useLazyGetTemplateQuery,
  useCreateCoverPageMutation,
  useUpdateCoverPageMutation,
  useDeleteCoverPageMutation,
  useUpdateBundleMetadataMutation,
} = coverPageApi;

export default coverPageApi;