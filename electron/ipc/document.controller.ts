import { ipcMain } from 'electron';
import type {
  DocumentProcessor,
  MergeDocumentProcessor,
  RotateDocumentProcessor,
} from '../../backend/application/ports/documents/documentProcessor.js';
import type { DocumentStorage } from '../../backend/application/ports/documents/documentStorage.js';
import type { DocumentRepository } from '../../backend/application/ports/documents/documentRepository.js';
import { CreateFolderUseCase } from '../../backend/application/useCases/document/createFolder.js';
import { DeleteDocumentUseCase } from '../../backend/application/useCases/document/deleteDocument.js';
import { ImportDocumentsUseCase } from '../../backend/application/useCases/document/importDocuments.js';
import { ListBundleDocumentsTreeUseCase } from '../../backend/application/useCases/document/listBundleDocumentsTree.js';
import { MergeDocumentsUseCase } from '../../backend/application/useCases/document/mergeDocuments.js';
import { MoveDocumentUseCase } from '../../backend/application/useCases/document/moveDocument.js';
import { ReorderDocumentsUseCase } from '../../backend/application/useCases/document/reorderDocuments.js';
import { RenameDocumentUseCase } from '../../backend/application/useCases/document/renameDocument.js';
import { RotateDocumentUseCase } from '../../backend/application/useCases/document/rotateDocument.js';

type CreateFolderPayload = {
  bundleId?: string | number;
  name?: string;
  parentId?: string | null;
};

type ImportDocumentPayload = {
  bundleId?: string | number;
  parentId?: string | null;
  files?: Array<{
    name?: string;
    path?: string;
    mimeType?: string | null;
  }>;
};

type RenameDocumentPayload = {
  id?: string | number;
  documentId?: string | number;
  name?: string;
  newName?: string;
};

type DeleteDocumentPayload =
  | string
  | number
  | {
      id?: string | number;
      documentId?: string | number;
    };

type ReorderDocumentsPayload = {
  bundleId?: string | number;
  items?: Array<{
    id?: string | number;
    order?: number;
  }>;
};

type MoveDocumentPayload = {
  id?: string | number;
  documentId?: string | number;
  newParentId?: string | null;
  parentId?: string | null;
};

type RotateDocumentPayload = {
  bundleId?: string;
  documentId?: string;
  pageNumber?: number;
  rotation?: 0 | 90 | 180 | 270;
};

type MergeDocumentsPayload = {
  bundleId?: string | number;
  documentIds?: Array<string | number>;
  name?: string;
  parentId?: string | null;
};

type RegDocIpcControllerType = {
  documentRepository: DocumentRepository;
  documentStorage: DocumentStorage;
  documentProcessor: DocumentProcessor;
  rotateProcessor: RotateDocumentProcessor;
  mergeProcessor: MergeDocumentProcessor;
  buildDocumentUrl: (documentId: string) => string;
};

export function registerDocumentIpc(deps: RegDocIpcControllerType) {
  const importDocuments = new ImportDocumentsUseCase(
    deps.documentRepository,
    deps.documentStorage,
    deps.documentProcessor
  );
  const createFolder = new CreateFolderUseCase(deps.documentRepository);
  const deleteDocument = new DeleteDocumentUseCase(
    deps.documentRepository,
    deps.documentStorage
  );
  const listBundleDocumentsTree = new ListBundleDocumentsTreeUseCase(
    deps.documentRepository
  );
  const moveDocument = new MoveDocumentUseCase(deps.documentRepository);
  const reorderDocuments = new ReorderDocumentsUseCase(deps.documentRepository);
  const renameDocument = new RenameDocumentUseCase(deps.documentRepository);
  const mergeDocuments = new MergeDocumentsUseCase(
    deps.documentRepository,
    deps.documentStorage,
    deps.mergeProcessor
  );

  // Instance of document rotate usecase class
  const rotateDocument = new RotateDocumentUseCase(
    deps.documentRepository,
    deps.documentStorage,
    deps.rotateProcessor
  );
  const buildRevisionedDocumentUrl = (documentId: string) => {
    const baseUrl = deps.buildDocumentUrl(documentId);
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}rev=${Date.now()}`;
  };
  const getTreeWithDocumentUrls = async (bundleId: string) => {
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
  };

  /*---------------------------------
    Document tree fetching handler
  -----------------------------------*/
  ipcMain.handle('document:getTree', async (_, bundleIdInput) => {
    const bundleId =
      typeof bundleIdInput === 'string'
        ? bundleIdInput
        : String(bundleIdInput ?? '');

    return getTreeWithDocumentUrls(bundleId);
  });

  /*-----------------------------
    Document create folder handler
  -------------------------------*/
  ipcMain.handle(
    'document:createFolder',
    async (_, payload: CreateFolderPayload) => {
      const bundleId =
        typeof payload?.bundleId === 'string'
          ? payload.bundleId
          : String(payload?.bundleId ?? '');
      const parentId =
        typeof payload?.parentId === 'string' && payload.parentId.trim()
          ? payload.parentId
          : null;
      const folder = await createFolder.execute({
        bundleId,
        name: typeof payload?.name === 'string' ? payload.name : '',
        parentId,
      });

      return {
        id: folder.id,
        name: folder.name,
        type: folder.type,
        parentId: folder.parentId,
      };
    }
  );

  /*-----------------------------
    Document import IPC handler
  -------------------------------*/
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

  /*-----------------------------
    Document reorder IPC handler
  -------------------------------*/
  ipcMain.handle(
    'document:reorder',
    async (_, payload: ReorderDocumentsPayload) => {
      const bundleId =
        typeof payload?.bundleId === 'string'
          ? payload.bundleId
          : String(payload?.bundleId ?? '');
      const items = Array.isArray(payload?.items) ? payload.items : [];

      await reorderDocuments.execute({
        bundleId,
        items: items.map(item => ({
          id: typeof item?.id === 'string' ? item.id : String(item?.id ?? ''),
          order: typeof item?.order === 'number' ? item.order : Number.NaN,
        })),
      });

      return getTreeWithDocumentUrls(bundleId);
    }
  );

  /*-----------------------------
    Document merge IPC handler
  -------------------------------*/
  ipcMain.handle(
    'document:merge',
    async (_, payload: MergeDocumentsPayload) => {
      const bundleId =
        typeof payload?.bundleId === 'string'
          ? payload.bundleId
          : String(payload?.bundleId ?? '');
      const parentId =
        typeof payload?.parentId === 'string' && payload.parentId.trim()
          ? payload.parentId
          : null;
      const documentIds = Array.isArray(payload?.documentIds)
        ? payload.documentIds.map(documentId => String(documentId ?? ''))
        : [];

      const result = await mergeDocuments.execute({
        bundleId,
        documentIds,
        name: typeof payload?.name === 'string' ? payload.name : '',
        parentId,
      });

      return {
        document: {
          ...result.document,
          url: deps.buildDocumentUrl(result.document.id),
        },
        tree: await getTreeWithDocumentUrls(bundleId),
      };
    }
  );

  /*-----------------------------
    Document move IPC handler
  -------------------------------*/
  ipcMain.handle('document:move', async (_, payload: MoveDocumentPayload) => {
    const documentId = String(payload?.id ?? payload?.documentId ?? '');

    const rawParentId = payload?.newParentId ?? payload?.parentId;
    const newParentId =
      typeof rawParentId === 'string' && rawParentId.trim()
        ? rawParentId
        : null;

    const movedDocument = await moveDocument.execute({
      documentId,
      newParentId,
    });

    return getTreeWithDocumentUrls(movedDocument.bundleId);
  });

  /*-----------------------------
    Document rotate IPC handler
  -------------------------------*/
  ipcMain.handle(
    'document:rotate',
    async (_, payload: RotateDocumentPayload) => {
      const documentId = payload.documentId ?? '';
      const bundleId = payload.bundleId ?? '';
      const pageNumber =
        typeof payload.pageNumber === 'number' ? payload.pageNumber : Number.NaN;
      const rotation = payload.rotation ?? 0;
      await rotateDocument.execute({
        bundleId,
        documentId,
        pageNumber,
        rotation,
      });

      return {
        documentUrl: buildRevisionedDocumentUrl(documentId),
      };
    }
  );

  /*-----------------------------
    Document delete IPC handler
  -------------------------------*/
  ipcMain.handle(
    'document:delete',
    async (_, payload: DeleteDocumentPayload) => {
      const documentId =
        typeof payload === 'object' && payload !== null
          ? (payload.id ?? payload.documentId ?? '')
          : payload;

      await deleteDocument.execute(
        typeof documentId === 'string' ? documentId : String(documentId ?? '')
      );
    }
  );

  /*-----------------------------
    Document rename IPC handler
  -------------------------------*/
  ipcMain.handle(
    'document:rename',
    async (_, payload: RenameDocumentPayload) => {
      const input =
        typeof payload === 'object' && payload !== null ? payload : {};
      const documentId = input.id ?? input.documentId ?? '';
      const name = input.name ?? input.newName;

      return renameDocument.execute({
        id:
          typeof documentId === 'string'
            ? documentId
            : String(documentId ?? ''),
        name: typeof name === 'string' ? name : '',
      });
    }
  );
}
