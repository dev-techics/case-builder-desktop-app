import { promises as fs } from "node:fs"
import path from "node:path"
import type { Bundle } from "../../domain/bundle"
import type { BundleRepository } from "../../application/ports/bundleRepository"

type BundlesDbShape = {
  bundles: Bundle[]
}

export class JsonFileBundleRepository implements BundleRepository {
  constructor(private readonly filePath: string) {}

  async create(bundle: Bundle): Promise<void> {
    const db = await this.readDb()
    db.bundles.unshift(bundle)
    await this.writeDb(db)
  }

  async delete(id: string): Promise<void> {
    const db = await this.readDb()
    db.bundles = db.bundles.filter((bundle) => bundle.id !== id)
    await this.writeDb(db)
  }

  async list(): Promise<Bundle[]> {
    const db = await this.readDb()
    return db.bundles
  }

  private async readDb(): Promise<BundlesDbShape> {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true })

    try {
      const raw = await fs.readFile(this.filePath, "utf8")
      const parsed = JSON.parse(raw) as Partial<BundlesDbShape> | null
      return { bundles: Array.isArray(parsed?.bundles) ? parsed.bundles : [] }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return { bundles: [] }
      }
      throw error
    }
  }

  private async writeDb(db: BundlesDbShape): Promise<void> {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true })
    const tmpPath = `${this.filePath}.tmp`
    await fs.writeFile(tmpPath, JSON.stringify(db, null, 2), "utf8")
    await fs.rename(tmpPath, this.filePath)
  }
}
