import type { HighlightRepository } from '../../application/ports/highlights/highlightRepository.js';
import type {
  HighlightColorRgb,
  StoredHighlight,
} from '../../domain/highlight.js';
import type { SqliteDatabase } from '../database/sqlite.js';

type HighlightRow = {
  id: string;
  bundle_id: string;
  document_id: string;
  page_number: number;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  color_name: string;
  color_hex: string;
  color_rgb: string;
  opacity: number;
  created_at: string;
  updated_at: string;
};

const parseColorRgb = (value: string): HighlightColorRgb => {
  try {
    const parsed = JSON.parse(value) as Partial<HighlightColorRgb>;

    if (
      typeof parsed?.r === 'number' &&
      typeof parsed?.g === 'number' &&
      typeof parsed?.b === 'number'
    ) {
      return {
        r: parsed.r,
        g: parsed.g,
        b: parsed.b,
      };
    }
  } catch {
    // Fall through to the default color.
  }

  return {
    r: 0,
    g: 0,
    b: 0,
  };
};

const mapHighlightRow = (row: HighlightRow): StoredHighlight => ({
  id: row.id,
  bundleId: row.bundle_id,
  documentId: row.document_id,
  pageNumber: row.page_number,
  x: row.x,
  y: row.y,
  width: row.width,
  height: row.height,
  text: row.text,
  colorName: row.color_name,
  colorHex: row.color_hex,
  colorRgb: parseColorRgb(row.color_rgb),
  opacity: row.opacity,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export class SqliteHighlightRepository implements HighlightRepository {
  constructor(private readonly db: SqliteDatabase) {}

  async create(highlight: StoredHighlight): Promise<void> {
    this.db
      .prepare(
        `
          INSERT INTO highlights (
            id,
            bundle_id,
            document_id,
            page_number,
            x,
            y,
            width,
            height,
            text,
            color_name,
            color_hex,
            color_rgb,
            opacity,
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
            @text,
            @color_name,
            @color_hex,
            @color_rgb,
            @opacity,
            @created_at,
            @updated_at
          )
        `
      )
      .run({
        id: highlight.id,
        bundle_id: highlight.bundleId,
        document_id: highlight.documentId,
        page_number: highlight.pageNumber,
        x: highlight.x,
        y: highlight.y,
        width: highlight.width,
        height: highlight.height,
        text: highlight.text,
        color_name: highlight.colorName,
        color_hex: highlight.colorHex,
        color_rgb: JSON.stringify(highlight.colorRgb),
        opacity: highlight.opacity,
        created_at: highlight.createdAt,
        updated_at: highlight.updatedAt,
      });
  }

  async delete(id: string): Promise<StoredHighlight | null> {
    const existingHighlight = this.db
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
            text,
            color_name,
            color_hex,
            color_rgb,
            opacity,
            created_at,
            updated_at
          FROM highlights
          WHERE id = ?
          LIMIT 1
        `
      )
      .get(id) as HighlightRow | undefined;

    if (!existingHighlight) {
      return null;
    }

    this.db.prepare('DELETE FROM highlights WHERE id = ?').run(id);
    return mapHighlightRow(existingHighlight);
  }

  async listByBundle(bundleId: string): Promise<StoredHighlight[]> {
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
            text,
            color_name,
            color_hex,
            color_rgb,
            opacity,
            created_at,
            updated_at
          FROM highlights
          WHERE bundle_id = ?
          ORDER BY document_id ASC, page_number ASC, created_at ASC, id ASC
        `
      )
      .all(bundleId) as HighlightRow[];

    return rows.map(mapHighlightRow);
  }
}
