/**
 * backend/application/ports/pdf-generator/pdfGenerator.ts
 *
 * Port (interface) for converting HTML to PDF.
 *
 * The application layer depends on this abstraction only.
 * The concrete implementation (ElectronPdfGenerator) lives in the
 * electron/ layer and is injected at startup — keeping the backend
 * completely decoupled from Electron APIs.
 */

export interface PrintToPdfOptions {
  /** Page format. Defaults to A4. */
  format?: 'A4' | 'A3' | 'Letter' | 'Legal';
  landscape?: boolean;
  /** Print CSS backgrounds. Should almost always be true for cover pages. */
  printBackground?: boolean;
  /** Margin in centimetres. Defaults to no margin (cover pages fill the page). */
  marginTop?: number;
  marginBottom?: number;
  marginLeft?: number;
  marginRight?: number;
}

export interface PdfGenerator {
  /**
   * Render `html` and return the result as a PDF Buffer.
   *
   * The implementation is responsible for:
   *  - Rendering the HTML in an isolated context
   *  - Waiting until all content (fonts, images) has loaded
   *  - Returning the raw PDF bytes
   *  - Cleaning up any resources it created
   */
  generate(html: string, options?: PrintToPdfOptions): Promise<Buffer>;
}
