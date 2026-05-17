import type { ExportContext } from './context/ExportContext.js';
import { prepareMetadata } from './steps/prepareMetadata.js';
import { generateCover } from './steps/generateCover.js';
import { generateIndex } from './steps/generateIndex.js';
import { assembleDocuments } from './steps/assembleDocuments.js';
import { applyAnnotations } from './steps/applyAnnotations.js';
import { applyPageDecorations } from './steps/applyPageDecorations.js';
import { injectIndexLinks } from './steps/injectIndexLinks.js';
import { saveOutput } from './steps/saveOutput.js';

type Step = (ctx: ExportContext) => Promise<void>;

/**
 * Runs the export steps sequentially.
 *
 * Design notes:
 * - Steps are plain async functions; the pipeline is just an orchestrator.
 * - Optional steps are included only when the relevant option is enabled.
 * - Any step that throws will abort the pipeline. The caller is responsible
 *   for user-facing error handling (e.g. showing a toast, logging to a queue).
 *
 * Example:
 *   const ctx = createExportContext(bundle, options, onProgress);
 *   const pipeline = new ExportPipeline();
 *   await pipeline.run(ctx);
 *   console.log('Saved to', ctx.outputPath);
 */
export class ExportPipeline {
  async run(ctx: ExportContext): Promise<void> {
    const steps = this.buildSteps(ctx);

    try {
      for (const step of steps) {
        await step(ctx);
      }

      ctx.currentStep = 'done';
      ctx.onProgress?.({
        step: 'done',
        progress: 100,
        message: 'Export complete',
      });
    } catch (error) {
      ctx.currentStep = 'error';
      throw error; // re-throw so the caller (queue, IPC handler, etc.) can react
    }
  }

  /**
   * Build the ordered list of steps from the export options.
   * Evaluated once at the start of run() — options do not change mid-pipeline.
   */
  private buildSteps(ctx: ExportContext): Step[] {
    const { options } = ctx;

    return [
      prepareMetadata,
      ...(options.frontCoverPageId ? [generateCover] : []),
      ...(options.backCoverPageId ? [generateCover] : []),
      ...(options.includeIndex ? [generateIndex] : []),
      assembleDocuments,
      ...(options.applyAnnotations ? [applyAnnotations] : []),
      ...(options.applyPageDecorations ? [applyPageDecorations] : []),
      // injectIndexLinks requires the index to exist
      ...(options.injectIndexLinks && options.includeIndex
        ? [injectIndexLinks]
        : []),
      saveOutput,
    ];
  }
}
