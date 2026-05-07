import { createHash } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import fs from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';

const hashFile = async (filePath: string) => {
  const fileBuffer = await fs.readFile(filePath);
  return createHash('sha256').update(fileBuffer).digest('hex');
};

// Validates the downloaded Ghostscript archive against the configured checksum.
export const verifyChecksum = async (
  filePath: string,
  expectedHash?: string
) => {
  if (!expectedHash) {
    return;
  }

  const actualHash = await hashFile(filePath);
  if (actualHash.toLowerCase() !== expectedHash.toLowerCase()) {
    throw new Error('Ghostscript download checksum validation failed.');
  }
};

const downloadArchive = async (url: string, destinationPath: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Ghostscript download failed with status ${response.status}.`
    );
  }

  if (!response.body) {
    throw new Error('Ghostscript download returned an empty response body.');
  }

  await pipeline(response.body, createWriteStream(destinationPath));
};

// Downloads a Ghostscript archive with a few retries for transient failures.
export const downloadArchiveWithRetries = async (
  url: string,
  destinationPath: string,
  retries = 3
) => {
  let lastError: unknown;

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      await downloadArchive(url, destinationPath);
      return;
    } catch (error) {
      lastError = error;
      await fs.rm(destinationPath, { force: true });

      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, attempt * 500));
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('Ghostscript download failed.');
};
