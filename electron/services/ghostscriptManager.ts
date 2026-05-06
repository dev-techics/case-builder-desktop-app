import { createHash } from 'node:crypto';
import { constants as fsConstants } from 'node:fs';
import { createWriteStream } from 'node:fs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { runCommand } from './commandRunner.js';
import { getGSInstallDir } from '../utils/index.js';

type GhostscriptArchiveFormat = 'file' | 'zip' | 'tar.gz';

type GhostscriptArtifact = {
  version: string;
  url: string;
  sha256?: string;
  archiveFormat: GhostscriptArchiveFormat;
  binaryRelativePath: string;
};

type GhostscriptManagerOptions = {
  requireGhostscript?: boolean;
};

const SYSTEM_GHOSTSCRIPT_CANDIDATES: Record<NodeJS.Platform, string[]> = {
  aix: ['gs'],
  android: ['gs'],
  darwin: ['gs'],
  freebsd: ['gs'],
  haiku: ['gs'],
  linux: ['gs'],
  openbsd: ['gs'],
  sunos: ['gs'],
  win32: ['gswin64c.exe', 'gswin32c.exe', 'gs.exe', 'gs'],
  cygwin: ['gs'],
  netbsd: ['gs'],
};

const DEFAULT_BINARY_RELATIVE_PATHS: Record<NodeJS.Platform, string> = {
  aix: 'bin/gs',
  android: 'bin/gs',
  darwin: 'bin/gs',
  freebsd: 'bin/gs',
  haiku: 'bin/gs',
  linux: 'bin/gs',
  openbsd: 'bin/gs',
  sunos: 'bin/gs',
  win32: 'bin/gswin64c.exe',
  cygwin: 'bin/gs',
  netbsd: 'bin/gs',
};

const DEFAULT_ARCHIVE_FORMATS: Record<
  NodeJS.Platform,
  GhostscriptArchiveFormat
> = {
  aix: 'tar.gz',
  android: 'tar.gz',
  darwin: 'tar.gz',
  freebsd: 'tar.gz',
  haiku: 'tar.gz',
  linux: 'tar.gz',
  openbsd: 'tar.gz',
  sunos: 'tar.gz',
  win32: 'zip',
  cygwin: 'tar.gz',
  netbsd: 'tar.gz',
};

const getPlatformKey = () => process.platform as NodeJS.Platform;

const getEnvKeySuffix = () => getPlatformKey().toUpperCase();

const getConfiguredArtifact = (): GhostscriptArtifact | null => {
  const suffix = getEnvKeySuffix();
  const url = process.env[`CASE_BUILDER_GHOSTSCRIPT_URL_${suffix}`]?.trim();
  if (!url) {
    return null;
  }

  const platform = getPlatformKey();
  const version =
    process.env.CASE_BUILDER_GHOSTSCRIPT_VERSION?.trim() || 'current';
  const archiveFormat =
    (process.env[`CASE_BUILDER_GHOSTSCRIPT_ARCHIVE_${suffix}`]?.trim() as
      | GhostscriptArchiveFormat
      | undefined) ?? DEFAULT_ARCHIVE_FORMATS[platform];
  const binaryRelativePath =
    process.env[
      `CASE_BUILDER_GHOSTSCRIPT_BINARY_RELATIVE_PATH_${suffix}`
    ]?.trim() || DEFAULT_BINARY_RELATIVE_PATHS[platform];
  const sha256 =
    process.env[`CASE_BUILDER_GHOSTSCRIPT_SHA256_${suffix}`]?.trim() ||
    undefined;

  return {
    version,
    url,
    sha256,
    archiveFormat,
    binaryRelativePath,
  };
};

const getManagedInstallRoot = (version: string) =>
  path.join(getGSInstallDir(), version);

const getManagedBinaryPath = (artifact: GhostscriptArtifact) =>
  path.join(
    getManagedInstallRoot(artifact.version),
    artifact.binaryRelativePath
  );

const getFileAccessMode = () =>
  process.platform === 'win32' ? fsConstants.F_OK : fsConstants.X_OK;

const pathExists = async (targetPath: string) => {
  try {
    await fs.access(targetPath, getFileAccessMode());
    return true;
  } catch {
    return false;
  }
};

const findSystemGhostscript = async () => {
  const candidates = SYSTEM_GHOSTSCRIPT_CANDIDATES[getPlatformKey()] ?? ['gs'];

  for (const candidate of candidates) {
    try {
      await runCommand(candidate, ['--version']);
      return candidate;
    } catch {
      continue;
    }
  }

  return null;
};

const hashFile = async (filePath: string) => {
  const fileBuffer = await fs.readFile(filePath);
  return createHash('sha256').update(fileBuffer).digest('hex');
};

const verifyChecksum = async (filePath: string, expectedHash?: string) => {
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

const downloadWithRetries = async (
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

const findFileRecursively = async (
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

const ensureParentDirectory = async (targetPath: string) => {
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
};

const resolveArchiveRoot = (
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

const extractArchive = async (
  archivePath: string,
  destinationPath: string,
  archiveFormat: GhostscriptArchiveFormat,
  binaryRelativePath: string
) => {
  await fs.mkdir(destinationPath, { recursive: true });

  if (archiveFormat === 'file') {
    const targetBinaryPath = path.join(
      destinationPath,
      path.basename(binaryRelativePath)
    );
    await fs.copyFile(archivePath, targetBinaryPath);
    return;
  }

  if (archiveFormat === 'zip') {
    if (process.platform === 'win32') {
      await runCommand('powershell.exe', [
        '-NoProfile',
        '-Command',
        'Expand-Archive',
        '-LiteralPath',
        archivePath,
        '-DestinationPath',
        destinationPath,
        '-Force',
      ]);
      return;
    }

    await runCommand('unzip', ['-q', archivePath, '-d', destinationPath]);
    return;
  }

  await runCommand('tar', ['-xzf', archivePath, '-C', destinationPath]);
};

const makeExecutableIfNeeded = async (targetPath: string) => {
  if (process.platform === 'win32') {
    return;
  }

  await fs.chmod(targetPath, 0o755);
};

export class GhostscriptManager {
  private readonly requireGhostscript: boolean;
  private resolvePromise: Promise<string | null> | null = null;

  constructor(options: GhostscriptManagerOptions = {}) {
    this.requireGhostscript = options.requireGhostscript ?? false;
  }

  async getBinaryPath(): Promise<string | null> {
    if (!this.resolvePromise) {
      this.resolvePromise = this.resolveBinaryPath().catch(error => {
        this.resolvePromise = null;
        throw error;
      });
    }

    return this.resolvePromise;
  }

  async ensureBinaryPath(): Promise<string> {
    const binaryPath = await this.getBinaryPath();
    if (binaryPath) {
      return binaryPath;
    }

    throw new Error(this.getUnavailableMessage());
  }

  private async resolveBinaryPath(): Promise<string | null> {
    const configuredBinaryPath =
      process.env.CASE_BUILDER_GHOSTSCRIPT_BINARY_PATH?.trim() || '';
    if (configuredBinaryPath && (await pathExists(configuredBinaryPath))) {
      return configuredBinaryPath;
    }

    const systemBinaryPath = await findSystemGhostscript();
    if (systemBinaryPath) {
      return systemBinaryPath;
    }

    const artifact = getConfiguredArtifact();
    if (!artifact) {
      if (this.requireGhostscript) {
        throw new Error(this.getUnavailableMessage());
      }

      return null;
    }

    const managedBinaryPath = getManagedBinaryPath(artifact);
    if (await pathExists(managedBinaryPath)) {
      return managedBinaryPath;
    }

    return this.installManagedBinary(artifact);
  }

  private async installManagedBinary(
    artifact: GhostscriptArtifact
  ): Promise<string> {
    const installRoot = getManagedInstallRoot(artifact.version);
    const stagingRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), 'case-builder-gs-')
    );
    const archivePath = path.join(
      stagingRoot,
      `ghostscript-${artifact.version}`
    );
    const extractedRoot = path.join(stagingRoot, 'extracted');

    try {
      await downloadWithRetries(artifact.url, archivePath);
      await verifyChecksum(archivePath, artifact.sha256);
      await extractArchive(
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

      const expectedBinaryPath = path.join(
        installRoot,
        artifact.binaryRelativePath
      );
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
  }

  private getUnavailableMessage() {
    return [
      'Ghostscript is not available.',
      'Install a system Ghostscript binary, or configure the managed download with',
      '`CASE_BUILDER_GHOSTSCRIPT_URL_<PLATFORM>` and optional checksum settings.',
    ].join(' ');
  }
}
