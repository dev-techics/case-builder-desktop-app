import type {
  BundleRepository,
  BundleUpdates,
} from '../../application/ports/bundles/bundleRepository.js';
import {
  createEmptyBundleMetadata,
  type Bundle,
  type BundleMetadata,
} from '../../domain/bundle.js';
import type { SqliteDatabase } from '../database/sqlite.js';

type BundleRow = {
  id: string;
  name: string;
  case_number: string;
  document_count: number;
  status: Bundle['status'];
  created_at: string;
  updated_at: string;
  description: string | null;
  tags: string | null;
};

type BundleMetadataRow = {
  metadata: string | null;
};

export class SqliteBundleRepository implements BundleRepository {
  constructor(private readonly db: SqliteDatabase) {}

  async create(bundle: Bundle): Promise<void> {
    this.db
      .prepare(
        `
          INSERT INTO bundles (
            id,
            name,
            case_number,
            document_count,
            status,
            created_at,
            updated_at,
            description,
            tags
          )
          VALUES (
            @id,
            @name,
            @case_number,
            @document_count,
            @status,
            @created_at,
            @updated_at,
            @description,
            @tags
          )
        `
      )
      .run({
        id: bundle.id,
        name: bundle.name,
        case_number: bundle.caseNumber,
        document_count: bundle.documentCount,
        status: bundle.status,
        created_at: bundle.createdAt,
        updated_at: bundle.updatedAt,
        description: bundle.description ?? null,
        tags: serializeTags(bundle.tags),
      });
  }

  async delete(id: string): Promise<void> {
    this.db.prepare('DELETE FROM bundles WHERE id = ?').run(id);
  }

  async getMetadata(id: string): Promise<BundleMetadata> {
    const row = this.db
      .prepare(
        `
          SELECT metadata
          FROM bundles
          WHERE id = ?
          LIMIT 1
        `
      )
      .get(id) as BundleMetadataRow | undefined;

    if (!row) {
      throw new Error('Bundle not found.');
    }

    return deserializeMetadata(row.metadata);
  }

  async getById(id: string): Promise<Bundle | null> {
    const row = this.db
      .prepare(
        `
          SELECT
            id,
            name,
            case_number,
            document_count,
            status,
            created_at,
            updated_at,
            description,
            tags
          FROM bundles
          WHERE id = ?
          LIMIT 1
        `
      )
      .get(id) as BundleRow | undefined;

    return row ? mapBundleRow(row) : null;
  }

  async list(): Promise<Bundle[]> {
    const rows = this.db
      .prepare(
        `
          SELECT
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
          FROM bundles
          ORDER BY updated_at DESC, created_at DESC
        `
      )
      .all() as BundleRow[];

    return rows.map(mapBundleRow);
  }

  async update(id: string, updates: BundleUpdates): Promise<Bundle> {
    const setClauses: string[] = [];
    const values: string[] = [];

    if (updates.name !== undefined) {
      setClauses.push('name = ?');
      values.push(updates.name);
    }

    if (updates.status !== undefined) {
      setClauses.push('status = ?');
      values.push(updates.status);
    }

    const updatedAt = new Date().toISOString();
    setClauses.push('updated_at = ?');
    values.push(updatedAt, id);

    const result = this.db
      .prepare(
        `
          UPDATE bundles
          SET ${setClauses.join(', ')}
          WHERE id = ?
        `
      )
      .run(...values);

    if (result.changes === 0) {
      throw new Error('Bundle not found.');
    }

    const row = this.db
      .prepare(
        `
          SELECT
            id,
            name,
            case_number,
            document_count,
            status,
            created_at,
            updated_at,
            description,
            tags
          FROM bundles
          WHERE id = ?
          LIMIT 1
        `
      )
      .get(id) as BundleRow | undefined;

    if (!row) {
      throw new Error('Failed to load updated bundle.');
    }

    return mapBundleRow(row);
  }

  async updateMetadata(
    id: string,
    metadata: BundleMetadata
  ): Promise<BundleMetadata> {
    const currentMetadata = this.db
      .prepare(
        `
          SELECT metadata
          FROM bundles
          WHERE id = ?
          LIMIT 1
        `
      )
      .get(id) as BundleMetadataRow | undefined;

    if (!currentMetadata) {
      throw new Error('Bundle not found.');
    }

    const updatedAt = new Date().toISOString();
    const mergedMetadata = mergeMetadata(
      readStoredMetadataObject(currentMetadata.metadata),
      metadata
    );

    const result = this.db
      .prepare(
        `
          UPDATE bundles
          SET metadata = ?, updated_at = ?
          WHERE id = ?
        `
      )
      .run(serializeMetadata(mergedMetadata), updatedAt, id);

    if (result.changes === 0) {
      throw new Error('Bundle not found.');
    }

    return mergedMetadata;
  }
}

function mapBundleRow(row: BundleRow): Bundle {
  return {
    id: row.id,
    name: row.name,
    caseNumber: row.case_number,
    documentCount: row.document_count,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    description: row.description ?? undefined,
    tags: deserializeTags(row.tags),
  };
}

function serializeTags(tags: Bundle['tags']): string | null {
  if (!Array.isArray(tags) || tags.length === 0) {
    return null;
  }

  return JSON.stringify(tags);
}

function deserializeTags(rawTags: string | null): string[] | undefined {
  if (!rawTags) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(rawTags) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((tag): tag is string => typeof tag === 'string')
      : undefined;
  } catch {
    const tags = rawTags
      .split(',')
      .map(tag => tag.trim())
      .filter(Boolean);

    return tags.length > 0 ? tags : undefined;
  }
}

function serializeMetadata(metadata: BundleMetadata): string {
  return JSON.stringify(metadata);
}

function deserializeMetadata(rawMetadata: string | null): BundleMetadata {
  const source = readStoredMetadataObject(rawMetadata);
  const metadata: BundleMetadata = {
    ...source,
    headerLeft: readMetadataValue(source.headerLeft ?? source.header_left),
    headerRight: readMetadataValue(source.headerRight ?? source.header_right),
    footer: readMetadataValue(source.footer),
  };

  delete metadata.header_left;
  delete metadata.header_right;

  return metadata;
}

function readStoredMetadataObject(rawMetadata: string | null): Record<string, unknown> {
  if (!rawMetadata) {
    return createEmptyBundleMetadata();
  }

  try {
    const parsed = JSON.parse(rawMetadata) as unknown;
    return getMetadataSource(parsed);
  } catch {
    return createEmptyBundleMetadata();
  }
}

function getMetadataSource(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) {
    return createEmptyBundleMetadata();
  }

  if (isRecord(value.metadata)) {
    return value.metadata;
  }

  return value;
}

function readMetadataValue(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function mergeMetadata(
  currentMetadata: Record<string, unknown>,
  patch: BundleMetadata
): BundleMetadata {
  const mergedMetadata: BundleMetadata = {
    ...currentMetadata,
    ...patch,
  };

  if (patch.headerLeft !== undefined) {
    delete mergedMetadata.header_left;
  }

  if (patch.headerRight !== undefined) {
    delete mergedMetadata.header_right;
  }

  return mergedMetadata;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
