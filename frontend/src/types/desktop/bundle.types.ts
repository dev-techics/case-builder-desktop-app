// frontend/src/types/desktop/bundle.types.ts

import type { BundleStatus } from '@case-builder/ui';

export type DesktopBundleMetadata = {
  [key: string]: unknown;
};

export type DesktopCreateBundleInput =
  | {
      name: string;
      caseNumber?: string;
      status?: string;
      description?: string;
      tags?: string[];
    }
  | string;

export type DesktopUpdateBundleInput = {
  id: string | number;
  name?: string;
  status?: BundleStatus;
};

export type DesktopExportBundleInput = {
  bundleId: string;
  frontCoverPageId?: string;
  backCoverPageId?: string;
  includeIndex?: boolean;
  compress?: boolean;
  fileName?: string;
};

export type DesktopExportBundleResponse = {
  canceled: boolean;
  outputPath?: string;
  pageCount?: number;
};