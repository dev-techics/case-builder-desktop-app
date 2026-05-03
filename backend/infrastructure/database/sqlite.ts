import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

export type SqliteDatabase = InstanceType<typeof Database>;

const CREATE_BUNDLES_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS bundles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    case_number TEXT NOT NULL,
    document_count INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'In Progress',
    color TEXT NOT NULL DEFAULT 'blue',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    description TEXT,
    tags TEXT
  )
`;

const CREATE_DOCUMENTS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    bundle_id TEXT NOT NULL,
    parent_id TEXT,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('file', 'folder')),
    mime_type TEXT,
    storage_path TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    metadata TEXT,
    created_at TEXT,
    updated_at TEXT,
    FOREIGN KEY (bundle_id) REFERENCES bundles(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES documents(id) ON DELETE CASCADE
  )
`;

const CREATE_DOCUMENTS_INDEXES_SQL = `
  CREATE INDEX IF NOT EXISTS idx_documents_bundle_id ON documents (bundle_id);
  CREATE INDEX IF NOT EXISTS idx_documents_parent_id ON documents (parent_id);
`;

const EXPECTED_BUNDLES_COLUMNS = new Set([
  'id',
  'name',
  'case_number',
  'document_count',
  'status',
  'color',
  'created_at',
  'updated_at',
  'description',
  'tags',
]);

type TableInfoRow = {
  name: string;
};

export function createSqliteDatabase(dbPath: string): SqliteDatabase {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  ensureBundlesTable(db);
  ensureDocumentsTable(db);
  return db;
}

function ensureBundlesTable(db: SqliteDatabase) {
  const bundlesTable = db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ? LIMIT 1"
    )
    .get('bundles') as { name: string } | undefined;

  if (!bundlesTable) {
    db.exec(CREATE_BUNDLES_TABLE_SQL);
    return;
  }

  const columns = db
    .prepare('PRAGMA table_info(bundles)')
    .all() as TableInfoRow[];
  const columnNames = new Set(columns.map(column => column.name));

  const needsMigration =
    columnNames.size !== EXPECTED_BUNDLES_COLUMNS.size ||
    [...EXPECTED_BUNDLES_COLUMNS].some(column => !columnNames.has(column));

  if (!needsMigration) {
    return;
  }

  migrateLegacyBundlesTable(db, columnNames);
}

function ensureDocumentsTable(db: SqliteDatabase) {
  db.exec(CREATE_DOCUMENTS_TABLE_SQL);
  db.exec(CREATE_DOCUMENTS_INDEXES_SQL);
}

function migrateLegacyBundlesTable(
  db: SqliteDatabase,
  columnNames: ReadonlySet<string>
) {
  const legacyTableName = `bundles_legacy_${Date.now()}`;
  const selectExpressions = {
    id: columnNames.has('id')
      ? 'CAST(id AS TEXT)'
      : 'lower(hex(randomblob(16)))',
    name: columnNames.has('name')
      ? "COALESCE(name, 'Untitled Bundle')"
      : "'Untitled Bundle'",
    caseNumber: columnNames.has('case_number')
      ? "COALESCE(case_number, '')"
      : "''",
    documentCount: columnNames.has('document_count')
      ? 'COALESCE(document_count, 0)'
      : columnNames.has('doc_count')
        ? 'COALESCE(doc_count, 0)'
        : '0',
    status: columnNames.has('status')
      ? `
          CASE
            WHEN status IN ('In Progress', 'Complete', 'Review', 'Archived') THEN status
            ELSE 'In Progress'
          END
        `
      : "'In Progress'",
    color: columnNames.has('color') ? "COALESCE(color, 'blue')" : "'blue'",
    createdAt: columnNames.has('created_at')
      ? 'COALESCE(created_at, CURRENT_TIMESTAMP)'
      : 'CURRENT_TIMESTAMP',
    updatedAt: columnNames.has('updated_at')
      ? 'COALESCE(updated_at, CURRENT_TIMESTAMP)'
      : columnNames.has('created_at')
        ? 'COALESCE(created_at, CURRENT_TIMESTAMP)'
        : 'CURRENT_TIMESTAMP',
    description: columnNames.has('description') ? 'description' : 'NULL',
    tags: columnNames.has('tags') ? 'tags' : 'NULL',
  };

  const migrate = db.transaction(() => {
    db.exec(`ALTER TABLE bundles RENAME TO "${legacyTableName}"`);
    db.exec(CREATE_BUNDLES_TABLE_SQL);

    db.prepare(
      `
        INSERT INTO bundles (
          id,
          name,
          case_number,
          document_count,
          status,
          color,
          created_at,
          updated_at,
          description,
          tags
        )
        SELECT
          ${selectExpressions.id},
          ${selectExpressions.name},
          ${selectExpressions.caseNumber},
          ${selectExpressions.documentCount},
          ${selectExpressions.status},
          ${selectExpressions.color},
          ${selectExpressions.createdAt},
          ${selectExpressions.updatedAt},
          ${selectExpressions.description},
          ${selectExpressions.tags}
        FROM "${legacyTableName}"
      `
    ).run();
  });

  migrate();
}
