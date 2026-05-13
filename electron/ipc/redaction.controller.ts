import { ipcMain } from 'electron';
import type { DocumentRepository } from '../../backend/application/ports/documents/documentRepository.js';
import type { RedactionRepository } from '../../backend/application/ports/redactions/redactionRepository.js';
import { CreateRedactionUseCase } from '../../backend/application/useCases/redaction/createRedact.js';
import { DeleteRedactionUseCase } from '../../backend/application/useCases/redaction/deleteRedact.js';
import { ListBundleRedactionsUseCase } from '../../backend/application/useCases/redaction/listBundleRedacts.js';
import type { StoredRedaction } from '../../backend/domain/redaction.js';

// ─── Payload Types ────────────────────────────────────────────────────────────

type RedactionPayload = {
  id?: string | number;
};

type ListRedactionsPayload = {
  bundleId?: string | number;
};

type CreateRedactionPayload = {
  bundleId?: string | number;
  data?: {
    document_id?: string | number;
    page_number?: number;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    name?: string;
    fill_hex?: string;
    opacity?: number;
    border_hex?: string;
    border_width?: number;
  };
};

// ─── Response Mapper ──────────────────────────────────────────────────────────

const mapRedaction = (redaction: StoredRedaction) => ({
  id: redaction.id,
  bundleId: redaction.bundleId,
  documentId: redaction.documentId,
  pageNumber: redaction.pageNumber,
  x: redaction.x,
  y: redaction.y,
  width: redaction.width,
  height: redaction.height,
  name: redaction.name,
  fillHex: redaction.fillHex,
  opacity: redaction.opacity,
  borderHex: redaction.borderHex,
  borderWidth: redaction.borderWidth,
  createdAt: redaction.createdAt,
  updatedAt: redaction.updatedAt,
});

// ─── IPC Registration ─────────────────────────────────────────────────────────

export function registerRedactionIpc(deps: {
  documentRepository: DocumentRepository;
  redactionRepository: RedactionRepository;
}) {
  const createRedaction = new CreateRedactionUseCase(
    deps.documentRepository,
    deps.redactionRepository
  );
  const listBundleRedactions = new ListBundleRedactionsUseCase(
    deps.documentRepository,
    deps.redactionRepository
  );
  const deleteRedaction = new DeleteRedactionUseCase(deps.redactionRepository);

  ipcMain.handle(
    'redaction:listByBundle',
    async (_, payload: string | number | ListRedactionsPayload) => {
      const bundleId =
        typeof payload === 'object' && payload !== null
          ? String(payload.bundleId ?? '')
          : String(payload ?? '');

      const redactions = await listBundleRedactions.execute(bundleId);
      return redactions.map(mapRedaction);
    }
  );

  ipcMain.handle(
    'redaction:create',
    async (_, payload: CreateRedactionPayload) => {
      const data = payload?.data ?? {};

      const redaction = await createRedaction.execute({
        bundleId: String(payload?.bundleId ?? ''),
        documentId: String(data.document_id ?? ''),
        pageNumber:
          typeof data.page_number === 'number' ? data.page_number : Number.NaN,
        x: typeof data.x === 'number' ? data.x : Number.NaN,
        y: typeof data.y === 'number' ? data.y : Number.NaN,
        width: typeof data.width === 'number' ? data.width : Number.NaN,
        height: typeof data.height === 'number' ? data.height : Number.NaN,
        name: typeof data.name === 'string' ? data.name : '',
        fillHex: typeof data.fill_hex === 'string' ? data.fill_hex : '',
        opacity: typeof data.opacity === 'number' ? data.opacity : Number.NaN,
        borderHex: typeof data.border_hex === 'string' ? data.border_hex : '',
        borderWidth:
          typeof data.border_width === 'number'
            ? data.border_width
            : Number.NaN,
      });

      return mapRedaction(redaction);
    }
  );

  ipcMain.handle(
    'redaction:delete',
    async (_, payload: string | number | RedactionPayload) => {
      const redactionId =
        typeof payload === 'object' && payload !== null
          ? String(payload.id ?? '')
          : String(payload ?? '');

      const deletedRedaction = await deleteRedaction.execute(redactionId);
      return { id: deletedRedaction.id };
    }
  );
}
