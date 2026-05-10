import fs from 'node:fs/promises';
import path from 'node:path';
import { runCommand } from '../gs-command-runner/runCommand.js';
import type { GhostscriptArchiveFormat } from './types.js';

// Extracts a managed Ghostscript archive into a staging directory.
export const extractGhostscriptArchive = async (
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
