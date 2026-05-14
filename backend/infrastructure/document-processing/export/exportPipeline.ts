import { ExportContext } from './exportContext.js';

export class ExportPipeline {
  constructor(private steps: ExportStep[]) {}

  async run(ctx: ExportContext) {
    for (const step of this.steps) {
      ctx.currentStep = step.name;
      await step(ctx);
    }
  }
}
