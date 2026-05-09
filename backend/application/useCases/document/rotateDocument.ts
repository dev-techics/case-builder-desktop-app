import { DocumentRepository } from '../../ports/documentRepository.js';

export class RotateDocumentUseCase {
  constructor(private readonly documentRepository: DocumentRepository) {}

  async execute(input: { bundleId: string; documentId: string }) {}
}
