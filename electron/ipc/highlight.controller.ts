import { ipcMain } from 'electron';
import type { DocumentRepository } from '../../backend/application/ports/documents/documentRepository.js';
import type { HighlightRepository } from '../../backend/application/ports/highlights/highlightRepository.js';
import { CreateHighlightUseCase } from '../../backend/application/useCases/highlight/createHighlight.js';
import { DeleteHighlightUseCase } from '../../backend/application/useCases/highlight/deleteHighlight.js';
import { ListBundleHighlightsUseCase } from '../../backend/application/useCases/highlight/listBundleHighlights.js';
import type { StoredHighlight } from '../../backend/domain/highlight.js';

type HighlightPayload = {
  id?: string | number;
};

type ListHighlightsPayload = {
  bundleId?: string | number;
};

type CreateHighlightPayload = {
  bundleId?: string | number;
  data?: {
    document_id?: string | number;
    page_number?: number;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    text?: string;
    color_name?: string;
    color_hex?: string;
    color_rgb?: {
      r?: number;
      g?: number;
      b?: number;
    };
    opacity?: number;
  };
};

const mapHighlight = (highlight: StoredHighlight) => ({
  id: highlight.id,
  bundleId: highlight.bundleId,
  documentId: highlight.documentId,
  pageNumber: highlight.pageNumber,
  x: highlight.x,
  y: highlight.y,
  width: highlight.width,
  height: highlight.height,
  text: highlight.text,
  colorName: highlight.colorName,
  colorHex: highlight.colorHex,
  colorRgb: highlight.colorRgb,
  opacity: highlight.opacity,
  createdAt: highlight.createdAt,
  updatedAt: highlight.updatedAt,
});

export function registerHighlightIpc(deps: {
  documentRepository: DocumentRepository;
  highlightRepository: HighlightRepository;
}) {
  const createHighlight = new CreateHighlightUseCase(
    deps.documentRepository,
    deps.highlightRepository
  );
  const listBundleHighlights = new ListBundleHighlightsUseCase(
    deps.documentRepository,
    deps.highlightRepository
  );
  const deleteHighlight = new DeleteHighlightUseCase(deps.highlightRepository);

  ipcMain.handle(
    'highlight:listByBundle',
    async (_, payload: string | number | ListHighlightsPayload) => {
      const bundleId =
        typeof payload === 'object' && payload !== null
          ? String(payload.bundleId ?? '')
          : String(payload ?? '');

      const highlights = await listBundleHighlights.execute(bundleId);
      return highlights.map(mapHighlight);
    }
  );

  ipcMain.handle(
    'highlight:create',
    async (_, payload: CreateHighlightPayload) => {
      const data = payload?.data ?? {};
      const highlight = await createHighlight.execute({
        bundleId: String(payload?.bundleId ?? ''),
        documentId: String(data.document_id ?? ''),
        pageNumber:
          typeof data.page_number === 'number' ? data.page_number : Number.NaN,
        x: typeof data.x === 'number' ? data.x : Number.NaN,
        y: typeof data.y === 'number' ? data.y : Number.NaN,
        width: typeof data.width === 'number' ? data.width : Number.NaN,
        height: typeof data.height === 'number' ? data.height : Number.NaN,
        text: typeof data.text === 'string' ? data.text : '',
        colorName: typeof data.color_name === 'string' ? data.color_name : '',
        colorHex: typeof data.color_hex === 'string' ? data.color_hex : '',
        colorRgb: {
          r:
            typeof data.color_rgb?.r === 'number'
              ? data.color_rgb.r
              : Number.NaN,
          g:
            typeof data.color_rgb?.g === 'number'
              ? data.color_rgb.g
              : Number.NaN,
          b:
            typeof data.color_rgb?.b === 'number'
              ? data.color_rgb.b
              : Number.NaN,
        },
        opacity:
          typeof data.opacity === 'number' ? data.opacity : Number.NaN,
      });

      return mapHighlight(highlight);
    }
  );

  ipcMain.handle(
    'highlight:delete',
    async (_, payload: string | number | HighlightPayload) => {
      const highlightId =
        typeof payload === 'object' && payload !== null
          ? String(payload.id ?? '')
          : String(payload ?? '');
      const deletedHighlight = await deleteHighlight.execute(highlightId);

      return {
        id: deletedHighlight.id,
      };
    }
  );
}
