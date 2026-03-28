import type { Bundle } from "../../domain/bundle.js"

export interface BundleRepository {
  create(bundle: Bundle): Promise<void>
  delete(id: string): Promise<void>
  list(): Promise<Bundle[]>
}
