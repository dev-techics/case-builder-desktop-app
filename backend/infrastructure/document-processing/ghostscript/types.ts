export type GhostscriptArchiveFormat = 'file' | 'zip' | 'tar.gz';

export type GhostscriptArtifact = {
  version: string;
  url: string;
  sha256?: string;
  archiveFormat: GhostscriptArchiveFormat;
  binaryRelativePath: string;
};

export type GhostscriptManagerOptions = {
  installDirectory: string;
  requireGhostscript?: boolean;
};
