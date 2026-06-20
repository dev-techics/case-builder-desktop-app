import fs from 'node:fs/promises';
import path from 'node:path';
import type { DocumentStorage } from '../../application/ports/documents/documentStorage.js';

export class LocalDocumentStorage implements DocumentStorage {
  constructor(private readonly storageRoot: string) {}

  async copyFromPath(input: {
    bundleId: string;
    documentId: string;
    sourcePath: string;
    originalName: string;
  }) {
    // make bundle directory for storing documents
    const bundleDirectory = path.join(this.storageRoot, input.bundleId);
    await fs.mkdir(bundleDirectory, { recursive: true });

    const originalExtension =
      path.extname(input.originalName || input.sourcePath).toLowerCase() ||
      '.pdf';
    const fileName = `${input.documentId}${originalExtension}`;
    const destinationPath = path.join(bundleDirectory, fileName);

    await fs.copyFile(input.sourcePath, destinationPath);

    return {
      storagePath: path.posix.join(input.bundleId, fileName),
    };
  }

  async writeBytes(input: {
    bundleId: string;
    documentId: string;
    fileName: string;
    bytes: Uint8Array;
  }) {
    const bundleDirectory = path.join(this.storageRoot, input.bundleId);
    await fs.mkdir(bundleDirectory, { recursive: true });

    const extension = path.extname(input.fileName).toLowerCase() || '.pdf';
    const fileName = `${input.documentId}${extension}`;
    const destinationPath = path.join(bundleDirectory, fileName);

    await fs.writeFile(destinationPath, Buffer.from(input.bytes));

    return {
      storagePath: path.posix.join(input.bundleId, fileName),
    };
  }

  async deleteByStoragePath(storagePath: string): Promise<void> {
    const absolutePath = path.join(this.storageRoot, storagePath);
    await fs.rm(absolutePath, { force: true });
  }

  async deleteBundleStorage(bundleId: string): Promise<void> {
    const bundleDirectory = path.join(this.storageRoot, bundleId);
    await fs.rm(bundleDirectory, { recursive: true, force: true });
  }
  // get storage path of a stored document
  async getFilePath(bundleId: string, documentId: string): Promise<string> {
    const bundleDir = path.join(this.storageRoot, bundleId);
    const files = await fs.readdir(bundleDir);
    const file = files.find(f => path.parse(f).name === documentId);
    if (!file) throw new Error('File not found');
    return path.join(bundleDir, file);
  }
}
