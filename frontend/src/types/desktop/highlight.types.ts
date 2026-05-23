// frontend/src/types/desktop/highlight.types.ts

import type { CreateHighlightRequest } from '@/features/toolbar/types/types';

export type DesktopHighlightRecord = {
  id: string;
  bundleId: string;
  documentId: string;
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  colorName: string;
  colorHex: string;
  colorRgb: { r: number; g: number; b: number };
  opacity: number;
  createdAt: string;
  updatedAt: string;
};

export type DesktopCreateHighlightInput = {
  bundleId: string | number;
  data: CreateHighlightRequest;
};

export type DesktopDeleteHighlightInput = {
  id: string | number;
};

export type { CreateHighlightRequest };