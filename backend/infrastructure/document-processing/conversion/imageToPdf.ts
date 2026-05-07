import { nativeImage } from 'electron';
import fs from 'node:fs/promises';
import { PDFDocument } from 'pdf-lib';

// Converts an image file into a single-page PDF before import.
export async function convertImageToPdf(
  inputPath: string,
  outputPath: string
): Promise<void> {
  const image = nativeImage.createFromPath(inputPath);
  if (image.isEmpty()) {
    throw new Error('The selected image could not be converted to PDF.');
  }

  const pngBytes = image.toPNG();
  const pdfDocument = await PDFDocument.create();
  const embeddedImage = await pdfDocument.embedPng(pngBytes);
  const { width, height } = embeddedImage.scale(1);
  const page = pdfDocument.addPage([width, height]);

  page.drawImage(embeddedImage, {
    x: 0,
    y: 0,
    width,
    height,
  });

  await fs.writeFile(outputPath, await pdfDocument.save());
}
