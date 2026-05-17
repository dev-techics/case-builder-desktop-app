import type {
  CoverPageHtml,
  CoverPageRepository,
} from '../../application/ports/cover-page/coverPageRepository.js';
import type { StoredCoverPage } from '../../domain/coverPage.js';
import type { SqliteDatabase } from '../database/sqlite.js';

// ─── Row Type ─────────────────────────────────────────────────────────────────

type CoverPageRow = {
  id: string;
  name: string;
  description: string | null;
  type: 'front' | 'back';
  is_default: number;
  html: string | null;
  design_json: string | null;
  created_at: string;
  updated_at: string;
};

// ─── Mapping ──────────────────────────────────────────────────────────────────

const mapCoverPageRow = (row: CoverPageRow): StoredCoverPage => ({
  id: row.id,
  name: row.name,
  description: row.description ?? '',
  type: row.type,
  isDefault: row.is_default === 1,
  html: row.html ?? '',
  designJson: row.design_json ?? '',
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

// ─── Repository ───────────────────────────────────────────────────────────────

export class SqliteCoverPageRepository implements CoverPageRepository {
  constructor(private readonly db: SqliteDatabase) {}

  async createCoverPage(payload: StoredCoverPage): Promise<void> {
    this.db
      .prepare(
        `
          INSERT INTO cover_pages (
            id,
            name,
            description,
            type,
            is_default,
            html,
            design_json,
            created_at,
            updated_at
          )
          VALUES (
            @id,
            @name,
            @description,
            @type,
            @is_default,
            @html,
            @design_json,
            @created_at,
            @updated_at
          )
        `
      )
      .run({
        id: payload.id,
        name: payload.name,
        description: payload.description || null,
        type: payload.type,
        is_default: payload.isDefault ? 1 : 0,
        html: payload.html || null,
        design_json: payload.designJson || null,
        created_at: payload.createdAt,
        updated_at: payload.updatedAt,
      });
  }

  async listCoverPages(): Promise<StoredCoverPage[]> {
    const rows = this.db
      .prepare(
        `
          SELECT
            id,
            name,
            description,
            type,
            is_default,
            html,
            design_json,
            created_at,
            updated_at
          FROM cover_pages
          ORDER BY is_default DESC, created_at ASC, id ASC
        `
      )
      .all() as CoverPageRow[];

    return rows.map(mapCoverPageRow);
  }

  async getCoverPageById(id: string): Promise<StoredCoverPage> {
    const row = this.db
      .prepare(
        `
          SELECT
            id,
            name,
            description,
            type,
            is_default,
            html,
            design_json,
            created_at,
            updated_at
          FROM cover_pages
          WHERE id = ?
          LIMIT 1
        `
      )
      .get(id) as CoverPageRow | undefined;

    if (!row) {
      throw new Error(`Cover page not found: ${id}`);
    }

    return mapCoverPageRow(row);
  }

  async updateCoverPage(
    id: string,
    payload: Partial<Omit<StoredCoverPage, 'id' | 'createdAt'>>
  ): Promise<void> {
    const existing = await this.getCoverPageById(id);

    this.db
      .prepare(
        `
          UPDATE cover_pages
          SET
            name        = @name,
            description = @description,
            type        = @type,
            is_default  = @is_default,
            html        = @html,
            design_json = @design_json,
            updated_at  = @updated_at
          WHERE id = @id
        `
      )
      .run({
        id,
        name: payload.name ?? existing.name,
        description: payload.description ?? existing.description ?? null,
        type: payload.type ?? existing.type,
        is_default: (payload.isDefault ?? existing.isDefault) ? 1 : 0,
        html: payload.html ?? existing.html ?? null,
        design_json: payload.designJson ?? existing.designJson ?? null,
        updated_at: payload.updatedAt ?? new Date().toISOString(),
      });
  }

  async deleteCoverPage(id: string): Promise<void> {
    this.db.prepare('DELETE FROM cover_pages WHERE id = ?').run(id);
  }

  /**
   * Fetch the stored HTML for a single cover page.
   *
   * Returns `null` when no row matches `id` so callers can give the user
   * a meaningful error rather than crashing on a missing record.
   */
  getHtmlById(id: string): Promise<CoverPageHtml | null> {
    // better-sqlite3 is synchronous — wrap in a resolved Promise so
    // the interface contract (Promise-based) is satisfied without drama.
    const row =
      this.db
        .prepare<
          [string],
          CoverPageRow
        >('SELECT id, html FROM cover_pages WHERE id = ?')
        .get(id) ?? null;

    if (!row) return Promise.resolve(null);
    if (!row.html) {
      return Promise.reject(
        new Error(
          `[SqliteCoverPageRepository] Cover page "${id}" exists but has no HTML content`
        )
      );
    }

    return Promise.resolve({ id: row.id, html: row.html });
  }
}
