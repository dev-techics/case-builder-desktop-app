import { PDFDocument, PageSizes, StandardFonts, rgb } from 'pdf-lib';

const [PAGE_W, PAGE_H] = PageSizes.A4;
const MARGIN = 72;
const BRAND = rgb(0.2, 0.35, 0.65); // navy blue accent

export interface PlaceholderCoverPageInput {
  title: string;
  subtitle?: string;
  createdAt?: Date;
  documentCount: number;
}

export class CoverPageGenerator {
  /**
   * Temporary cover page until the saved HTML template can be rendered to PDF.
   */
  async generatePlaceholder(
    input: PlaceholderCoverPageInput
  ): Promise<PDFDocument> {
    const doc = await PDFDocument.create();
    const page = doc.addPage([PAGE_W, PAGE_H]);

    const bold = await doc.embedFont(StandardFonts.HelveticaBold);
    const regular = await doc.embedFont(StandardFonts.Helvetica);
    const {
      title,
      subtitle,
      createdAt,
      documentCount,
    } = input;

    // Top accent bar
    page.drawRectangle({
      x: 0,
      y: PAGE_H - 14,
      width: PAGE_W,
      height: 14,
      color: BRAND,
    });

    // Title block — vertically centred
    const midY = PAGE_H / 2;

    page.drawText(title, {
      x: MARGIN,
      y: midY + 40,
      size: 26,
      font: bold,
      color: rgb(0.1, 0.1, 0.1),
      maxWidth: PAGE_W - MARGIN * 2,
    });

    page.drawLine({
      start: { x: MARGIN, y: midY + 24 },
      end: { x: PAGE_W - MARGIN, y: midY + 24 },
      thickness: 1.5,
      color: BRAND,
    });

    if (subtitle) {
      page.drawText(subtitle, {
        x: MARGIN,
        y: midY,
        size: 14,
        font: regular,
        color: rgb(0.35, 0.35, 0.35),
        maxWidth: PAGE_W - MARGIN * 2,
      });
    }

    page.drawText(
      `${documentCount} document${documentCount === 1 ? '' : 's'} in bundle`,
      {
        x: MARGIN,
        y: midY - 42,
        size: 12,
        font: regular,
        color: rgb(0.4, 0.4, 0.4),
      }
    );

    page.drawText('Temporary cover page', {
      x: MARGIN,
      y: midY - 66,
      size: 11,
      font: regular,
      color: rgb(0.55, 0.55, 0.55),
    });

    // Date — bottom left
    const dateStr = (createdAt ?? new Date()).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    page.drawText(dateStr, {
      x: MARGIN,
      y: MARGIN,
      size: 11,
      font: regular,
      color: rgb(0.5, 0.5, 0.5),
    });

    // Bottom accent bar
    page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: 8, color: BRAND });

    return doc;
  }
}
