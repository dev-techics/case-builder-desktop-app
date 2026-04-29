import type { Bundle, BundleStatus } from '../../domain/bundle.js';

export type BundleUpdates = {
  name?: string;
  status?: BundleStatus;
};

export interface BundleRepository {
  create(bundle: Bundle): Promise<void>;
  delete(id: string): Promise<void>;
  list(): Promise<Bundle[]>;
  update(id: string, updates: BundleUpdates): Promise<Bundle>;
}
