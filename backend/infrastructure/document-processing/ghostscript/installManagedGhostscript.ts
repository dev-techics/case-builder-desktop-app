import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { downloadArchiveWithRetries, verifyChecksum } from './downloadArchive.js';
import {
  ensureParentDirectory,
  findFileRecursively,
  makeExecutableIfNeeded,
  pathExists,
} from './filesystem.js';
import { extractGhostscriptArchive } from './extractArchive.js';
import { getManagedInstallRoot, resolveArchiveRoot } from './managedPaths.js';
import type { GhostscriptArtifact } from './types.js';

type InstallManagedGhostscriptOptions = {
  artifact: GhostscriptArtifact;
  installDirectory: string;
};

// Downloads and installs a managed Ghostscript binary into the app data folder.
export const installManagedGhostscript = async (
  options: InstallManagedGhostscriptOptions
): Promise<string> => {
  const { artifact, installDirectory } = options;
  const installRoot = getManagedInstallRoot(installDirectory, artifact.version);
  const stagingRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'case-builder-gs-'));
  const archivePath = path.join(stagingRoot, `ghostscript-${artifact.version}`);
  const extractedRoot = path.join(stagingRoot, 'extracted');

  try {
    await downloadArchiveWithRetries(artifact.url, archivePath);
    await verifyChecksum(archivePath, artifact.sha256);
    await extractGhostscriptArchive(
      archivePath,
      extractedRoot,
      artifact.archiveFormat,
      artifact.binaryRelativePath
    );

    const stagedBinaryPath = path.join(
      extractedRoot,
      artifact.binaryRelativePath
    );
    const resolvedBinaryPath = (await pathExists(stagedBinaryPath))
      ? stagedBinaryPath
      : await findFileRecursively(
          extractedRoot,
          path.basename(artifact.binaryRelativePath)
        );

    if (!resolvedBinaryPath) {
      throw new Error(
        'Ghostscript download completed, but the binary could not be found in the archive.'
      );
    }

    await fs.mkdir(installRoot, { recursive: true });
    const archiveRoot = resolveArchiveRoot(
      extractedRoot,
      resolvedBinaryPath,
      artifact.binaryRelativePath
    );
    await fs.cp(archiveRoot, installRoot, { recursive: true, force: true });

    const expectedBinaryPath = path.join(installRoot, artifact.binaryRelativePath);
    const finalBinaryPath = (await pathExists(expectedBinaryPath))
      ? expectedBinaryPath
      : await findFileRecursively(
          installRoot,
          path.basename(artifact.binaryRelativePath)
        );

    if (!finalBinaryPath) {
      throw new Error(
        'Ghostscript installed, but the executable could not be resolved.'
      );
    }

    await ensureParentDirectory(finalBinaryPath);
    await makeExecutableIfNeeded(finalBinaryPath);

    return finalBinaryPath;
  } finally {
    await fs.rm(stagingRoot, { recursive: true, force: true });
  }
};
