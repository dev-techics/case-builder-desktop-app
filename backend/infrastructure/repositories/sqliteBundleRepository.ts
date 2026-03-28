import type { BundleRepository } from "../../application/ports/bundleRepository.js"
import type { Bundle } from "../../domain/bundle.js"
import type { SqliteDatabase } from "../database/sqlite.js"

type BundleRow = {
  id: string
  name: string
  case_number: string
  document_count: number
  status: Bundle["status"]
  color: Bundle["color"]
  created_at: string
  updated_at: string
  description: string | null
  tags: string | null
}

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
            color,
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
            @color,
            @created_at,
            @updated_at,
            @description,
            @tags
          )
        `,
      )
      .run({
        id: bundle.id,
        name: bundle.name,
        case_number: bundle.caseNumber,
        document_count: bundle.documentCount,
        status: bundle.status,
        color: bundle.color,
        created_at: bundle.createdAt,
        updated_at: bundle.updatedAt,
        description: bundle.description ?? null,
        tags: serializeTags(bundle.tags),
      })
  }

  async delete(id: string): Promise<void> {
    this.db.prepare("DELETE FROM bundles WHERE id = ?").run(id)
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
        `,
      )
      .all() as BundleRow[]

    return rows.map(mapBundleRow)
  }
}

function mapBundleRow(row: BundleRow): Bundle {
  return {
    id: row.id,
    name: row.name,
    caseNumber: row.case_number,
    documentCount: row.document_count,
    status: row.status,
    color: row.color,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    description: row.description ?? undefined,
    tags: deserializeTags(row.tags),
  }
}

function serializeTags(tags: Bundle["tags"]): string | null {
  if (!Array.isArray(tags) || tags.length === 0) {
    return null
  }

  return JSON.stringify(tags)
}

function deserializeTags(rawTags: string | null): string[] | undefined {
  if (!rawTags) {
    return undefined
  }

  try {
    const parsed = JSON.parse(rawTags) as unknown
    return Array.isArray(parsed)
      ? parsed.filter((tag): tag is string => typeof tag === "string")
      : undefined
  } catch {
    const tags = rawTags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)

    return tags.length > 0 ? tags : undefined
  }
}
