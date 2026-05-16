import fs from 'node:fs/promises';
import path from 'node:path';
import type { PdfCompressor } from '../../compression/pdfCompressor.js';
import type { ExportContext } from '../context/ExportContext.js';

export async function saveOutput(ctx: ExportContext): Promise<void> {
  ctx.currentStep = 'saveOutput';
  ctx.onProgress?.({ step: 'saveOutput', progress: 0, message: 'Saving PDF…' });

  if (!ctx.assembledPdf) {
    throw new Error(
      '[saveOutput] assembledPdf is missing — assembleDocuments must run first'
    );
  }

  const { outputPath, compress } = ctx.options;
  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  const bytes = await ctx.assembledPdf.save();

  if (compress && ctx.pdfCompressor) {
    await saveCompressed(bytes, outputPath, ctx.pdfCompressor, ctx);
  } else {
    await fs.writeFile(outputPath, bytes);
  }

  ctx.outputPath = outputPath;
  ctx.onProgress?.({ step: 'saveOutput', progress: 100, message: 'Saved' });
}

// ── Ghostscript compression ────────────────────────────────────────────────────

async function saveCompressed(
  bytes: Uint8Array,
  outputPath: string,
  pdfCompressor: PdfCompressor,
  ctx: ExportContext
): Promise<void> {
  const tempInputPath = `${outputPath}.uncompressed.tmp.pdf`;
  const tempOutputPath = `${outputPath}.compressed.tmp.pdf`;
  await fs.writeFile(tempInputPath, bytes);

  ctx.onProgress?.({
    step: 'saveOutput',
    progress: 30,
    message: 'Compressing with Ghostscript…',
  });

  try {
    const result = await pdfCompressor.compress(tempInputPath, tempOutputPath);
    const sourcePath = result.compressed ? tempOutputPath : tempInputPath;

    await fs.rm(outputPath, { force: true });
    await fs.rename(sourcePath, outputPath);
  } catch (error) {
    console.warn('[saveOutput] Compression failed; saving uncompressed.', error);
    await fs.rm(outputPath, { force: true });
    await fs.rename(tempInputPath, outputPath);
  } finally {
    await fs.unlink(tempInputPath).catch(() => undefined);
    await fs.unlink(tempOutputPath).catch(() => undefined);
  }

  ctx.onProgress?.({
    step: 'saveOutput',
    progress: 90,
    message: 'Compression complete',
  });
}
