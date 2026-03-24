import type { Bundle } from "../../domain/bundle"

export interface BundleRepository {
  create(bundle: Bundle): Promise<void>
  delete(id: string): Promise<void>
  list(): Promise<Bundle[]>
}
