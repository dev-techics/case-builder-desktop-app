/**
 * backend/infrastructure/document-processing/coverpage/htmlToPdfService.ts
 *
 * A thin, reusable service that converts arbitrary HTML to a PDF Buffer.
 *
 * Design intent:
 *   - Depends only on the `PdfGenerator` port — not on Electron directly.
 *   - Can be used by CoverPageGenerator today and by any future feature
 *     that needs HTML → PDF (e.g. a report renderer).
 *   - Adds one layer of pre-processing: it injects a <base> tag so that
 *     relative URLs in the HTML resolve against the app's storage directory,
 *     making local fonts and images work without an internet connection.
 */

import path from 'node:path';
import type {
  PdfGenerator,
  PrintToPdfOptions,
} from '../../../application/ports/pdf-generator/pdfGenerator.js';

export class HtmlToPdfService {
  constructor(
    private readonly generator: PdfGenerator,
    /**
     * Absolute path to the directory that assets in the HTML are
     * relative to (e.g. the bundle's storage folder).
     * If omitted, relative URLs are left as-is.
     */
    private readonly assetBaseDir?: string
  ) {}

  async convert(html: string, options?: PrintToPdfOptions): Promise<Buffer> {
    const prepared = this.prepareHtml(html);
    return this.generator.generate(prepared, options);
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  /**
   * Inject a `<base>` tag so every relative URL in the HTML is resolved
   * against `assetBaseDir`. This is critical for offline rendering:
   * images and fonts referenced as `src="logo.png"` will load from disk
   * rather than failing with a net::ERR_FILE_NOT_FOUND.
   *
   * We also ensure the document has a valid <head> block to attach it to.
   */
  private prepareHtml(html: string): string {
    if (!this.assetBaseDir) return html;

    // Normalise to a file:// URL with a trailing slash (required by <base>)
    const baseUrl = `file://${path.normalize(this.assetBaseDir)}/`.replace(
      /\\/g,
      '/'
    );
    const baseTag = `<base href="${baseUrl}">`;

    if (/<head[^>]*>/i.test(html)) {
      // Insert right after <head ...> so it takes precedence over everything
      return html.replace(/(<head[^>]*>)/i, `$1\n  ${baseTag}`);
    }

    if (/<html[^>]*>/i.test(html)) {
      return html.replace(
        /(<html[^>]*>)/i,
        `$1\n<head>\n  ${baseTag}\n</head>`
      );
    }

    // Bare HTML fragment — wrap it
    return `<!DOCTYPE html>\n<head>\n  ${baseTag}\n</head>\n<body>\n${html}\n</body>`;
  }
}
