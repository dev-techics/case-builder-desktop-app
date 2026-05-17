export interface ExportBundleRequest {
  bundleId: string;
  outputPath: string;
  frontCoverPageId?: string;
  backCoverPageId?: string;
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
