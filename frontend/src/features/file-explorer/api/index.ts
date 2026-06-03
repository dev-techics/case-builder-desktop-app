import type { FileTree, ServerFileTreeNode } from '../types/fileTree';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const BaseQuery = import.meta.env.VITE_BASE_URL;
const getDesktopApi = () =>
  typeof window !== 'undefined' && window.api?.isDesktop ? window.api : undefined;

const toIpcError = (error: unknown) => ({
  status: 'CUSTOM_ERROR' as const,
  error: error instanceof Error ? error.message : 'IPC request failed',
});

type DesktopFileInput = {
  name: string;
  path: string;
  mimeType?: string | null;
};

type DocumentImportStatus = {
  fileName: string;
  status: 'success' | 'failed';
  message?: string;
};

type UploadFilesResponse = {
  documents: Array<{
    id: string | number;
    parentId: string | null;
    name: string;
    type: string;
    url: string;
  }>;
  conversionStatuses?: DocumentImportStatus[];
};


type CreateFolderDesktopResponse = {
  id: string | number;
  name: string;
  type: 'folder';
  parentId: string | null;
};

type MergeDocumentsMutationResponse = {
  tree: FileTree;
  mergedDocumentId?: string;
  mergedDocumentName?: string;
};

export const fileTreeApi = createApi({
  reducerPath: 'fileTreeApi',
  baseQuery: fetchBaseQuery({
    baseUrl: BaseQuery,
    credentials: 'include',
    prepareHeaders: headers => {
      const token = localStorage.getItem('access_token');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: build => ({
    /*--------------------------
        Get file tree
    ----------------------------*/
    getTree: build.query<FileTree, string | number>({
      async queryFn(bundleId) {
        const desktopApi = getDesktopApi();

        if (!desktopApi?.getDocumentsTree) {
          return {
            error: toIpcError(new Error('Desktop API unavailable')),
          };
        }

        try {
          const tree = await desktopApi.getDocumentsTree(bundleId);
          return { data: tree };
        } catch (error) {
          return { error: toIpcError(error) };
        }
      },
    }),

    /*--------------------------
        Delete document
    ----------------------------*/
    deleteDocument: build.mutation<
      { documentId: string },
      { documentId: string }
    >({
      async queryFn({ documentId }) {
        const desktopApi = getDesktopApi();

        if (!desktopApi?.deleteDocument) {
          return {
            error: toIpcError(new Error('Desktop API unavailable')),
          };
        }

        try {
          await desktopApi.deleteDocument({ id: documentId });
          return {
            data: {
              documentId,
            },
          };
        } catch (error) {
          return { error: toIpcError(error) };
        }
      },
    }),

    /*--------------------------
        Rename document
    ----------------------------*/
    renameDocument: build.mutation<
      { id: string; newName: string },
      { documentId: string; newName: string }
    >({
      async queryFn({ documentId, newName }) {
        const desktopApi = getDesktopApi();

        if (!desktopApi?.renameDocument) {
          return {
            error: toIpcError(new Error('Desktop API unavailable')),
          };
        }

        try {
          const renamedDocument = await desktopApi.renameDocument({
            id: documentId,
            name: newName,
          });

          return {
            data: {
              id: String(renamedDocument.id ?? documentId),
              newName:
                typeof renamedDocument.name === 'string'
                  ? renamedDocument.name
                  : newName,
            },
          };
        } catch (error) {
          return { error: toIpcError(error) };
        }
      },
    }),

    /*--------------------------
        Create folder
    ----------------------------*/
    createFolder: build.mutation<
      ServerFileTreeNode,
      { bundleId: string; name: string; parentId?: string | null }
    >({
      async queryFn({ bundleId, name, parentId }) {
        const desktopApi = getDesktopApi();

        if (!desktopApi?.createFolder) {
          return {
            error: toIpcError(new Error('Desktop API unavailable')),
          };
        }

        try {
          const folder =
            (await desktopApi.createFolder({
              bundleId,
              name,
              parentId,
            })) as CreateFolderDesktopResponse;

          return {
            data: {
              id: folder.id,
              name: folder.name,
              type: folder.type,
              parentId: folder.parentId,
            },
          };
        } catch (error) {
          return { error: toIpcError(error) };
        }
      },
    }),

    /*--------------------------
        Upload files mutation
    ----------------------------*/
    uploadFiles: build.mutation<
      UploadFilesResponse | string,
      {
        bundleId: string;
        formData: FormData;
      }
    >({
      async queryFn({ bundleId, formData }) {
        const desktopApi = getDesktopApi();

        if (!desktopApi?.importDocuments || !desktopApi.getPathForFile) {
          return {
            error: toIpcError(new Error('Desktop API unavailable')),
          };
        }

        const fileEntries = formData
          .getAll('files[]')
          .filter((entry): entry is File => entry instanceof File);
        const desktopFiles: DesktopFileInput[] = [];

        for (const entry of fileEntries) {
          const filePath = desktopApi.getPathForFile(entry)?.trim();
          if (!filePath) {
            return {
              error: toIpcError(
                new Error(
                  'Selected files are missing local paths. Please retry the import from the desktop app.'
                )
              ),
            };
          }

          desktopFiles.push({
            name: entry.name,
            path: filePath,
            mimeType: entry.type || null,
          });
        }

        const parentIdEntry = formData.get('parent_id');
        const parentId =
          typeof parentIdEntry === 'string' && parentIdEntry.trim()
            ? parentIdEntry
            : null;

        try {
          const result = await desktopApi.importDocuments({
            bundleId,
            parentId,
            files: desktopFiles,
          });
          return { data: result };
        } catch (error) {
          return { error: toIpcError(error) };
        }
      },
    }),

    /*--------------------------
        Reorder documents
    ----------------------------*/
    reorderDocuments: build.mutation<
      { bundleId: string; tree: FileTree },
      { bundleId: string; items: Array<{ id: string; order: number }> }
    >({
      async queryFn({ bundleId, items }) {
        const desktopApi = getDesktopApi();

        if (!desktopApi?.reorderDocuments) {
          return {
            error: toIpcError(new Error('Desktop API unavailable')),
          };
        }

        try {
          const tree = await desktopApi.reorderDocuments({
            bundleId,
            items,
          });

          return { data: { bundleId, tree } };
        } catch (error) {
          return { error: toIpcError(error) };
        }
      },
    }),

    /*--------------------------
        Move documents batch
    ----------------------------*/
    moveDocumentsBatch: build.mutation<
      { tree: FileTree; skipApplyTree?: boolean },
      {
        bundleId: string;
        documentIds: string[];
        newParentId: string | null;
        skipApplyTree?: boolean;
      }
    >({
      async queryFn(
        { bundleId, documentIds, newParentId, skipApplyTree},
        _api,
        _extraOptions,
      ) {

        const desktopApi = getDesktopApi();

        if (!desktopApi?.moveDocument) {
          return {
            error: toIpcError(new Error('Desktop API unavailable')),
          };
        }

        for (const documentId of documentIds) {
          const moveResult = await desktopApi.moveDocument({
            id: documentId,
            newParentId,
          });

          if ('error' in moveResult) {
            return { error: moveResult.error as FetchBaseQueryError };
          }
        }

        const treeResult = await desktopApi.getDocumentsTree(bundleId);

        if ('error' in treeResult) {
          return { error: treeResult.error as FetchBaseQueryError };
        }

        return {
      data: {
        tree: treeResult,
        skipApplyTree,
      },
    };
      },
    }),

    /*--------------------------
        Merge documents
    ----------------------------*/
    mergeDocuments: build.mutation<
      MergeDocumentsMutationResponse,
      {
        bundleId: string;
        documentIds: string[];
        name: string;
        parentId: string | null;
      }
    >({
      async queryFn(
        { bundleId, documentIds, name, parentId }
      ) {
        const desktopApi = getDesktopApi();

        if (!desktopApi?.mergeDocuments) {
          return {
            error: toIpcError(new Error('Desktop API unavailable')),
          };
        }

        try {
          const mergeResult = await desktopApi.mergeDocuments({
            bundleId,
            documentIds,
            name,
            parentId,
          });

          return {
            data: {
              tree: mergeResult.tree,
              mergedDocumentId: String(mergeResult.document.id),
              mergedDocumentName: mergeResult.document.name,
            },
          };
        } catch (error) {
          return { error: toIpcError(error) };
        }
      },
    }),
  }),
});

export const {
  useCreateFolderMutation,
  useDeleteDocumentMutation,
  useGetTreeQuery,
  useMergeDocumentsMutation,
  useMoveDocumentsBatchMutation,
  useRenameDocumentMutation,
  useReorderDocumentsMutation,
  useUploadFilesMutation,
} = fileTreeApi;
