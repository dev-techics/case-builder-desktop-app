import {
  getConfiguredGhostscriptArtifact,
  getConfiguredGhostscriptBinaryPath,
} from './configuration.js';
import { pathExists } from './filesystem.js';
import { findSystemGhostscript } from './findSystemGhostscript.js';
import { installManagedGhostscript } from './installManagedGhostscript.js';
import { getManagedBinaryPath } from './managedPaths.js';
import type { GhostscriptManagerOptions } from './types.js';

export class GhostscriptManager {
  private readonly installDirectory: string;
  private readonly requireGhostscript: boolean;
  private resolvePromise: Promise<string | null> | null = null;

  constructor(options: GhostscriptManagerOptions) {
    this.installDirectory = options.installDirectory;
    this.requireGhostscript = options.requireGhostscript ?? false;
  }

  // Resolves a usable Ghostscript binary path and caches the lookup work.
  async getBinaryPath(): Promise<string | null> {
    if (!this.resolvePromise) {
      this.resolvePromise = this.resolveBinaryPath().catch(error => {
        this.resolvePromise = null;
        throw error;
      });
    }

    return this.resolvePromise;
  }

  // Resolves a Ghostscript binary path and throws when it cannot be found.
  async ensureBinaryPath(): Promise<string> {
    const binaryPath = await this.getBinaryPath();
    if (binaryPath) {
      return binaryPath;
    }

    throw new Error(this.getUnavailableMessage());
  }

  private async resolveBinaryPath(): Promise<string | null> {
    const configuredBinaryPath = getConfiguredGhostscriptBinaryPath();
    if (configuredBinaryPath && (await pathExists(configuredBinaryPath))) {
      return configuredBinaryPath;
    }

    const systemBinaryPath = await findSystemGhostscript();
    if (systemBinaryPath) {
      return systemBinaryPath;
    }

    const artifact = getConfiguredGhostscriptArtifact();
    if (!artifact) {
      if (this.requireGhostscript) {
        throw new Error(this.getUnavailableMessage());
      }

      return null;
    }

    const managedBinaryPath = getManagedBinaryPath(
      this.installDirectory,
      artifact
    );
    if (await pathExists(managedBinaryPath)) {
      return managedBinaryPath;
    }

    return installManagedGhostscript({
      artifact,
      installDirectory: this.installDirectory,
    });
  }

  private getUnavailableMessage() {
    return [
      'Ghostscript is not available.',
      'Install a system Ghostscript binary, or configure the managed download with',
      '`CASE_BUILDER_GHOSTSCRIPT_URL_<PLATFORM>` and optional checksum settings.',
    ].join(' ');
  }
}
