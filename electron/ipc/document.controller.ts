import { ipcMain } from 'electron';
import type { DocumentImportPreprocessor } from '../../backend/application/ports/documentImportPreprocessor.js';
import type { DocumentStorage } from '../../backend/application/ports/documentStorage.js';
import type { DocumentRepository } from '../../backend/application/ports/documentRepository.js';
import { ImportDocumentsUseCase } from '../../backend/application/useCases/importDocuments.js';
import { ListBundleDocumentsTreeUseCase } from '../../backend/application/useCases/listBundleDocumentsTree.js';

type ImportDocumentPayload = {
  bundleId?: string | number;
  parentId?: string | null;
  files?: Array<{
    name?: string;
    path?: string;
    mimeType?: string | null;
  }>;
};

export function registerDocumentIpc(deps: {
  documentRepository: DocumentRepository;
  documentStorage: DocumentStorage;
  documentImportPreprocessor?: DocumentImportPreprocessor;
  buildDocumentUrl: (documentId: string) => string;
}) {
  const importDocuments = new ImportDocumentsUseCase(
    deps.documentRepository,
    deps.documentStorage,
    deps.documentImportPreprocessor
  );
  const listBundleDocumentsTree = new ListBundleDocumentsTreeUseCase(
    deps.documentRepository
  );

  ipcMain.handle('document:getTree', async (_, bundleIdInput) => {
    const bundleId =
      typeof bundleIdInput === 'string'
        ? bundleIdInput
        : String(bundleIdInput ?? '');
    const tree = await listBundleDocumentsTree.execute(bundleId);

    return {
      ...tree,
      nodes: Object.fromEntries(
        Object.entries(tree.nodes).map(([nodeId, node]) => [
          nodeId,
          node.type === 'file'
            ? {
                ...node,
                url: deps.buildDocumentUrl(node.id),
              }
            : node,
        ])
      ),
    };
  });

  ipcMain.handle(
    'document:import',
    async (_, payload: ImportDocumentPayload) => {
      const bundleId =
        typeof payload?.bundleId === 'string'
          ? payload.bundleId
          : String(payload?.bundleId ?? '');
      const parentId =
        typeof payload?.parentId === 'string' && payload.parentId.trim()
          ? payload.parentId
          : null;
      const files = Array.isArray(payload?.files) ? payload.files : [];

      const result = await importDocuments.execute({
        bundleId,
        parentId,
        files: files.map(file => ({
          name: typeof file?.name === 'string' ? file.name : '',
          path: typeof file?.path === 'string' ? file.path : '',
          mimeType: file?.mimeType ?? null,
        })),
      });

      return {
        documents: result.documents.map(document => ({
          ...document,
          url: deps.buildDocumentUrl(document.id),
        })),
        conversionStatuses: result.conversionStatuses,
      };
    }
  );
}
