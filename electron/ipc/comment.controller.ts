import { ipcMain } from 'electron';
import type { DocumentRepository } from '../../backend/application/ports/documents/documentRepository.js';
import type { CommentRepository } from '../../backend/application/ports/comments/commentRepository.js';
import { CreateCommentUseCase } from '../../backend/application/useCases/comment/createComment.js';
import { DeleteCommentUseCase } from '../../backend/application/useCases/comment/deleteComments.js';
import { ListBundleCommentsUseCase } from '../../backend/application/useCases/comment/listComments.js';
import type { StoredComment } from '../../backend/domain/comment.js';

// ─── Payload Types ────────────────────────────────────────────────────────────

type CommentPayload = {
  id?: string | number;
};

type ListCommentsPayload = {
  bundleId?: string | number;
};

type CreateCommentPayload = {
  bundleId?: string | number;
  data?: {
    document_id?: string | number;
    page_number?: number;
    text?: string;
    selected_text?: string;
    x?: number;
    y?: number;
    page_y?: number;
  };
};

// ─── Response Mapper ──────────────────────────────────────────────────────────

const mapComment = (comment: StoredComment) => ({
  id: comment.id,
  bundleId: comment.bundleId,
  documentId: comment.documentId,
  pageNumber: comment.pageNumber,
  text: comment.text,
  selectedText: comment.selectedText,
  x: comment.x,
  y: comment.y,
  pageY: comment.pageY,
  resolved: comment.resolved,
  createdAt: comment.createdAt,
  updatedAt: comment.updatedAt,
});

// ─── IPC Registration ─────────────────────────────────────────────────────────

export function registerCommentIpc(deps: {
  documentRepository: DocumentRepository;
  commentRepository: CommentRepository;
}) {
  const createComment = new CreateCommentUseCase(
    deps.documentRepository,
    deps.commentRepository
  );
  const listBundleComments = new ListBundleCommentsUseCase(
    deps.documentRepository,
    deps.commentRepository
  );
  const deleteComment = new DeleteCommentUseCase(deps.commentRepository);

  ipcMain.handle(
    'comment:listByBundle',
    async (_, payload: string | number | ListCommentsPayload) => {
      const bundleId =
        typeof payload === 'object' && payload !== null
          ? String(payload.bundleId ?? '')
          : String(payload ?? '');

      const comments = await listBundleComments.execute(bundleId);
      return comments.map(mapComment);
    }
  );

  ipcMain.handle('comment:create', async (_, payload: CreateCommentPayload) => {
    const data = payload?.data ?? {};

    const comment = await createComment.execute({
      bundleId: String(payload?.bundleId ?? ''),
      documentId: String(data.document_id ?? ''),
      pageNumber:
        typeof data.page_number === 'number' ? data.page_number : Number.NaN,
      text: typeof data.text === 'string' ? data.text : '',
      selectedText:
        typeof data.selected_text === 'string' ? data.selected_text : '',
      x: typeof data.x === 'number' ? data.x : Number.NaN,
      y: typeof data.y === 'number' ? data.y : Number.NaN,
      pageY: typeof data.page_y === 'number' ? data.page_y : Number.NaN,
    });

    return mapComment(comment);
  });

  ipcMain.handle(
    'comment:delete',
    async (_, payload: string | number | CommentPayload) => {
      const commentId =
        typeof payload === 'object' && payload !== null
          ? String(payload.id ?? '')
          : String(payload ?? '');

      const deletedComment = await deleteComment.execute(commentId);
      return { id: deletedComment.id };
    }
  );
}
