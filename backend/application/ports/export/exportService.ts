export interface ExportService {
  exportBundle(bundleId: string): Promise<void>;
}
