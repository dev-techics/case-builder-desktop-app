export interface ExportBundleRequest {
  bundleId: string;
  outputPath: string;
  includeCover?: boolean;
  includeFrontCover?: boolean;
  includeBackCover?: boolean;
  includeIndex?: boolean;
  compress?: boolean;
}

export interface ExportBundleResult {
  outputPath: string;
  pageCount: number;
}

export interface ExportService {
  exportBundle(input: ExportBundleRequest): Promise<ExportBundleResult>;
}
