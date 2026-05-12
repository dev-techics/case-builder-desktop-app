import type { CommentRepository } from '../../application/ports/comments/commentRepository.js';
import type { StoredComment } from '../../domain/comment.js';
import type { SqliteDatabase } from '../database/sqlite.js';

// ─── Row Type ────────────────────────────────────────────────────────────────

type CommentRow = {
  id: string;
  bundle_id: string;
  document_id: string;
  page_number: number;
  text: string;
  selected_text: string | null;
  x: number;
  y: number;
  page_y: number;
  resolved: number;
  created_at: string;
  updated_at: string;
};

// ─── Mapping ──────────────────────────────────────────────────────────────────

const mapCommentRow = (row: CommentRow): StoredComment => ({
  id: row.id,
  bundleId: row.bundle_id,
  documentId: row.document_id,
  pageNumber: row.page_number,
  text: row.text,
  selectedText: row.selected_text ?? '',
  x: row.x,
  y: row.y,
  pageY: row.page_y,
  resolved: row.resolved === 1,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

// ─── Repository ───────────────────────────────────────────────────────────────

export class SqliteCommentRepository implements CommentRepository {
  constructor(private readonly db: SqliteDatabase) {}

  async create(comment: StoredComment): Promise<void> {
    this.db
      .prepare(
        `
          INSERT INTO comments (
            id,
            bundle_id,
            document_id,
            page_number,
            text,
            selected_text,
            x,
            y,
            page_y,
            resolved,
            created_at,
            updated_at
          )
          VALUES (
            @id,
            @bundle_id,
            @document_id,
            @page_number,
            @text,
            @selected_text,
            @x,
            @y,
            @page_y,
            @resolved,
            @created_at,
            @updated_at
          )
        `
      )
      .run({
        id: comment.id,
        bundle_id: comment.bundleId,
        document_id: comment.documentId,
        page_number: comment.pageNumber,
        text: comment.text,
        selected_text: comment.selectedText || null,
        x: comment.x,
        y: comment.y,
        page_y: comment.pageY,
        resolved: comment.resolved ? 1 : 0,
        created_at: comment.createdAt,
        updated_at: comment.updatedAt,
      });
  }

  async delete(id: string): Promise<StoredComment | null> {
    const existingComment = this.db
      .prepare(
        `
          SELECT
            id,
            bundle_id,
            document_id,
            page_number,
            text,
            selected_text,
            x,
            y,
            page_y,
            resolved,
            created_at,
            updated_at
          FROM comments
          WHERE id = ?
          LIMIT 1
        `
      )
      .get(id) as CommentRow | undefined;

    if (!existingComment) {
      return null;
    }

    this.db.prepare('DELETE FROM comments WHERE id = ?').run(id);
    return mapCommentRow(existingComment);
  }

  async listByBundle(bundleId: string): Promise<StoredComment[]> {
    const rows = this.db
      .prepare(
        `
          SELECT
            id,
            bundle_id,
            document_id,
            page_number,
            text,
            selected_text,
            x,
            y,
            page_y,
            resolved,
            created_at,
            updated_at
          FROM comments
          WHERE bundle_id = ?
          ORDER BY document_id ASC, page_number ASC, created_at ASC, id ASC
        `
      )
      .all(bundleId) as CommentRow[];

    return rows.map(mapCommentRow);
  }
}
