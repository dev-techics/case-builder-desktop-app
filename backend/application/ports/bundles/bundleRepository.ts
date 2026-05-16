import type {
  Bundle,
  BundleMetadata,
  BundleStatus,
} from '../../../domain/bundle.js';

export type BundleUpdates = {
  name?: string;
  status?: BundleStatus;
};

export interface BundleRepository {
  create(bundle: Bundle): Promise<void>;
  delete(id: string): Promise<void>;
  getById(id: string): Promise<Bundle | null>;
  getMetadata(id: string): Promise<BundleMetadata>;
  list(): Promise<Bundle[]>;
  update(id: string, updates: BundleUpdates): Promise<Bundle>;
  updateMetadata(
    id: string,
    metadata: BundleMetadata
  ): Promise<BundleMetadata>;
}
