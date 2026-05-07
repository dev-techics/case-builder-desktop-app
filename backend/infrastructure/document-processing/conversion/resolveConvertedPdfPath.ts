import fs from 'node:fs/promises';
import path from 'node:path';

const pathExists = async (targetPath: string) => {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
};

const findConvertedPdfName = (entries: string[]) =>
  entries.find(entry => entry.toLowerCase().endsWith('.pdf'));

// Resolves the PDF file produced by a document conversion command.
export async function resolveConvertedPdfPath(
  outputDirectory: string,
  sourcePath: string,
  defaultOutputPath: string
): Promise<string> {
  if (await pathExists(defaultOutputPath)) {
    return defaultOutputPath;
  }

  const expectedPath = path.join(
    outputDirectory,
    `${path.parse(sourcePath).name}.pdf`
  );
  if (await pathExists(expectedPath)) {
    return expectedPath;
  }

  const tempEntries = await fs.readdir(outputDirectory);
  const discoveredPdfName = findConvertedPdfName(tempEntries);
  if (!discoveredPdfName) {
    throw new Error('The file was converted, but no PDF output was found.');
  }

  return path.join(outputDirectory, discoveredPdfName);
}
