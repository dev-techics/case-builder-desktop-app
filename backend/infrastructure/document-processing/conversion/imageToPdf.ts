import { nativeImage } from 'electron';
import sharp from 'sharp';
import heicConvert from 'heic-convert';
import fs from 'node:fs/promises';
import path from 'node:path';
import { PDFDocument, PageSizes } from 'pdf-lib';

const A4_WIDTH_PT = PageSizes.A4[0];
const A4_HEIGHT_PT = PageSizes.A4[1];

const HEIC_EXTENSIONS = new Set(['.heic', '.heif']);
const SHARP_EXTENSIONS = new Set(['.dng', '.tiff', '.tif', '.avif', '.webp']);

const scaleToFit = (
  imgW: number,
  imgH: number,
  targetW: number,
  targetH: number
) => {
  const scale = Math.min(targetW / imgW, targetH / imgH);
  return { width: imgW * scale, height: imgH * scale };
};

const centerOffset = (pageSize: number, contentSize: number) =>
  (pageSize - contentSize) / 2;

// ── Image → PNG bytes ─────────────────────────────────────────────────────────

async function toPngBytes(inputPath: string): Promise<Buffer> {
  const ext = path.extname(inputPath).toLowerCase();

  // HEIC/HEIF — use heic-convert (works cross-platform, bundles its own decoder)
  if (HEIC_EXTENSIONS.has(ext)) {
    const inputBuffer = await fs.readFile(inputPath);
    const jpegBuffer = await heicConvert({
      buffer: inputBuffer,
      format: 'JPEG',
      quality: 1,
    });
    // Convert JPEG → PNG via sharp for consistent downstream handling
    return sharp(Buffer.from(jpegBuffer)).toFormat('png').toBuffer();
  }

  // DNG/TIFF — use sharp
  if (SHARP_EXTENSIONS.has(ext)) {
    return sharp(inputPath).rotate().toFormat('png').toBuffer();
  }

  // Common formats — use Electron's nativeImage
  const image = nativeImage.createFromPath(inputPath);
  if (image.isEmpty()) {
    throw new Error(`The image could not be read: ${path.basename(inputPath)}`);
  }
  return image.toPNG();
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function convertImageToPdf(
  inputPath: string,
  outputPath: string
): Promise<void> {
  const pngBytes = await toPngBytes(inputPath);

  const pdfDocument = await PDFDocument.create();
  const embeddedImage = await pdfDocument.embedPng(pngBytes);
  const { width: imgW, height: imgH } = embeddedImage.scale(1);

  const isLandscape = imgW > imgH;
  const pageWidth = isLandscape ? A4_HEIGHT_PT : A4_WIDTH_PT;
  const pageHeight = isLandscape ? A4_WIDTH_PT : A4_HEIGHT_PT;

  const page = pdfDocument.addPage([pageWidth, pageHeight]);
  const { width: drawW, height: drawH } = scaleToFit(
    imgW,
    imgH,
    pageWidth,
    pageHeight
  );

  page.drawImage(embeddedImage, {
    x: centerOffset(pageWidth, drawW),
    y: centerOffset(pageHeight, drawH),
    width: drawW,
    height: drawH,
  });

  await fs.writeFile(outputPath, await pdfDocument.save());
}
