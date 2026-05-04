import type { DocumentRepository } from '../../application/ports/documentRepository.js';
import type { DocumentType, StoredDocument } from '../../domain/document.js';
import type { SqliteDatabase } from '../database/sqlite.js';

type DocumentRow = {
  id: string;
  bundle_id: string;
  parent_id: string | null;
  name: string;
  type: DocumentType;
  mime_type: string | null;
  storage_path: string | null;
  order_value: number;
  metadata: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export class SqliteDocumentRepository implements DocumentRepository {
  constructor(private readonly db: SqliteDatabase) {}

  async createMany(documents: StoredDocument[]): Promise<void> {
    if (documents.length === 0) {
      return;
    }

    const insertDocument = this.db.prepare(`
      INSERT INTO documents (
        id,
        bundle_id,
        parent_id,
        name,
        type,
        mime_type,
        storage_path,
        "order",
        metadata,
        created_at,
        updated_at
      )
      VALUES (
        @id,
        @bundle_id,
        @parent_id,
        @name,
        @type,
        @mime_type,
        @storage_path,
        @order,
        @metadata,
        @created_at,
        @updated_at
      )
    `);

    const syncBundleDocumentCount = this.db.prepare(`
      UPDATE bundles
      SET
        document_count = (
          SELECT COUNT(*)
          FROM documents
          WHERE bundle_id = @bundle_id
            AND type = 'file'
        ),
        updated_at = @updated_at
      WHERE id = @bundle_id
    `);

    const now = new Date().toISOString();
    const bundleIds = new Set<string>();
    const transaction = this.db.transaction(() => {
      for (const document of documents) {
        insertDocument.run({
          id: document.id,
          bundle_id: document.bundleId,
          parent_id: document.parentId,
          name: document.name,
          type: document.type,
          mime_type: document.mimeType,
          storage_path: document.storagePath,
          order: document.order,
          metadata: document.metadata,
          created_at: document.createdAt,
          updated_at: document.updatedAt,
        });
        bundleIds.add(document.bundleId);
      }

      for (const bundleId of bundleIds) {
        syncBundleDocumentCount.run({
          bundle_id: bundleId,
          updated_at: now,
        });
      }
    });

    transaction();
  }

  async getBundleName(bundleId: string): Promise<string | null> {
    const row = this.db
      .prepare('SELECT name FROM bundles WHERE id = ? LIMIT 1')
      .get(bundleId) as { name: string } | undefined;

    return row?.name ?? null;
  }

  async getById(id: string): Promise<StoredDocument | null> {
    const row = this.db
      .prepare(
        `
          SELECT
            id,
            bundle_id,
            parent_id,
            name,
            type,
            mime_type,
            storage_path,
            "order" AS order_value,
            metadata,
            created_at,
            updated_at
          FROM documents
          WHERE id = ?
          LIMIT 1
        `
      )
      .get(id) as DocumentRow | undefined;

    return row ? mapDocumentRow(row) : null;
  }

  async getNextOrder(
    bundleId: string,
    parentId: string | null
  ): Promise<number> {
    const row = this.db
      .prepare(
        `
          SELECT COALESCE(MAX("order"), -1) + 1 AS next_order
          FROM documents
          WHERE bundle_id = @bundle_id
            AND (
              (@parent_id IS NULL AND parent_id IS NULL)
              OR parent_id = @parent_id
            )
        `
      )
      .get({
        bundle_id: bundleId,
        parent_id: parentId,
      }) as { next_order: number } | undefined;

    return row?.next_order ?? 0;
  }

  async listByBundle(bundleId: string): Promise<StoredDocument[]> {
    const rows = this.db
      .prepare(
        `
          SELECT
            id,
            bundle_id,
            parent_id,
            name,
            type,
            mime_type,
            storage_path,
            "order" AS order_value,
            metadata,
            created_at,
            updated_at
          FROM documents
          WHERE bundle_id = ?
          ORDER BY
            CASE WHEN parent_id IS NULL THEN 0 ELSE 1 END,
            parent_id ASC,
            "order" ASC,
            created_at ASC,
            id ASC
        `
      )
      .all(bundleId) as DocumentRow[];

    return rows.map(mapDocumentRow);
  }
}

function mapDocumentRow(row: DocumentRow): StoredDocument {
  return {
    id: row.id,
    bundleId: row.bundle_id,
    parentId: row.parent_id,
    name: row.name,
    type: row.type,
    mimeType: row.mime_type,
    storagePath: row.storage_path,
    order: row.order_value,
    metadata: row.metadata,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
