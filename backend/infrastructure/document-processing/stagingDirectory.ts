import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const TEMP_DIRECTORY_PREFIX = 'case-builder-import-';

// Creates a temporary workspace for conversion and compression output files.
export const createProcessingTempDirectory = async () =>
  fs.mkdtemp(path.join(os.tmpdir(), TEMP_DIRECTORY_PREFIX));

// Removes a temporary workspace after the processed file has been consumed.
export const removeProcessingTempDirectory = async (directory: string) => {
  await fs.rm(directory, { recursive: true, force: true });
};

// Builds the cleanup function stored on prepared import documents.
export const createTempDirectoryCleanup = (directory: string) => async () => {
  await removeProcessingTempDirectory(directory);
};
