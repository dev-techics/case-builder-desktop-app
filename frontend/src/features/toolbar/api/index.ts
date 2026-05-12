import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type CommentRecord = {
  id: string;
  bundleId: string;
  documentId: string;
  pageNumber: number;
  text: string;
  selectedText: string;
  x: number;
  y: number;
  pageY: number;
  resolved: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateCommentInput = {
  bundleId: string;
  data: {
    document_id: string;
    page_number: number;
    text: string;
    selected_text?: string;
    x: number;
    y: number;
    page_y: number;
  };
};

export type DeleteCommentInput = {
  id: string;
  // Passed to invalidate the correct cache tag
  bundleId: string;
};

// ─── API Slice ────────────────────────────────────────────────────────────────

// We use fakeBaseQuery since all requests go through Electron IPC
// rather than a standard HTTP endpoint
export const toolbarApi = createApi({
  reducerPath: 'toolbarApi',
  baseQuery: fakeBaseQuery(),
  tagTypes: ['Comment'],
  endpoints: (builder) => ({

    /* -------------------------------
        GET all comments for a bundle 
    -----------------------------------*/
    getComments: builder.query<CommentRecord[], string>({
      queryFn: async (bundleId) => {
        try {
          const comments = await window.api!.getComments(bundleId);
          return { data: comments };
        } catch (error) {
          return { error: { status: 'CUSTOM_ERROR', error: String(error) } };
        }
      },
      // Cache is scoped per bundle so switching bundles fetches fresh data
      providesTags: (result, _error, bundleId) => [
        { type: 'Comment', id: bundleId },
        ...(result ?? []).map((comment) => ({
          type: 'Comment' as const,
          id: comment.id,
        })),
      ],
    }),

    /*----------------------- 
        POST a new comment 
    -------------------------*/
    createComment: builder.mutation<CommentRecord, CreateCommentInput>({
      queryFn: async (input) => {
        try {
          const comment = await window.api!.createComment({
            bundleId: input.bundleId,
            data: input.data,
          });
          return { data: comment };
        } catch (error) {
          return { error: { status: 'CUSTOM_ERROR', error: String(error) } };
        }
      },
      // Refetch the comment list for the bundle after creation
      invalidatesTags: (_result, _error, input) => [
        { type: 'Comment', id: input.bundleId },
      ],
    }),

    /*-----------------------------
        DELETE a comment by id
    -------------------------------*/
    deleteComment: builder.mutation<{ id: string }, DeleteCommentInput>({
      queryFn: async (input) => {
        try {
          const result = await window.api!.deleteComment({ id: input.id });
          return { data: result };
        } catch (error) {
          return { error: { status: 'CUSTOM_ERROR', error: String(error) } };
        }
      },
      // Invalidate both the individual comment and the bundle list
      invalidatesTags: (_result, _error, input) => [
        { type: 'Comment', id: input.id },
        { type: 'Comment', id: input.bundleId },
      ],
    }),

  }),
});

// ─── Exported Hooks ───────────────────────────────────────────────────────────

export const {
  useGetCommentsQuery,
  useCreateCommentMutation,
  useDeleteCommentMutation,
} = toolbarApi;