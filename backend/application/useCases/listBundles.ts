import type { Bundle } from "../../domain/bundle"
import type { BundleRepository } from "../ports/bundleRepository"

export class ListBundlesUseCase {
  constructor(private readonly bundleRepository: BundleRepository) {}

  async execute(): Promise<Bundle[]> {
    return this.bundleRepository.list()
  }
}
