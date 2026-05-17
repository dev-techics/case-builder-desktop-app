/**
 * electron/services/electronPdfGenerator.ts
 *
 * Concrete implementation of the PdfGenerator port using Electron's
 * built-in Chromium rendering engine.
 *
 * Why a hidden BrowserWindow?
 *   - No external dependencies (no Puppeteer, no Docker, no network)
 *   - Uses the same Chromium version already bundled with the app
 *   - Supports CSS, web fonts loaded from local files, and JavaScript
 *
 * Life cycle for every call to generate():
 *   1. Write HTML to a temp file (avoids data: URL length limits)
 *   2. Open a hidden, off-screen BrowserWindow
 *   3. Load the temp file via file:// protocol
 *   4. Wait for `did-finish-load` + a short stabilisation delay
 *      (gives web fonts / layout a chance to settle)
 *   5. Call webContents.printToPDF()
 *   6. Delete the temp file and destroy the window
 *   7. Return the Buffer to the caller
 */

import { BrowserWindow } from 'electron';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import type {
  PdfGenerator,
  PrintToPdfOptions,
} from '../../backend/application/ports/pdf-generator/pdfGenerator.js';

// ── Tuning constants ──────────────────────────────────────────────────────────

/** Extra time (ms) to wait after did-finish-load for fonts/images to render */
const RENDER_SETTLE_MS = 400;

/** Fail the whole operation if PDF generation takes longer than this */
const PDF_TIMEOUT_MS = 30_000;

// ── Implementation ────────────────────────────────────────────────────────────

export class ElectronPdfGenerator implements PdfGenerator {
  async generate(
    html: string,
    options: PrintToPdfOptions = {}
  ): Promise<Buffer> {
    const tempFile = await this.writeTempFile(html);

    try {
      return await this.renderToPdf(tempFile, options);
    } finally {
      // Always clean up — even if PDF generation threw
      await fs.unlink(tempFile).catch(() => undefined);
    }
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  /** Write HTML to a uniquely-named temp file and return its path. */
  private async writeTempFile(html: string): Promise<string> {
    const fileName = `cb-cover-${Date.now()}-${Math.random().toString(36).slice(2)}.html`;
    const filePath = path.join(os.tmpdir(), fileName);
    await fs.writeFile(filePath, html, 'utf-8');
    return filePath;
  }

  /** Spin up a hidden window, render the file, and return the PDF bytes. */
  private renderToPdf(
    htmlFilePath: string,
    options: PrintToPdfOptions
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      let window: BrowserWindow | null = null;

      // Safety net: if anything hangs, reject and clean up
      const timeout = setTimeout(() => {
        window?.destroy();
        reject(
          new Error(
            `[ElectronPdfGenerator] PDF generation timed out after ${PDF_TIMEOUT_MS}ms`
          )
        );
      }, PDF_TIMEOUT_MS);

      const cleanup = () => {
        clearTimeout(timeout);
        if (window && !window.isDestroyed()) {
          window.destroy();
        }
        window = null;
      };

      try {
        window = this.createHiddenWindow();

        window.webContents.once('did-finish-load', () => {
          // Give the renderer a moment to paint fonts and background images
          setTimeout(async () => {
            try {
              const data = await window!.webContents.printToPDF(
                this.buildPrintOptions(options)
              );
              cleanup();
              resolve(Buffer.from(data));
            } catch (err) {
              cleanup();
              reject(
                new Error(
                  `[ElectronPdfGenerator] printToPDF failed: ${String(err)}`
                )
              );
            }
          }, RENDER_SETTLE_MS);
        });

        window.webContents.once(
          'did-fail-load',
          (_event, code, description) => {
            cleanup();
            reject(
              new Error(
                `[ElectronPdfGenerator] Page failed to load (${code}): ${description}`
              )
            );
          }
        );

        // file:// protocol — works offline, supports relative asset paths
        window.loadURL(`file://${htmlFilePath}`);
      } catch (err) {
        cleanup();
        reject(err);
      }
    });
  }

  /** Create a completely invisible, non-interactive BrowserWindow. */
  private createHiddenWindow(): BrowserWindow {
    return new BrowserWindow({
      show: false, // never appears in the taskbar or on screen
      width: 794, // A4 at 96 dpi ≈ 794 px wide (cosmetic only)
      height: 1123, // A4 at 96 dpi ≈ 1123 px tall
      frame: false,
      skipTaskbar: true,
      webPreferences: {
        // No node integration — we only need Chromium rendering
        nodeIntegration: false,
        contextIsolation: true,
        // Allow file:// resources (fonts, images loaded from disk)
        webSecurity: false,
        // Disable JS sandboxing so inline scripts in the cover page work
        sandbox: false,
      },
    });
  }

  /** Map our thin options type to Electron's printToPDF parameter shape. */
  private buildPrintOptions(
    options: PrintToPdfOptions
  ): Electron.PrintToPDFOptions {
    const {
      format = 'A4',
      landscape = false,
      printBackground = true,
      marginTop = 0,
      marginBottom = 0,
      marginLeft = 0,
      marginRight = 0,
    } = options;

    return {
      printBackground,
      landscape,
      pageSize: format,
      margins: {
        marginType: 'custom',
        top: marginTop,
        bottom: marginBottom,
        left: marginLeft,
        right: marginRight,
      },
    };
  }
}
