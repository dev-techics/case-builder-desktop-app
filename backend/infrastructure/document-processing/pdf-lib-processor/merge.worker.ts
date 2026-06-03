import fs from 'node:fs/promises';
import { parentPort, workerData } from 'node:worker_threads';
import { PDFDocument } from 'pdf-lib';

type MergeWorkerData = {
  filePaths?: string[];
};

const mergePdfs = async (filePaths: string[]) => {
  const mergedPdf = await PDFDocument.create();

  for (const filePath of filePaths) {
    const sourceBytes = await fs.readFile(filePath);
    const sourcePdf = await PDFDocument.load(sourceBytes);
    const pages = await mergedPdf.copyPages(
      sourcePdf,
      sourcePdf.getPageIndices()
    );

    for (const page of pages) {
      mergedPdf.addPage(page);
    }
  }

  return mergedPdf.save();
};

try {
  const filePaths = (workerData as MergeWorkerData).filePaths ?? [];
  const bytes = await mergePdfs(filePaths);
  const buffer = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength
  );

  parentPort?.postMessage({ bytes: buffer }, [buffer]);
} catch (error) {
  parentPort?.postMessage({
    error: error instanceof Error ? error.message : 'Failed to merge PDFs.',
  });
}
