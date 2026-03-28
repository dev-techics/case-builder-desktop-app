import { ValidationError } from "../../domain/errors.js"
import type { BundleRepository } from "../ports/bundleRepository.js"

export class DeleteBundleUseCase {
  constructor(private readonly bundleRepository: BundleRepository) {}

  async execute(id: string): Promise<void> {
    if (typeof id !== "string" || !id.trim()) {
      throw new ValidationError("Bundle id is required.")
    }
    await this.bundleRepository.delete(id)
  }
}
