import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import type { Bundle } from '../types/types';
import type { CreateBundleDto } from './bundlesApi';

const normalizeBundle = (bundle: any): Bundle => {
  const documentCount =
    bundle?.documentCount ??
    bundle?.documentsCount ??
    bundle?.document_count ??
    bundle?.documents_count ??
    0;

  const updatedAt =
    bundle?.updatedAt ??
    bundle?.lastModified ??
    bundle?.last_modified ??
    bundle?.updated_at ??
    bundle?.createdAt ??
    bundle?.created_at ??
    undefined;

  return {
    id: bundle?.id,
    name: bundle?.name,
    caseNumber: bundle?.caseNumber ?? bundle?.case_number ?? '',
    documentCount,
    status: bundle?.status ?? 'In Progress',
    color: bundle?.color ?? 'blue',
    createdAt: bundle?.createdAt ?? bundle?.created_at,
    updatedAt,
    updatedBy: bundle?.updatedBy ?? bundle?.updated_by,
    description: bundle?.description,
    tags: bundle?.tags,
    userId: bundle?.userId ?? bundle?.user_id,
  };
};

type IpcError = {
  status: number | 'IPC_ERROR';
  data: unknown;
};

export const bundlesListApi = createApi({
  reducerPath: 'bundlesListApi',
  baseQuery: fakeBaseQuery<IpcError>(),
  tagTypes: ['Bundle'],
  endpoints: build => ({
    /*-------------------------
        Get bundles query
    ---------------------------*/
    getBundles: build.query<Bundle[], void>({
      async queryFn() {
        if (!window.api?.getBundles) {
          return {
            error: {
              status: 'IPC_ERROR',
              data: 'window.api.getBundles is not available. The renderer must run inside Electron.',
            },
          };
        }

        try {
          const payload = await window.api.getBundles();
          const bundles = Array.isArray(payload) ? payload : [];
          return { data: bundles.map(normalizeBundle) };
        } catch (error) {
          return {
            error: {
              status: 'IPC_ERROR',
              data:
                error instanceof Error
                  ? error.message
                  : 'Failed to fetch bundles via IPC',
            },
          };
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

    /*-------------------------
        Get bundle Id query
    ---------------------------*/
    getBundleById: build.query<Bundle, string | number>({
      async queryFn(bundleId) {
        if (!window.api?.getBundles) {
          return {
            error: {
              status: 'IPC_ERROR',
              data: 'window.api.getBundles is not available. The renderer must run inside Electron.',
            },
          };
        }

        try {
          const payload = await window.api.getBundles();
          const bundles = Array.isArray(payload) ? payload : [];
          const found = bundles.find(
            (bundle: any) => String(bundle?.id) === String(bundleId)
          );

          if (!found) {
            return {
              error: { status: 404, data: 'Bundle not found' },
            };
          }

          return { data: normalizeBundle(found) };
        } catch (error) {
          return {
            error: {
              status: 'IPC_ERROR',
              data:
                error instanceof Error
                  ? error.message
                  : 'Failed to fetch bundle via IPC',
            },
          };
        }
      },
      providesTags: (_result, _error, id) => [{ type: 'Bundle', id }],
    }),

    /*---------------------------
        Create bundle mutation
    -----------------------------*/
    createBundle: build.mutation<Bundle, CreateBundleDto>({
      async queryFn(bundleData) {
        if (!window.api?.createBundle) {
          return {
            error: {
              status: 'IPC_ERROR',
              data: 'window.api.createBundle is not available. The renderer must run inside Electron.',
            },
          };
        }

        try {
          const createdBundle = await window.api.createBundle({
            name: bundleData.name,
            caseNumber: bundleData.case_number,
          });
          return { data: normalizeBundle(createdBundle) };
        } catch (error) {
          return {
            error: {
              status: 'IPC_ERROR',
              data:
                error instanceof Error
                  ? error.message
                  : 'Failed to create bundle via IPC',
            },
          };
        }
      },
      invalidatesTags: result =>
        result
          ? [
              { type: 'Bundle', id: 'LIST' },
              { type: 'Bundle', id: result.id },
            ]
          : [{ type: 'Bundle', id: 'LIST' }],
    }),

    /*----------------------------
        Delete bundle mutation
    ------------------------------*/
    deleteBundle: build.mutation<string | number, string | number>({
      async queryFn(bundleId) {
        if (!window.api?.deleteBundle) {
          return {
            error: {
              status: 'IPC_ERROR',
              data: 'window.api.deleteBundle is not available. The renderer must run inside Electron.',
            },
          };
        }

        try {
          await window.api.deleteBundle(bundleId);
          return { data: bundleId };
        } catch (error) {
          return {
            error: {
              status: 'IPC_ERROR',
              data:
                error instanceof Error
                  ? error.message
                  : 'Failed to delete bundle via IPC',
            },
          };
        }
      },
      invalidatesTags: (_result, _error, id) => [
        { type: 'Bundle', id: 'LIST' },
        { type: 'Bundle', id },
      ],
    }),
  }),
});

export const {
  useGetBundlesQuery,
  useGetBundleByIdQuery,
  useCreateBundleMutation,
  useDeleteBundleMutation,
} = bundlesListApi;

export default bundlesListApi;
