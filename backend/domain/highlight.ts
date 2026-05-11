export type HighlightColorRgb = {
  r: number;
  g: number;
  b: number;
};

export interface StoredHighlight {
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
  colorRgb: HighlightColorRgb;
  opacity: number;
  createdAt: string;
  updatedAt: string;
}

export function normalizeHighlightText(text: string): string {
  return text.trim();
}

export function normalizeHighlightColorName(name: string): string {
  return name.trim();
}
