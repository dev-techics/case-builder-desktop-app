import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

export type SqliteDatabase = InstanceType<typeof Database>;

// ─── Table Definitions ────────────────────────────────────────────────────────

const SQL_CREATE_BUNDLES_TABLE = `
  CREATE TABLE IF NOT EXISTS bundles (
    id           TEXT    PRIMARY KEY,
    name         TEXT    NOT NULL,
    case_number  TEXT    NOT NULL,
    document_count INTEGER NOT NULL DEFAULT 0,
    status       TEXT    NOT NULL DEFAULT 'In Progress',
    color        TEXT    NOT NULL DEFAULT 'blue',
    created_at   TEXT    NOT NULL,
    updated_at   TEXT    NOT NULL,
    description  TEXT,
    tags         TEXT,
    metadata     TEXT
  )
`;

const SQL_ADD_BUNDLES_METADATA_COLUMN = `
  ALTER TABLE bundles
  ADD COLUMN metadata TEXT
`;

const SQL_CREATE_DOCUMENTS_TABLE = `
  CREATE TABLE IF NOT EXISTS documents (
    id           TEXT    PRIMARY KEY,
    bundle_id    TEXT    NOT NULL,
    parent_id    TEXT,
    name         TEXT    NOT NULL,
    type         TEXT    NOT NULL CHECK (type IN ('file', 'folder')),
    mime_type    TEXT,
    storage_path TEXT,
    "order"      INTEGER NOT NULL DEFAULT 0,
    metadata     TEXT,
    created_at   TEXT,
    updated_at   TEXT,
    FOREIGN KEY (bundle_id)  REFERENCES bundles(id)   ON DELETE CASCADE,
    FOREIGN KEY (parent_id)  REFERENCES documents(id) ON DELETE CASCADE
  )
`;

const SQL_CREATE_DOCUMENTS_INDEXES = `
  CREATE INDEX IF NOT EXISTS idx_documents_bundle_id ON documents (bundle_id);
  CREATE INDEX IF NOT EXISTS idx_documents_parent_id ON documents (parent_id);
`;

const SQL_CREATE_HIGHLIGHTS_TABLE = `
  CREATE TABLE IF NOT EXISTS highlights (
    id          TEXT    PRIMARY KEY,
    bundle_id   TEXT    NOT NULL,
    document_id TEXT    NOT NULL,
    page_number INTEGER NOT NULL,
    x           REAL    NOT NULL,
    y           REAL    NOT NULL,
    width       REAL    NOT NULL,
    height      REAL    NOT NULL,
    text        TEXT    NOT NULL,
    color_name  TEXT    NOT NULL,
    color_hex   TEXT    NOT NULL,
    color_rgb   TEXT    NOT NULL,
    opacity     REAL    NOT NULL,
    created_at  TEXT    NOT NULL,
    updated_at  TEXT    NOT NULL,
    FOREIGN KEY (bundle_id)   REFERENCES bundles(id)   ON DELETE CASCADE,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
  )
`;

const SQL_CREATE_HIGHLIGHTS_INDEXES = `
  CREATE INDEX IF NOT EXISTS idx_highlights_bundle_id       ON highlights (bundle_id);
  CREATE INDEX IF NOT EXISTS idx_highlights_document_id     ON highlights (document_id);
  CREATE INDEX IF NOT EXISTS idx_highlights_document_page   ON highlights (document_id, page_number);
`;

const SQL_CREATE_COMMENTS_TABLE = `
  CREATE TABLE IF NOT EXISTS comments (
    id            TEXT    PRIMARY KEY,
    bundle_id     TEXT    NOT NULL,
    document_id   TEXT    NOT NULL,
    page_number   INTEGER NOT NULL,
    text          TEXT    NOT NULL,
    selected_text TEXT,
    x             REAL    NOT NULL,
    y             REAL    NOT NULL,
    page_y        REAL    NOT NULL,
    resolved      INTEGER NOT NULL DEFAULT 0,
    created_at    TEXT,
    updated_at    TEXT,
    FOREIGN KEY (bundle_id)   REFERENCES bundles(id)   ON DELETE CASCADE,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
  )
`;

const SQL_CREATE_COMMENTS_INDEXES = `
  CREATE INDEX IF NOT EXISTS idx_comments_bundle_id     ON comments (bundle_id);
  CREATE INDEX IF NOT EXISTS idx_comments_document_id   ON comments (document_id);
  CREATE INDEX IF NOT EXISTS idx_comments_document_page ON comments (document_id, page_number);
`;

const SQL_CREATE_REDACTIONS_TABLE = `
  CREATE TABLE IF NOT EXISTS redactions (
    id           TEXT    PRIMARY KEY,
    bundle_id    TEXT    NOT NULL,
    document_id  TEXT    NOT NULL,
    page_number  INTEGER NOT NULL,
    x            REAL    NOT NULL,
    y            REAL    NOT NULL,
    width        REAL    NOT NULL,
    height       REAL    NOT NULL,
    name         TEXT    NOT NULL,
    fill_hex     TEXT    NOT NULL,
    opacity      REAL    NOT NULL,
    border_hex   TEXT    NOT NULL,
    border_width REAL    NOT NULL,
    created_at   TEXT,
    updated_at   TEXT,
    FOREIGN KEY (bundle_id)   REFERENCES bundles(id)   ON DELETE CASCADE,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
  )
`;

const SQL_CREATE_REDACTIONS_INDEXES = `
  CREATE INDEX IF NOT EXISTS idx_redactions_bundle_id     ON redactions (bundle_id);
  CREATE INDEX IF NOT EXISTS idx_redactions_document_id   ON redactions (document_id);
  CREATE INDEX IF NOT EXISTS idx_redactions_document_page ON redactions (document_id, page_number);
`;

// ─── Database Initialisation ──────────────────────────────────────────────────

export function createSqliteDatabase(dbPath: string): SqliteDatabase {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(SQL_CREATE_BUNDLES_TABLE);
  ensureBundlesMetadataColumn(db);
  db.exec(SQL_CREATE_DOCUMENTS_TABLE);
  db.exec(SQL_CREATE_DOCUMENTS_INDEXES);
  db.exec(SQL_CREATE_HIGHLIGHTS_TABLE);
  db.exec(SQL_CREATE_HIGHLIGHTS_INDEXES);
  db.exec(SQL_CREATE_COMMENTS_TABLE);
  db.exec(SQL_CREATE_COMMENTS_INDEXES);
  db.exec(SQL_CREATE_REDACTIONS_TABLE);
  db.exec(SQL_CREATE_REDACTIONS_INDEXES);

  return db;
}

function ensureBundlesMetadataColumn(db: SqliteDatabase): void {
  const columns = db.prepare('PRAGMA table_info(bundles)').all() as Array<{
    name: string;
  }>;

  const hasMetadataColumn = columns.some(column => column.name === 'metadata');
  if (!hasMetadataColumn) {
    db.exec(SQL_ADD_BUNDLES_METADATA_COLUMN);
  }
}
