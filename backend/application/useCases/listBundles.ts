import type { Bundle } from "../../domain/bundle.js"
import type { BundleRepository } from "../ports/bundleRepository.js"

export class ListBundlesUseCase {
  constructor(private readonly bundleRepository: BundleRepository) {}

  async execute(): Promise<Bundle[]> {
    return this.bundleRepository.list()
  }
}
