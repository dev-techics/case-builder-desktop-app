import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { Bundle, BundleStatus } from '../types';
import type { CreateBundleDto } from '../types';
import {
  normalizeBundleListResponse,
  normalizeBundleResponse,
} from '../utils/normalizers';

const BASE_URL = import.meta.env.VITE_BASE_URL;

const getDesktopApi = () =>
  typeof window !== 'undefined' && window.api?.isDesktop ? window.api : undefined;

const toIpcError = (error: unknown) => ({
  status: 'CUSTOM_ERROR' as const,
  error: error instanceof Error ? error.message : 'IPC request failed',
});

type RenameBundleRequest = {
  bundleId: string | number;
  name: string;
};

type UpdateBundleStatusRequest = {
  bundleId: string | number;
  status: BundleStatus;
};

const patchBundle = (
  draft: Bundle[],
  bundleId: string | number,
  updates: Partial<Pick<Bundle, 'name' | 'status'>>
) => {
  const bundle = draft.find(item => item.id === bundleId);

  if (bundle) {
    Object.assign(bundle, updates);
  }
};

export const bundleListApi = createApi({
  reducerPath: 'bundleListApi',
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
    credentials: 'include',
    prepareHeaders: headers => {
      headers.set('accept', 'application/json');
      const token = localStorage.getItem('access_token');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Bundle'],
  endpoints: build => ({
    /*----------------------
        Fetch all bundles
    ------------------------*/
    getBundles: build.query<Bundle[], void>({
      queryFn: async () => {
        const desktopApi = getDesktopApi();

        if (!desktopApi?.getBundles) {
          return {
            error: toIpcError(new Error('Desktop API unavailable')),
          };
        }

        try {
          const bundles = await desktopApi.getBundles();
          return { data: normalizeBundleListResponse(bundles) };
        } catch (error) {
          return { error: toIpcError(error) };
        }
      },
      providesTags: result =>
        result
          ? [
              { type: 'Bundle', id: 'LIST' },
              ...result.map(bundle => ({
                type: 'Bundle' as const,
                id: bundle.id,
              })),
            ]
          : [{ type: 'Bundle', id: 'LIST' }],
    }),

    /*--------------------------
        Fetch a single bundle
    ----------------------------*/
    getBundleById: build.query<Bundle, string | number>({
      query: bundleId => `/api/bundles/${bundleId}`,
      transformResponse: normalizeBundleResponse,
      providesTags: (_result, _error, bundleId) => [
        { type: 'Bundle', id: bundleId },
      ],
    }),

    /*--------------------------
        Create a new bundle
    ----------------------------*/
    createBundle: build.mutation<Bundle, CreateBundleDto>({
      queryFn: async (bundleData, _api, _extraOptions) => {
        const desktopApi = getDesktopApi();

        if (!desktopApi?.createBundle) {
          return {
            error: toIpcError(new Error('Desktop API unavailable')),
          };
        }

        try {
          const bundle = await desktopApi.createBundle({
            name: bundleData.name,
            caseNumber: bundleData.caseNumber,
            status: bundleData.status,
            description: bundleData.description,
            tags: bundleData.tags,
          });

          return { data: normalizeBundleResponse(bundle) };
        } catch (error) {
          return { error: toIpcError(error) };
        }
      },
      invalidatesTags: [{ type: 'Bundle', id: 'LIST' }],
    }),

    /*--------------------------
        Rename an existing bundle
    ----------------------------*/
    renameBundle: build.mutation<Bundle, RenameBundleRequest>({
      queryFn: async (updateData, _api, _extraOptions) => {
        const desktopApi = getDesktopApi();

        if (!desktopApi?.updateBundle) {
          return {
            error: toIpcError(new Error('Desktop API unavailable')),
          };
        }

        try {
          const updatedBundle = await desktopApi.updateBundle({
            id: updateData.bundleId,
            name: updateData.name,
          });

          return { data: normalizeBundleResponse(updatedBundle) };
        } catch (error) {
          return { error: toIpcError(error) };
        }
      },
      async onQueryStarted({ bundleId, name }, { dispatch, queryFulfilled }) {
        const listPatch = dispatch(
          bundleListApi.util.updateQueryData('getBundles', undefined, draft => {
            patchBundle(draft, bundleId, { name });
          })
        );
        const bundlePatch = dispatch(
          bundleListApi.util.updateQueryData(
            'getBundleById',
            bundleId,
            draft => {
              draft.name = name;
            }
          )
        );

        try {
          await queryFulfilled;
        } catch {
          listPatch.undo();
          bundlePatch.undo();
        }
      },
      invalidatesTags: (_result, _error, { bundleId }) => [
        { type: 'Bundle', id: bundleId },
        { type: 'Bundle', id: 'LIST' },
      ],
    }),

    /*------------------------------
        Update an existing status
    --------------------------------*/
    updateBundleStatus: build.mutation<Bundle, UpdateBundleStatusRequest>({
      queryFn: async (updateData, _api, _extraOptions) => {
        const desktopApi = getDesktopApi();

        if (!desktopApi?.updateBundle) {
          return {
            error: toIpcError(new Error('Desktop API unavailable')),
          };
        }

        try {
          const updatedBundle = await desktopApi.updateBundle({
            id: updateData.bundleId,
            status: updateData.status,
          });

          return { data: normalizeBundleResponse(updatedBundle) };
        } catch (error) {
          return { error: toIpcError(error) };
        }
      },
      async onQueryStarted(
        { bundleId, status },
        { dispatch, queryFulfilled }
      ) {
        const listPatch = dispatch(
          bundleListApi.util.updateQueryData('getBundles', undefined, draft => {
            patchBundle(draft, bundleId, { status });
          })
        );
        const bundlePatch = dispatch(
          bundleListApi.util.updateQueryData(
            'getBundleById',
            bundleId,
            draft => {
              draft.status = status;
            }
          )
        );

        try {
          await queryFulfilled;
        } catch {
          listPatch.undo();
          bundlePatch.undo();
        }
      },
      invalidatesTags: (_result, _error, { bundleId }) => [
        { type: 'Bundle', id: bundleId },
        { type: 'Bundle', id: 'LIST' },
      ],
    }),

    /*--------------------------
        Delete an existing bundle
    ----------------------------*/
    deleteBundle: build.mutation<void, string | number>({
      queryFn: async (bundleId, _api, _extraOptions) => {
        const desktopApi = getDesktopApi();

        if (!desktopApi?.deleteBundle) {
          return {
            error: toIpcError(new Error('Desktop API unavailable')),
          };
        }

        try {
          await desktopApi.deleteBundle(bundleId);
          return { data: undefined };
        } catch (error) {
          return { error: toIpcError(error) };
        }
      },
      invalidatesTags: (_result, _error, bundleId) => [
        { type: 'Bundle', id: bundleId },
        { type: 'Bundle', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetBundlesQuery,
  useGetBundleByIdQuery,
  useLazyGetBundleByIdQuery,
  useCreateBundleMutation,
  useRenameBundleMutation,
  useUpdateBundleStatusMutation,
  useDeleteBundleMutation,
} = bundleListApi;

export default bundleListApi;
