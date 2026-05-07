import fs from 'node:fs/promises';
import { PageSizes, PDFDocument } from 'pdf-lib';

const getA4PageSize = (width: number, height: number): [number, number] =>
  width > height ? [PageSizes.A4[1], PageSizes.A4[0]] : PageSizes.A4;

const scaleToFit = (
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number
) => {
  const scale = Math.min(targetWidth / sourceWidth, targetHeight / sourceHeight);

  return {
    width: sourceWidth * scale,
    height: sourceHeight * scale,
  };
};

const getCenteredOffset = (pageSize: number, contentSize: number) =>
  (pageSize - contentSize) / 2;

// Rebuilds a PDF so each page sits on an A4 canvas without changing its aspect ratio.
export async function normalizePdfToA4(
  inputPath: string,
  outputPath: string
): Promise<void> {
  const sourcePdf = await PDFDocument.load(await fs.readFile(inputPath));
  const normalizedPdf = await PDFDocument.create();
  const sourcePages = sourcePdf.getPages();
  const embeddedPages = await normalizedPdf.embedPages(sourcePages);

  sourcePages.forEach((sourcePage, index) => {
    const embeddedPage = embeddedPages[index];
    const { width: sourceWidth, height: sourceHeight } = sourcePage.getSize();
    const [pageWidth, pageHeight] = getA4PageSize(sourceWidth, sourceHeight);
    const page = normalizedPdf.addPage([pageWidth, pageHeight]);
    const scaledPage = scaleToFit(
      embeddedPage.width,
      embeddedPage.height,
      pageWidth,
      pageHeight
    );

    page.drawPage(embeddedPage, {
      x: getCenteredOffset(pageWidth, scaledPage.width),
      y: getCenteredOffset(pageHeight, scaledPage.height),
      width: scaledPage.width,
      height: scaledPage.height,
    });
  });

  await fs.writeFile(outputPath, await normalizedPdf.save());
}
