import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { PageDecoration } from '../context/ExportTypes.js';

type ApplyPageDecorationInput = {
  skipLeadingPages?: number;
  skipTrailingPages?: number;
  decoration: PageDecoration;
};

const MARGIN_X = 36;
const MARGIN_TOP = 24;
const MARGIN_BOTTOM = 20;
const FONT_SIZE = 9;
const COLOR = rgb(0.45, 0.45, 0.45);

export class PageDecorationService {
  async applyAll(
    pdf: PDFDocument,
    input: ApplyPageDecorationInput
  ): Promise<void> {
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const skipLeadingPages = input.skipLeadingPages ?? 0;
    const skipTrailingPages = input.skipTrailingPages ?? 0;
    const lastDecoratedPageIndex = pdf.getPageCount() - skipTrailingPages - 1;

    for (let pageIndex = skipLeadingPages; pageIndex <= lastDecoratedPageIndex; pageIndex++) {
      const page = pdf.getPage(pageIndex);
      const { width, height } = page.getSize();
      const headerLeft = sanitizeDecorationText(input.decoration.headerLeft);
      const headerRight = sanitizeDecorationText(input.decoration.headerRight);
      const footer = sanitizeDecorationText(input.decoration.footer);

      if (headerLeft) {
        page.drawText(headerLeft, {
          x: MARGIN_X,
          y: height - MARGIN_TOP,
          size: FONT_SIZE,
          font,
          color: COLOR,
        });
      }

      if (headerRight) {
        page.drawText(headerRight, {
          x: Math.max(
            MARGIN_X,
            width - MARGIN_X - font.widthOfTextAtSize(headerRight, FONT_SIZE)
          ),
          y: height - MARGIN_TOP,
          size: FONT_SIZE,
          font,
          color: COLOR,
        });
      }

      if (footer) {
        page.drawText(footer, {
          x: MARGIN_X,
          y: MARGIN_BOTTOM,
          size: FONT_SIZE,
          font,
          color: COLOR,
        });
      }

      if (input.decoration.showPageNumbers) {
        const pageLabel = `Page ${pageIndex + 1}`;
        page.drawText(pageLabel, {
          x: Math.max(
            MARGIN_X,
            width - MARGIN_X - font.widthOfTextAtSize(pageLabel, FONT_SIZE)
          ),
          y: MARGIN_BOTTOM,
          size: FONT_SIZE,
          font,
          color: COLOR,
        });
      }
    }
  }
}

function sanitizeDecorationText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}
