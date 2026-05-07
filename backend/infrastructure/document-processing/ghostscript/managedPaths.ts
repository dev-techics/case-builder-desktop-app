import path from 'node:path';
import type { GhostscriptArtifact } from './types.js';

// Returns the install directory for one managed Ghostscript version.
export const getManagedInstallRoot = (
  installDirectory: string,
  version: string
) => path.join(installDirectory, version);

// Returns the full path where a managed Ghostscript binary should live.
export const getManagedBinaryPath = (
  installDirectory: string,
  artifact: GhostscriptArtifact
) =>
  path.join(
    getManagedInstallRoot(installDirectory, artifact.version),
    artifact.binaryRelativePath
  );

// Resolves the extracted archive root before copying it into the managed directory.
export const resolveArchiveRoot = (
  extractedRoot: string,
  resolvedBinaryPath: string,
  binaryRelativePath: string
) => {
  const normalizedBinaryRelativePath = path.normalize(binaryRelativePath);
  if (!resolvedBinaryPath.endsWith(normalizedBinaryRelativePath)) {
    return extractedRoot;
  }

  const archiveRoot = resolvedBinaryPath.slice(
    0,
    resolvedBinaryPath.length - normalizedBinaryRelativePath.length
  );

  if (!archiveRoot) {
    return extractedRoot;
  }

  return archiveRoot.endsWith(path.sep)
    ? archiveRoot.slice(0, -1)
    : archiveRoot;
};
