import { v4 as uuidv4 } from "uuid"
import {
  normalizeBundleName,
  normalizeCaseNumber,
  type Bundle,
} from "../../domain/bundle.js"
import { ValidationError } from "../../domain/errors.js"
import type { BundleRepository } from "../ports/bundleRepository.js"

export interface CreateBundleInput {
  name: string
  caseNumber?: string
  status?: Bundle["status"]
  color?: Bundle["color"]
  description?: string
  tags?: string[]
}

export class CreateBundleUseCase {
  constructor(private readonly bundleRepository: BundleRepository) {}

  async execute(input: CreateBundleInput): Promise<Bundle> {
    if (typeof input?.name !== "string") {
      throw new ValidationError("Bundle name must be a string.")
    }

    const name = normalizeBundleName(input.name)
    if (!name) {
      throw new ValidationError("Bundle name is required.")
    }

    const caseNumber = normalizeCaseNumber(input.caseNumber ?? "")
    if (!caseNumber) {
      throw new ValidationError("Case number is required.")
    }

    const now = new Date().toISOString()
    const bundle: Bundle = {
      id: uuidv4(),
      name,
      caseNumber,
      documentCount: 0,
      status: input.status ?? "In Progress",
      color: input.color ?? "blue",
      createdAt: now,
      updatedAt: now,
      description: input.description,
      tags: input.tags,
    }

    await this.bundleRepository.create(bundle)
    return bundle
  }
}
