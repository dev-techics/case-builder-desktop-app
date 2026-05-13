import type { RedactionRepository } from '../../application/ports/redactions/redactionRepository.js';
import type { StoredRedaction } from '../../domain/redaction.js';
import type { SqliteDatabase } from '../database/sqlite.js';

// ─── Row Type ─────────────────────────────────────────────────────────────────

type RedactionRow = {
  id: string;
  bundle_id: string;
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
  created_at: string;
  updated_at: string;
};

// ─── Mapping ──────────────────────────────────────────────────────────────────

const mapRedactionRow = (row: RedactionRow): StoredRedaction => ({
  id: row.id,
  bundleId: row.bundle_id,
  documentId: row.document_id,
  pageNumber: row.page_number,
  x: row.x,
  y: row.y,
  width: row.width,
  height: row.height,
  name: row.name,
  fillHex: row.fill_hex,
  opacity: row.opacity,
  borderHex: row.border_hex,
  borderWidth: row.border_width,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

// ─── Repository ───────────────────────────────────────────────────────────────

export class SqliteRedactionRepository implements RedactionRepository {
  constructor(private readonly db: SqliteDatabase) {}

  async create(redaction: StoredRedaction): Promise<void> {
    this.db
      .prepare(
        `
          INSERT INTO redactions (
            id,
            bundle_id,
            document_id,
            page_number,
            x,
            y,
            width,
            height,
            name,
            fill_hex,
            opacity,
            border_hex,
            border_width,
            created_at,
            updated_at
          )
          VALUES (
            @id,
            @bundle_id,
            @document_id,
            @page_number,
            @x,
            @y,
            @width,
            @height,
            @name,
            @fill_hex,
            @opacity,
            @border_hex,
            @border_width,
            @created_at,
            @updated_at
          )
        `
      )
      .run({
        id: redaction.id,
        bundle_id: redaction.bundleId,
        document_id: redaction.documentId,
        page_number: redaction.pageNumber,
        x: redaction.x,
        y: redaction.y,
        width: redaction.width,
        height: redaction.height,
        name: redaction.name,
        fill_hex: redaction.fillHex,
        opacity: redaction.opacity,
        border_hex: redaction.borderHex,
        border_width: redaction.borderWidth,
        created_at: redaction.createdAt,
        updated_at: redaction.updatedAt,
      });
  }

  async delete(id: string): Promise<StoredRedaction | null> {
    const existingRedaction = this.db
      .prepare(
        `
          SELECT
            id,
            bundle_id,
            document_id,
            page_number,
            x,
            y,
            width,
            height,
            name,
            fill_hex,
            opacity,
            border_hex,
            border_width,
            created_at,
            updated_at
          FROM redactions
          WHERE id = ?
          LIMIT 1
        `
      )
      .get(id) as RedactionRow | undefined;

    if (!existingRedaction) {
      return null;
    }

    this.db.prepare('DELETE FROM redactions WHERE id = ?').run(id);
    return mapRedactionRow(existingRedaction);
  }

  async listByBundle(bundleId: string): Promise<StoredRedaction[]> {
    const rows = this.db
      .prepare(
        `
          SELECT
            id,
            bundle_id,
            document_id,
            page_number,
            x,
            y,
            width,
            height,
            name,
            fill_hex,
            opacity,
            border_hex,
            border_width,
            created_at,
            updated_at
          FROM redactions
          WHERE bundle_id = ?
          ORDER BY document_id ASC, page_number ASC, created_at ASC, id ASC
        `
      )
      .all(bundleId) as RedactionRow[];

    return rows.map(mapRedactionRow);
  }
}
