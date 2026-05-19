// electron/services/documentToPdfConverter.ts

import { BrowserWindow } from 'electron';
import mammoth from 'mammoth';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import type { DocumentToPdfConverter } from '../../backend/infrastructure/document-processing/conversion/docToPdf.js';

const RENDER_SETTLE_MS = 400;
const PDF_TIMEOUT_MS = 30_000;

const wrapHtml = (body: string) => `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      body {
        font-family: Arial, sans-serif;
        font-size: 12pt;
        line-height: 1.5;
        margin: 0;
        padding: 48px;
        color: #000;
      }
      table { border-collapse: collapse; width: 100%; }
      td, th { border: 1px solid #ccc; padding: 6px; }
      img { max-width: 100%; }
      h1, h2, h3, h4, h5, h6 { margin: 16px 0 8px; }
      p { margin: 0 0 8px; }
    </style>
  </head>
  <body>${body}</body>
</html>
`;

export class ElectronDocumentToPdfConverter implements DocumentToPdfConverter {
  async convert(inputPath: string, outputDirectory: string): Promise<void> {
    const ext = path.extname(inputPath).toLowerCase();

    if (ext !== '.docx' && ext !== '.doc') {
      throw new Error(
        `Unsupported file type "${ext}". Only .doc and .docx are supported.`
      );
    }

    const { value: html, messages } = await mammoth.convertToHtml({
      path: inputPath,
    });

    if (!html?.trim()) {
      const warning = messages.find(m => m.type === 'warning')?.message;
      throw new Error(warning ?? 'Document conversion produced no content.');
    }

    // Write to temp file — avoids data: URL restrictions in Electron
    const tempFile = await this.writeTempFile(wrapHtml(html));

    try {
      const pdfBuffer = await this.renderToPdf(tempFile);
      const outputFileName = path.basename(inputPath, ext) + '.pdf';
      await fs.writeFile(path.join(outputDirectory, outputFileName), pdfBuffer);
    } finally {
      await fs.unlink(tempFile).catch(() => undefined);
    }
  }

  private async writeTempFile(html: string): Promise<string> {
    const fileName = `cb-doc-${Date.now()}-${Math.random().toString(36).slice(2)}.html`;
    const filePath = path.join(os.tmpdir(), fileName);
    await fs.writeFile(filePath, html, 'utf-8');
    return filePath;
  }

  private renderToPdf(htmlFilePath: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      let window: BrowserWindow | null = null;

      const timeout = setTimeout(() => {
        window?.destroy();
        reject(
          new Error(
            `[ElectronDocumentToPdfConverter] Timed out after ${PDF_TIMEOUT_MS}ms`
          )
        );
      }, PDF_TIMEOUT_MS);

      const cleanup = () => {
        clearTimeout(timeout);
        if (window && !window.isDestroyed()) window.destroy();
        window = null;
      };

      try {
        window = new BrowserWindow({
          show: false,
          width: 794,
          height: 1123,
          frame: false,
          skipTaskbar: true,
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: false,
            sandbox: false,
          },
        });

        window.webContents.once('did-finish-load', () => {
          setTimeout(async () => {
            try {
              const data = await window!.webContents.printToPDF({
                printBackground: true,
                landscape: false,
                pageSize: 'A4',
                margins: { marginType: 'default' },
              });
              cleanup();
              resolve(Buffer.from(data));
            } catch (err) {
              cleanup();
              reject(
                new Error(
                  `[ElectronDocumentToPdfConverter] printToPDF failed: ${String(err)}`
                )
              );
            }
          }, RENDER_SETTLE_MS);
        });

        window.webContents.once('did-fail-load', (_e, code, description) => {
          cleanup();
          reject(
            new Error(
              `[ElectronDocumentToPdfConverter] Page failed to load (${code}): ${description}`
            )
          );
        });

        // file:// protocol — works offline, no data: URL restrictions
        window.loadURL(`file://${htmlFilePath}`);
      } catch (err) {
        cleanup();
        reject(err);
      }
    });
  }
}
