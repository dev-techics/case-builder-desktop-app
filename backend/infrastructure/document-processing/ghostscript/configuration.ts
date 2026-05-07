import type {
  GhostscriptArchiveFormat,
  GhostscriptArtifact,
} from './types.js';

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

// Reads the explicitly configured Ghostscript binary path from the environment.
export const getConfiguredGhostscriptBinaryPath = () =>
  process.env.CASE_BUILDER_GHOSTSCRIPT_BINARY_PATH?.trim() || '';

// Builds the managed-download configuration for the current platform.
export const getConfiguredGhostscriptArtifact = (): GhostscriptArtifact | null => {
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

// Returns the platform-specific executable names to probe on the system PATH.
export const getSystemGhostscriptCandidates = () =>
  SYSTEM_GHOSTSCRIPT_CANDIDATES[getPlatformKey()] ?? ['gs'];
