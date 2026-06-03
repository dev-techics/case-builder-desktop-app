import { Worker } from 'node:worker_threads';
import type { MergeDocumentProcessor } from '../../../application/ports/documents/documentProcessor.js';

type MergeWorkerMessage =
  | {
      bytes: ArrayBuffer;
    }
  | {
      error: string;
    };

export class DocumentMergeProcessor implements MergeDocumentProcessor {
  async mergePdfs(filePaths: string[]): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
      const worker = new Worker(new URL('./merge.worker.js', import.meta.url), {
        workerData: { filePaths },
      });

      worker.once('message', (message: MergeWorkerMessage) => {
        if ('error' in message) {
          reject(new Error(message.error));
          return;
        }

        resolve(new Uint8Array(message.bytes));
      });

      worker.once('error', reject);
      worker.once('exit', code => {
        if (code !== 0) {
          reject(new Error(`PDF merge worker exited with code ${code}.`));
        }
      });
    });
  }
}
