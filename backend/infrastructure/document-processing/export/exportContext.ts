export type ExportContext = {
  bundleId: string;
  options: ExportOptions;

  // working data
  documents: DocumentNode[];
  totalPages: number;

  // pdf state
  pdfDoc?: PDFDocument;

  // output
  outputPath?: string;

  // progress
  currentStep?: string;
  progress: number;

  // temp
  tempFiles: string[];
};
