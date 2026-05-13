import {
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit';
import type {
  AnnotationTool,
  Comment,
  EditorState,
  Highlight,
  PendingComment,
  PendingHighlight,
  Redaction,
  RedactionStyle,
} from '@/features/toolbar/types/types';
import { toolbarApi } from '../api';

// type DesktopApi = NonNullable<Window['api']>;

// type DesktopHighlightRecord = Awaited<
//   ReturnType<DesktopApi['getHighlights']>
// >[number];


// const mapDesktopHighlight = (highlight: DesktopHighlightRecord): Highlight => ({
//   id: highlight.id,
//   fileId: highlight.documentId,
//   pageNumber: highlight.pageNumber,
//   coordinates: {
//     x: highlight.x,
//     y: highlight.y,
//     width: highlight.width,
//     height: highlight.height,
//   },
//   text: highlight.text,
//   color: {
//     name: highlight.colorName,
//     hex: highlight.colorHex,
//     rgb: highlight.colorRgb,
//     opacity: highlight.opacity,
//   },
//   createdAt: highlight.createdAt,
// });

const initialState: EditorState = {
  activeTool: 'select',
  redactionStyle: {
    name: 'Black',
    fillHex: '#000000',
    opacity: 1,
    borderHex: '#000000',
    borderWidth: 2,
  },
  ToolbarPosition: { x: null, y: null },
  CommentPosition: { x: null, y: null },
  pendingHighlight: null,
  pendingComment: null,
  highlights: [],
  redactions: [],
  comments: [],
  isCommentExpended: false,
  // Highlights loading states
  loadingHighlights: false,
  highlightError: null,
  // Redactions loading states
  loadingRedactions: false,
  redactionError: null,
  // Comments loading states
  loadingComments: false,
  commentError: null,
};

/*=============================================
=            Async Thunks                     =
=============================================*/

// const mapRedactionFromApi = (r: RedactionApiResponse): Redaction => ({
//   id: String(r.id),
//   fileId: String(r.documentId),
//   pageNumber: r.pageNumber,
//   coordinates: {
//     x: r.x,
//     y: r.y,
//     width: r.width,
//     height: r.height,
//   },
//   style: {
//     name: r.name || 'Custom',
//     fillHex: r.opacity === 0 ? null : r.fillHex,
//     opacity: r.opacity ?? 1,
//     borderHex: r.borderHex || '#000000',
//     borderWidth: r.borderWidth ?? 2,
//   },
//   createdAt: r.createdAt,
// });

/*=============================================
=            Redux Slice                      =
=============================================*/

const toolbarSlice = createSlice({
  name: 'toolbar',
  initialState,
  reducers: {
    // Active annotation tool
    setActiveTool: (state, action: PayloadAction<AnnotationTool>) => {
      state.activeTool = action.payload;
    },

    setRedactionStyle: (state, action: PayloadAction<RedactionStyle>) => {
      state.redactionStyle = action.payload;
    },

    // Toolbar position
    setToolbarPosition: (
      state,
      action: PayloadAction<{ x: number | null; y: number | null }>
    ) => {
      state.ToolbarPosition = action.payload;
    },

    // Store pending highlight (before color is selected)
    setPendingHighlight: (
      state,
      action: PayloadAction<PendingHighlight | null>
    ) => {
      state.pendingHighlight = action.payload;
    },

    // Add highlight (local only - use createHighlight thunk for API)
    addHighlight: (state, action: PayloadAction<Highlight>) => {
      state.highlights.push(action.payload);
    },

    // Remove a specific highlight (local only - use deleteHighlight thunk for API)
    removeHighlight: (state, action: PayloadAction<string>) => {
      state.highlights = state.highlights.filter(h => h.id !== action.payload);
    },

    // Clear all highlights
    clearHighlights: state => {
      state.highlights = [];
    },

    // Clear highlights for a specific file (local only)
    clearFileHighlights: (state, action: PayloadAction<string>) => {
      state.highlights = state.highlights.filter(
        h => h.fileId !== action.payload
      );
    },

    // Clear highlights for a specific page (local only)
    clearPageHighlights: (
      state,
      action: PayloadAction<{ fileId: string; pageNumber: number }>
    ) => {
      state.highlights = state.highlights.filter(
        h =>
          h.fileId !== action.payload.fileId ||
          h.pageNumber !== action.payload.pageNumber
      );
    },

    // Cancel highlight creation
    cancelHighlight: state => {
      state.ToolbarPosition = { x: null, y: null };
      state.pendingHighlight = null;
    },

    // Redactions
    addRedaction: (state, action: PayloadAction<Redaction>) => {
      state.redactions.push(action.payload);
    },

    removeRedaction: (state, action: PayloadAction<string>) => {
      state.redactions = state.redactions.filter(
        r => r.id !== action.payload
      );
    },

    clearRedactions: state => {
      state.redactions = [];
    },

    clearFileRedactions: (state, action: PayloadAction<string>) => {
      state.redactions = state.redactions.filter(
        r => r.fileId !== action.payload
      );
    },

    clearPageRedactions: (
      state,
      action: PayloadAction<{ fileId: string; pageNumber: number }>
    ) => {
      state.redactions = state.redactions.filter(
        r =>
          r.fileId !== action.payload.fileId ||
          r.pageNumber !== action.payload.pageNumber
      );
    },

    // Clear error
    clearHighlightError: state => {
      state.highlightError = null;
    },

    // Comment position
    setCommentPosition: (
      state,
      action: PayloadAction<{ x: number | null; y: number | null }>
    ) => {
      state.CommentPosition = action.payload;
    },

    // Set pending comment (before submission)
    setPendingComment: (
      state,
      action: PayloadAction<PendingComment | null>
    ) => {
      state.pendingComment = action.payload;
    },

    // Add comment (after submission)
    addComment: (state, action: PayloadAction<Comment>) => {
      state.comments.push(action.payload);
      state.CommentPosition = { x: null, y: null };
      state.pendingComment = null;
      state.ToolbarPosition = { x: null, y: null };
    },

    // Update comment text
    updateComment: (
      state,
      action: PayloadAction<{ id: string; text: string }>
    ) => {
      const comment = state.comments.find(c => c.id === action.payload.id);
      if (comment) {
        comment.text = action.payload.text;
        comment.updatedAt = new Date().toISOString();
      }
    },

    // Delete comment
    deleteComment: (state, action: PayloadAction<string>) => {
      state.comments = state.comments.filter(c => c.id !== action.payload);
    },

    // Resolve/Unresolve comment
    toggleCommentResolved: (state, action: PayloadAction<string>) => {
      const comment = state.comments.find(c => c.id === action.payload);
      if (comment) {
        comment.resolved = !comment.resolved;
      }
    },

    // Clear comments for a specific file
    clearFileComments: (state, action: PayloadAction<string>) => {
      state.comments = state.comments.filter(c => c.fileId !== action.payload);
    },

    // Clear comments for a specific page
    clearPageComments: (
      state,
      action: PayloadAction<{ fileId: string; pageNumber: number }>
    ) => {
      state.comments = state.comments.filter(
        c =>
          c.fileId !== action.payload.fileId ||
          c.pageNumber !== action.payload.pageNumber
      );
    },

    // Cancel comment creation
    cancelCommentCreation: state => {
      state.CommentPosition = { x: null, y: null };
      state.pendingComment = null;
    },

    setIsCommentExpanded: state => {
      state.isCommentExpended = !state.isCommentExpended;
    },
  },

  extraReducers: builder => {
    /*-------------------
      Load Highlights
    -------------------*/
   builder
  .addMatcher(
    toolbarApi.endpoints.getHighlights.matchPending,
    (state) => {
      state.loadingHighlights = true;
      state.highlightError = null;
    }
  )
  .addMatcher(
    toolbarApi.endpoints.getHighlights.matchFulfilled,
    (state, action) => {
      state.loadingHighlights = false;
      state.highlights = action.payload.map((h) => ({
        id: h.id,
        fileId: h.documentId,
        pageNumber: h.pageNumber,
        coordinates: {
          x: h.x,
          y: h.y,
          width: h.width,
          height: h.height,
        },
        text: h.text,
        color: {
          name: h.colorName,
          hex: h.colorHex,
          rgb: h.colorRgb,
          opacity: h.opacity,
        },
        createdAt: h.createdAt,
      }));
    }
  )
  .addMatcher(
    toolbarApi.endpoints.getHighlights.matchRejected,
    (state, action) => {
      state.loadingHighlights = false;
      state.highlightError = action.error.message ?? 'Failed to load highlights';
    }
  );
 
// ─── Create Highlight ─────────────────────────────────────────────────────────
 
builder
  .addMatcher(
    toolbarApi.endpoints.createHighlight.matchPending,
    (state) => {
      state.highlightError = null;
    }
  )
  .addMatcher(
    toolbarApi.endpoints.createHighlight.matchFulfilled,
    (state, action) => {
      const h = action.payload;
      state.highlights.push({
        id: h.id,
        fileId: h.documentId,
        pageNumber: h.pageNumber,
        coordinates: {
          x: h.x,
          y: h.y,
          width: h.width,
          height: h.height,
        },
        text: h.text,
        color: {
          name: h.colorName,
          hex: h.colorHex,
          rgb: h.colorRgb,
          opacity: h.opacity,
        },
        createdAt: h.createdAt,
      });
 
      // Clear pending highlight state after successful creation
      state.pendingHighlight = null;
      state.ToolbarPosition = { x: null, y: null };
    }
  )
  .addMatcher(
    toolbarApi.endpoints.createHighlight.matchRejected,
    (state, action) => {
      state.highlightError = action.error.message ?? 'Failed to create highlight';
    }
  );
 
// ─── Delete Highlight ─────────────────────────────────────────────────────────
 
builder
  .addMatcher(
    toolbarApi.endpoints.deleteHighlight.matchPending,
    (state) => {
      state.highlightError = null;
    }
  )
  .addMatcher(
    toolbarApi.endpoints.deleteHighlight.matchFulfilled,
    (state, action) => {
      state.highlights = state.highlights.filter(
        (h) => h.id !== action.payload.id
      );
    }
  )
  .addMatcher(
    toolbarApi.endpoints.deleteHighlight.matchRejected,
    (state, action) => {
      state.highlightError = action.error.message ?? 'Failed to delete highlight';
    }
  );

      /*--------------------
        Redactions
      ----------------------*/
   builder
  .addMatcher(
    toolbarApi.endpoints.getRedactions.matchPending,
    (state) => {
      state.loadingRedactions = true;
      state.redactionError = null;
    }
  )
 .addMatcher(
  toolbarApi.endpoints.getRedactions.matchFulfilled,
  (state, action) => {
    state.loadingRedactions = false;
    state.redactions = action.payload.map((r) => ({
      id: r.id,
      fileId: r.documentId,
      pageNumber: r.pageNumber,
      coordinates: {
        x: r.x,
        y: r.y,
        width: r.width,
        height: r.height,
      },
      style: {
        name: r.name,
        fillHex: r.fillHex,
        opacity: r.opacity,
        borderHex: r.borderHex,
        borderWidth: r.borderWidth,
      },
      createdAt: r.createdAt,
    }));
  }
)
  .addMatcher(
    toolbarApi.endpoints.getRedactions.matchRejected,
    (state, action) => {
      state.loadingRedactions = false;
      state.redactionError = action.error.message ?? 'Failed to load redactions';
    }
  );
 
// ─── Create Redaction ─────────────────────────────────────────────────────────
 
builder
  .addMatcher(
    toolbarApi.endpoints.createRedaction.matchPending,
    (state) => {
      state.redactionError = null;
    }
  )
 .addMatcher(
  toolbarApi.endpoints.createRedaction.matchFulfilled,
  (state, action) => {
    const r = action.payload;
    state.redactions.push({
      id: r.id,
      fileId: r.documentId,
      pageNumber: r.pageNumber,
      coordinates: {
        x: r.x,
        y: r.y,
        width: r.width,
        height: r.height,
      },
      style: {
        name: r.name,
        fillHex: r.fillHex,
        opacity: r.opacity,
        borderHex: r.borderHex,
        borderWidth: r.borderWidth,
      },
      createdAt: r.createdAt,
    });
  }
)
  .addMatcher(
    toolbarApi.endpoints.createRedaction.matchRejected,
    (state, action) => {
      state.redactionError = action.error.message ?? 'Failed to create redaction';
    }
  );
 
// ─── Delete Redaction ─────────────────────────────────────────────────────────
 
builder
  .addMatcher(
    toolbarApi.endpoints.deleteRedaction.matchPending,
    (state) => {
      state.redactionError = null;
    }
  )
  .addMatcher(
    toolbarApi.endpoints.deleteRedaction.matchFulfilled,
    (state, action) => {
      state.redactions = state.redactions.filter(
        (r) => r.id !== action.payload.id
      );
    }
  )
  .addMatcher(
    toolbarApi.endpoints.deleteRedaction.matchRejected,
    (state, action) => {
      state.redactionError = action.error.message ?? 'Failed to delete redaction';
    }
  );

    /*-------------------
      Load Comments
    -------------------*/
  builder
  .addMatcher(
    toolbarApi.endpoints.getComments.matchPending,
    (state) => {
      state.loadingComments = true;
      state.commentError = null;
    }
  )
  .addMatcher(
    toolbarApi.endpoints.getComments.matchFulfilled,
    (state, action) => {
      state.loadingComments = false;
      state.comments = action.payload.map((c) => ({
        id: c.id,
        fileId: c.documentId,
        pageNumber: c.pageNumber,
        text: c.text,
        selectedText: c.selectedText,
        position: { x: c.x, y: c.y, pageY: c.pageY },
        resolved: c.resolved,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      }));
    }
  )
  .addMatcher(
    toolbarApi.endpoints.getComments.matchRejected,
    (state, action) => {
      state.loadingComments = false;
      state.commentError = action.error.message ?? 'Failed to load comments';
    }
  );
 
// ─── Create Comment ───────────────────────────────────────────────────────────
 
builder
  .addMatcher(
    toolbarApi.endpoints.createComment.matchPending,
    (state) => {
      state.commentError = null;
    }
  )
  .addMatcher(
    toolbarApi.endpoints.createComment.matchFulfilled,
    (state, action) => {
      state.comments.push({
        id: action.payload.id,
        fileId: action.payload.documentId,
        pageNumber: action.payload.pageNumber,
        text: action.payload.text,
        selectedText: action.payload.selectedText,
        position: {
          x: action.payload.x,
          y: action.payload.y,
          pageY: action.payload.pageY,
        },
        resolved: action.payload.resolved,
        createdAt: action.payload.createdAt,
        updatedAt: action.payload.updatedAt,
      });
 
      // Clear pending comment state after successful creation
      state.pendingComment = null;
      state.CommentPosition = { x: null, y: null };
      state.ToolbarPosition = { x: null, y: null };
    }
  )
  .addMatcher(
    toolbarApi.endpoints.createComment.matchRejected,
    (state, action) => {
      state.commentError = action.error.message ?? 'Failed to create comment';
    }
  );
 
// ─── Update Comment ───────────────────────────────────────────────────────────
// TODO: Wire these up once the update endpoint is added to toolbarApi
 
// builder
//   .addMatcher(
//     toolbarApi.endpoints.updateComment.matchPending,
//     (state) => {
//       state.commentError = null;
//     }
//   )
//   .addMatcher(
//     toolbarApi.endpoints.updateComment.matchFulfilled,
//     (state, action) => {
//       const index = state.comments.findIndex((c) => c.id === action.payload.id);
//       if (index !== -1) {
//         state.comments[index] = action.payload;
//       }
//     }
//   )
//   .addMatcher(
//     toolbarApi.endpoints.updateComment.matchRejected,
//     (state, action) => {
//       state.commentError = action.error.message ?? 'Failed to update comment';
//     }
//   );
 
// ─── Toggle Comment Resolved ──────────────────────────────────────────────────
// TODO: Wire these up once the toggleResolved endpoint is added to toolbarApi
 
// builder
//   .addMatcher(
//     toolbarApi.endpoints.toggleCommentResolved.matchFulfilled,
//     (state, action) => {
//       const index = state.comments.findIndex((c) => c.id === action.payload.id);
//       if (index !== -1) {
//         state.comments[index] = action.payload;
//       }
//     }
//   )
//   .addMatcher(
//     toolbarApi.endpoints.toggleCommentResolved.matchRejected,
//     (state, action) => {
//       state.commentError = action.error.message ?? 'Failed to toggle comment';
//     }
//   );
 
// ─── Delete Comment ───────────────────────────────────────────────────────────
 
builder
  .addMatcher(
    toolbarApi.endpoints.deleteComment.matchPending,
    (state) => {
      state.commentError = null;
    }
  )
  .addMatcher(
    toolbarApi.endpoints.deleteComment.matchFulfilled,
    (state, action) => {
      state.comments = state.comments.filter((c) => c.id !== action.payload.id);
    }
  )
  .addMatcher(
    toolbarApi.endpoints.deleteComment.matchRejected,
    (state, action) => {
      state.commentError = action.error.message ?? 'Failed to delete comment';
    }
  );
  },
});

export default toolbarSlice.reducer;

export const {
  setActiveTool,
  setRedactionStyle,
  setToolbarPosition,
  setPendingHighlight,
  addHighlight,
  removeHighlight,
  clearHighlights,
  clearFileHighlights,
  clearPageHighlights,
  cancelHighlight,
  addRedaction,
  removeRedaction,
  clearRedactions,
  clearFileRedactions,
  clearPageRedactions,
  clearHighlightError,
  setCommentPosition,
  setPendingComment,
  addComment,
  updateComment,
  deleteComment,
  toggleCommentResolved,
  clearFileComments,
  clearPageComments,
  cancelCommentCreation,
  setIsCommentExpanded,
} = toolbarSlice.actions;

/*=============================================
=            Selectors                        =
=============================================*/

export const selectHighlights = (state: { toolbar: EditorState }) =>
  state.toolbar.highlights;
export const selectLoadingHighlights = (state: { toolbar: EditorState }) =>
  state.toolbar.loadingHighlights;
export const selectHighlightError = (state: { toolbar: EditorState }) =>
  state.toolbar.highlightError;
export const selectHighlightsByDocument = (
  state: { toolbar: EditorState },
  documentId: string
) => state.toolbar.highlights.filter(h => h.fileId === documentId);
export const selectHighlightsByPage = (
  state: { toolbar: EditorState },
  documentId: string,
  pageNumber: number
) =>
  state.toolbar.highlights.filter(
    h => h.fileId === documentId && h.pageNumber === pageNumber
  );
