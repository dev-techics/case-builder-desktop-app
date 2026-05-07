import { runCommand } from '../process/runCommand.js';
import { getSystemGhostscriptCandidates } from './configuration.js';

// Finds a usable Ghostscript binary already installed on the host system.
export const findSystemGhostscript = async () => {
  for (const candidate of getSystemGhostscriptCandidates()) {
    try {
      await runCommand(candidate, ['--version']);
      return candidate;
    } catch {
      continue;
    }
  }

  return null;
};
