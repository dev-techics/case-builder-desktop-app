import fs from 'node:fs/promises';
import path from 'node:path';
import type { DocumentStorage } from '../../application/ports/documentStorage.js';

export class LocalDocumentStorage implements DocumentStorage {
  constructor(private readonly storageRoot: string) {}

  async copyFromPath(input: {
    bundleId: string;
    documentId: string;
    sourcePath: string;
    originalName: string;
  }) {
    const bundleDirectory = path.join(this.storageRoot, input.bundleId);
    await fs.mkdir(bundleDirectory, { recursive: true });

    const originalExtension =
      path.extname(input.originalName || input.sourcePath).toLowerCase() || '.pdf';
    const fileName = `${input.documentId}${originalExtension}`;
    const destinationPath = path.join(bundleDirectory, fileName);

    await fs.copyFile(input.sourcePath, destinationPath);

    return {
      storagePath: path.posix.join(input.bundleId, fileName),
    };
  }

  async deleteByStoragePath(storagePath: string): Promise<void> {
    const absolutePath = path.join(this.storageRoot, storagePath);
    await fs.rm(absolutePath, { force: true });
  }
}

