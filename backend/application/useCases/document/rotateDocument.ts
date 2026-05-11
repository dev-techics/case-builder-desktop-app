import { ValidationError } from '../../../domain/errors.js';
import { RotateDocumentProcessor } from '../../ports/documents/documentProcessor.js';
import { DocumentRepository } from '../../ports/documents/documentRepository.js';
import { DocumentStorage } from '../../ports/documents/documentStorage.js';

export class RotateDocumentUseCase {
  constructor(
    private readonly documentRepository: DocumentRepository,
    private readonly documentStorage: DocumentStorage,
    private readonly rotateDocumentProcessor: RotateDocumentProcessor
  ) {}

  async execute(input: {
    bundleId: string;
    documentId: string;
    pageNumber: number;
    rotation: 0 | 90 | 180 | 270;
  }) {
    /* ------------------ Validate all inputs ----------------*/
    const bundleId = input.bundleId?.trim();
    const documentId = input.documentId?.trim();
    const pageNumber = input.pageNumber;
    const rotation = input.rotation;
    /* ---------- Validate bundle ID ---------- */
    if (!bundleId) {
      throw new ValidationError('Bundle id is required!');
    }
    // check if the bundle exists in our system
    const bundle = await this.documentRepository.getBundleName(bundleId);
    if (!bundle) {
      throw new ValidationError('Bundle not found');
    }
    /* ---------- Validate document ID -----------*/
    if (!documentId) {
      throw new ValidationError('Document id is required');
    }
    // check the document exists in the bundle
    const document = await this.documentRepository.getById(documentId);
    if (!document) {
      throw new ValidationError('Document not found');
    }

    const filePath = await this.documentStorage.getFilePath(
      bundleId,
      documentId
    );
    /* ---------- Validate rotation deg ------------ */
    if (![90, 180, 270].includes(rotation)) {
      throw new ValidationError('Invalid rotation');
    }

    if (!Number.isInteger(pageNumber) || pageNumber <= 0) {
      throw new ValidationError('Page number is required');
    }

    /* ----------- Validate page number --------------*/
    // Storage gives us the path and the processor validates page existence.
    const totalPages =
      await this.rotateDocumentProcessor.getPageCount(filePath);

    if (pageNumber > totalPages) {
      throw new ValidationError(
        `Page ${input.pageNumber} does not exist. Document has ${totalPages} pages.`
      );
    }
    console.log('page number ' + pageNumber);
    console.log('total pages ' + totalPages);
    console.log(' Validation passed');
    /*============= Validation Ends here ================= */

    await this.rotateDocumentProcessor.rotatePage({
      filePath,
      pageNumber,
      rotation,
    });
  }
}
