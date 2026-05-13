import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';

// ─── Comment Types ────────────────────────────────────────────────────────────

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
  // Required to invalidate the correct bundle cache tag
  bundleId: string;
};

// ─── Redaction Types ──────────────────────────────────────────────────────────

export type RedactionRecord = {
  id: string;
  bundleId: string;
  documentId: string;
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
  fillHex: string;
  opacity: number;
  borderHex: string;
  borderWidth: number;
  createdAt: string;
  updatedAt: string;
};

export type CreateRedactionInput = {
  bundleId: string;
  data: {
    document_id: string;
    page_number: number;
    x: number;
    y: number;
    width: number;
    height: number;
    name: string;
    fill_hex: string;
    opacity: number;
    border_hex: string;
    border_width: number;
  };
};

export type DeleteRedactionInput = {
  id: string;
  // Required to invalidate the correct bundle cache tag
  bundleId: string;
};

// ─── Highlight Types ──────────────────────────────────────────────────────────

export type HighlightRecord = {
  id: string;
  bundleId: string;
  documentId: string;
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  colorName: string;
  colorHex: string;
  colorRgb: { r: number; g: number; b: number };
  opacity: number;
  createdAt: string;
  updatedAt: string;
};

export type CreateHighlightInput = {
  bundleId: string;
  data: {
    document_id: string;
    page_number: number;
    x: number;
    y: number;
    width: number;
    height: number;
    text: string;
    color_name: string;
    color_hex: string;
    color_rgb: { r: number; g: number; b: number };
    opacity: number;
  };
};

export type DeleteHighlightInput = {
  id: string;
  // Required to invalidate the correct bundle cache tag
  bundleId: string;
};

// ─── API Slice ────────────────────────────────────────────────────────────────

// fakeBaseQuery is used because all requests go through Electron IPC
// rather than a standard HTTP endpoint
export const toolbarApi = createApi({
  reducerPath: 'toolbarApi',
  baseQuery: fakeBaseQuery(),
  tagTypes: ['Comment', 'Redaction', 'Highlight'],
  endpoints: (builder) => ({

    /*-------------------------------
        GET all comments for a bundle
    --------------------------------*/
    getComments: builder.query<CommentRecord[], string>({
      queryFn: async (bundleId) => {
        try {
          const comments = await window.api!.getComments(bundleId);
          return { data: comments };
        } catch (error) {
          return { error: { status: 'CUSTOM_ERROR', error: String(error) } };
        }
      },
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
    ------------------------*/
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
      invalidatesTags: (_result, _error, input) => [
        { type: 'Comment', id: input.bundleId },
      ],
    }),

    /*-----------------------------
        DELETE a comment by id
    ------------------------------*/
    deleteComment: builder.mutation<{ id: string }, DeleteCommentInput>({
      queryFn: async (input) => {
        try {
          const result = await window.api!.deleteComment({ id: input.id });
          return { data: result };
        } catch (error) {
          return { error: { status: 'CUSTOM_ERROR', error: String(error) } };
        }
      },
      invalidatesTags: (_result, _error, input) => [
        { type: 'Comment', id: input.id },
        { type: 'Comment', id: input.bundleId },
      ],
    }),

    /*---------------------------------
        GET all redactions for a bundle
    ----------------------------------*/
    getRedactions: builder.query<RedactionRecord[], string>({
      queryFn: async (bundleId) => {
        try {
          const redactions = await window.api!.getRedactions(bundleId);
          return { data: redactions };
        } catch (error) {
          return { error: { status: 'CUSTOM_ERROR', error: String(error) } };
        }
      },
      providesTags: (result, _error, bundleId) => [
        { type: 'Redaction', id: bundleId },
        ...(result ?? []).map((redaction) => ({
          type: 'Redaction' as const,
          id: redaction.id,
        })),
      ],
    }),

    /*------------------------
        POST a new redaction
    -------------------------*/
    createRedaction: builder.mutation<RedactionRecord, CreateRedactionInput>({
      queryFn: async (input) => {
        try {
          const redaction = await window.api!.createRedaction({
            bundleId: input.bundleId,
            data: input.data,
          });
          return { data: redaction };
        } catch (error) {
          return { error: { status: 'CUSTOM_ERROR', error: String(error) } };
        }
      },
      invalidatesTags: (_result, _error, input) => [
        { type: 'Redaction', id: input.bundleId },
      ],
    }),

    /*------------------------------
        DELETE a redaction by id
    -------------------------------*/
    deleteRedaction: builder.mutation<{ id: string }, DeleteRedactionInput>({
      queryFn: async (input) => {
        try {
          const result = await window.api!.deleteRedaction({ id: input.id });
          return { data: result };
        } catch (error) {
          return { error: { status: 'CUSTOM_ERROR', error: String(error) } };
        }
      },
      invalidatesTags: (_result, _error, input) => [
        { type: 'Redaction', id: input.id },
        { type: 'Redaction', id: input.bundleId },
      ],
    }),

    /*---------------------------------
        GET all highlights for a bundle
    ----------------------------------*/
    getHighlights: builder.query<HighlightRecord[], string>({
      queryFn: async (bundleId) => {
        try {
          const highlights = await window.api!.getHighlights(bundleId);
          return { data: highlights };
        } catch (error) {
          return { error: { status: 'CUSTOM_ERROR', error: String(error) } };
        }
      },
      providesTags: (result, _error, bundleId) => [
        { type: 'Highlight', id: bundleId },
        ...(result ?? []).map((highlight) => ({
          type: 'Highlight' as const,
          id: highlight.id,
        })),
      ],
    }),

    /*------------------------
        POST a new highlight
    -------------------------*/
    createHighlight: builder.mutation<HighlightRecord, CreateHighlightInput>({
      queryFn: async (input) => {
        try {
          const highlight = await window.api!.createHighlight({
            bundleId: input.bundleId,
            data: input.data,
          });
          return { data: highlight };
        } catch (error) {
          return { error: { status: 'CUSTOM_ERROR', error: String(error) } };
        }
      },
      invalidatesTags: (_result, _error, input) => [
        { type: 'Highlight', id: input.bundleId },
      ],
    }),

    /*------------------------------
        DELETE a highlight by id
    -------------------------------*/
    deleteHighlight: builder.mutation<{ id: string }, DeleteHighlightInput>({
      queryFn: async (input) => {
        try {
          const result = await window.api!.deleteHighlight({ id: input.id });
          return { data: result };
        } catch (error) {
          return { error: { status: 'CUSTOM_ERROR', error: String(error) } };
        }
      },
      invalidatesTags: (_result, _error, input) => [
        { type: 'Highlight', id: input.id },
        { type: 'Highlight', id: input.bundleId },
      ],
    }),

  }),
});

// ─── Exported Hooks ───────────────────────────────────────────────────────────

export const {
  useGetCommentsQuery,
  useCreateCommentMutation,
  useDeleteCommentMutation,
  useGetRedactionsQuery,
  useCreateRedactionMutation,
  useDeleteRedactionMutation,
  useGetHighlightsQuery,
  useCreateHighlightMutation,
  useDeleteHighlightMutation,
} = toolbarApi;