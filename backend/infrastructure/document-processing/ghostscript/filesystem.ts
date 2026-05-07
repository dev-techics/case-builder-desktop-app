import { constants as fsConstants } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';

const getFileAccessMode = () =>
  process.platform === 'win32' ? fsConstants.F_OK : fsConstants.X_OK;

// Checks whether a Ghostscript file exists and is executable when needed.
export const pathExists = async (targetPath: string) => {
  try {
    await fs.access(targetPath, getFileAccessMode());
    return true;
  } catch {
    return false;
  }
};

// Searches a small directory tree for the expected Ghostscript binary name.
export const findFileRecursively = async (
  rootDirectory: string,
  targetFileName: string,
  depth = 0
): Promise<string | null> => {
  if (depth > 4) {
    return null;
  }

  const entries = await fs.readdir(rootDirectory, { withFileTypes: true });
  for (const entry of entries) {
    const absolutePath = path.join(rootDirectory, entry.name);

    if (entry.isFile() && entry.name === targetFileName) {
      return absolutePath;
    }

    if (entry.isDirectory()) {
      const nestedMatch = await findFileRecursively(
        absolutePath,
        targetFileName,
        depth + 1
      );
      if (nestedMatch) {
        return nestedMatch;
      }
    }
  }

  return null;
};

// Creates the parent folder for a managed Ghostscript binary when needed.
export const ensureParentDirectory = async (targetPath: string) => {
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
};

// Marks the installed Ghostscript binary as executable on non-Windows hosts.
export const makeExecutableIfNeeded = async (targetPath: string) => {
  if (process.platform === 'win32') {
    return;
  }

  await fs.chmod(targetPath, 0o755);
};
