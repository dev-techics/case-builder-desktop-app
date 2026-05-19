// backend/infrastructure/document-processing/conversion/docToPdf.ts

// Interface is kept here so the backend layer stays decoupled from Electron.
// The concrete implementation is ElectronDocumentToPdfConverter in
// electron/services/documentToPdfConverter.ts
export interface DocumentToPdfConverter {
  convert(inputPath: string, outputDirectory: string): Promise<void>;
}
