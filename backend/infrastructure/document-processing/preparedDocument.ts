import type { PreparedImportDocument } from '../../application/ports/documents/documentProcessor.js';

export const noopCleanup = async () => {};

// Wraps a processed file with the cleanup contract expected by the use case.
export const createPreparedDocument = (
  input: Omit<PreparedImportDocument, 'cleanup'>,
  cleanup: PreparedImportDocument['cleanup']
): PreparedImportDocument => ({
  ...input,
  cleanup,
});
