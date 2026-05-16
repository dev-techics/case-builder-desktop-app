import { app, dialog, ipcMain } from 'electron';
import path from 'node:path';

import type { BundleRepository } from '../../backend/application/ports/bundles/bundleRepository.js';
import type { DocumentStorage } from '../../backend/application/ports/documents/documentStorage.js';
import type { ExportService } from '../../backend/application/ports/export/exportService.js';
import { CreateBundleUseCase } from '../../backend/application/useCases/bundle/createBundle.js';
import { DeleteBundleUseCase } from '../../backend/application/useCases/bundle/deleteBundle.js';
import { GetBundleMetadataUseCase } from '../../backend/application/useCases/bundle/getBundleMetadata.js';
import { ListBundlesUseCase } from '../../backend/application/useCases/bundle/listBundles.js';
import { UpdateBundleUseCase } from '../../backend/application/useCases/bundle/updateBundle.js';
import { UpdateBundleMetadataUseCase } from '../../backend/application/useCases/bundle/updateBundleMetadata.js';
import { ExportBundleUseCase } from '../../backend/application/useCases/export/exportBundle.js';

type BundleMetadataPayload = {
  headerLeft?: unknown;
  headerRight?: unknown;
  header_left?: unknown;
  header_right?: unknown;
  footer?: unknown;
};

type BundleExportPayload =
  | string
  | number
  | {
      id?: unknown;
      bundleId?: unknown;
      includeCover?: unknown;
      include_cover?: unknown;
      includeFrontCover?: unknown;
      include_front_cover?: unknown;
      includeBackCover?: unknown;
      include_back_cover?: unknown;
      includeIndex?: unknown;
      include_index?: unknown;
      compress?: unknown;
      compressionProfile?: unknown;
      compression_profile?: unknown;
      fileName?: unknown;
      file_name?: unknown;
    };

export function registerBundleIpc(deps: {
  bundleRepository: BundleRepository;
  documentStorage: DocumentStorage;
  exportService?: ExportService;
}) {
  const createBundle = new CreateBundleUseCase(deps.bundleRepository);
  const deleteBundle = new DeleteBundleUseCase(
    deps.bundleRepository,
    deps.documentStorage
  );
  const getBundleMetadata = new GetBundleMetadataUseCase(deps.bundleRepository);
  const listBundles = new ListBundlesUseCase(deps.bundleRepository);
  const updateBundle = new UpdateBundleUseCase(deps.bundleRepository);
  const updateBundleMetadata = new UpdateBundleMetadataUseCase(
    deps.bundleRepository
  );
  const exportBundle = deps.exportService
    ? new ExportBundleUseCase(deps.exportService)
    : null;

  /*--------------------------
    createBundle IPC Handler:
  ----------------------------*/
  ipcMain.handle('bundle:create', async (_, nameOrInput) => {
    const input =
      typeof nameOrInput === 'string'
        ? { name: nameOrInput }
        : (nameOrInput ?? {});

    const name = input?.name;
    const caseNumber = input?.caseNumber ?? input?.case_number ?? 'N/A';
    const status = input?.status;
    const description = input?.description;
    const tags = input?.tags;

    return createBundle.execute({
      name,
      caseNumber,
      status,
      description,
      tags,
    });
  });

  /*--------------------------
    listBundles IPC Handler:
  ----------------------------*/
  ipcMain.handle('bundle:getAll', async () => {
    return listBundles.execute();
  });

  ipcMain.handle('bundle:getMetadata', async (_, bundleIdInput) => {
    return getBundleMetadata.execute(toBundleId(bundleIdInput));
  });
  /*---------------------------
     update bundle ipc handler
  -----------------------------*/
  ipcMain.handle('bundle:update', async (_, updateInput) => {
    const input =
      typeof updateInput === 'object' && updateInput !== null
        ? updateInput
        : {};
    const bundleId = input?.id ?? input?.bundleId ?? '';
    const name = input?.name;
    const status = input?.status;

    return updateBundle.execute({
      id: typeof bundleId === 'string' ? bundleId : String(bundleId ?? ''),
      name,
      status,
    });
  });

  /*-----------------------------
    Save & update bundle metadata
  -------------------------------*/
  ipcMain.handle('bundle:updateMetadata', async (_, metadataInput) => {
    const input =
      typeof metadataInput === 'object' && metadataInput !== null
        ? metadataInput
        : {};
    const bundleId = input?.bundleId ?? input?.id ?? '';
    const metadataPayload = toMetadataPayload(input?.metadata);

    return updateBundleMetadata.execute({
      bundleId: toBundleId(bundleId),
      metadata: {
        headerLeft: metadataPayload.headerLeft ?? metadataPayload.header_left,
        headerRight:
          metadataPayload.headerRight ?? metadataPayload.header_right,
        footer: metadataPayload.footer,
      },
    });
  });
  /*--------------------------
    deleteBundle IPC Handler:
  ----------------------------*/

  ipcMain.handle('bundle:delete', async (_, id) => {
    const bundleId = typeof id === 'string' ? id : String(id ?? '');
    await deleteBundle.execute(bundleId);
  });

  /*-----------------------
    Export bundle handler
  -------------------------*/
  ipcMain.handle('bundle:export', async (_, exportInput: BundleExportPayload) => {
    const input = normalizeExportPayload(exportInput);

    if (!exportBundle) {
      throw new Error('Export service is not configured.');
    }

    const saveResult = await dialog.showSaveDialog({
      title: 'Export Bundle',
      defaultPath: path.join(
        app.getPath('downloads'),
        ensurePdfFileName(input.fileName)
      ),
      filters: [{ name: 'PDF Document', extensions: ['pdf'] }],
      properties: ['createDirectory', 'showOverwriteConfirmation'],
    });

    if (saveResult.canceled || !saveResult.filePath) {
      return { canceled: true };
    }

    const result = await exportBundle.execute({
      bundleId: input.bundleId,
      outputPath: saveResult.filePath,
      includeCover: input.includeCover,
      includeFrontCover: input.includeFrontCover,
      includeBackCover: input.includeBackCover,
      includeIndex: input.includeIndex,
      compress: input.compress,
    });

    return {
      canceled: false,
      ...result,
    };
  });
}

function toBundleId(value: unknown): string {
  return typeof value === 'string' ? value : String(value ?? '');
}

function toMetadataPayload(value: unknown): BundleMetadataPayload {
  return typeof value === 'object' && value !== null ? value : {};
}

function normalizeExportPayload(input: BundleExportPayload) {
  if (typeof input === 'string' || typeof input === 'number') {
    return {
      bundleId: String(input),
      includeCover: false,
      includeFrontCover: false,
      includeBackCover: false,
      includeIndex: true,
      compress: false,
      fileName: 'Bundle.pdf',
    };
  }

  const payload = typeof input === 'object' && input !== null ? input : {};
  const compressionProfile =
    payload.compressionProfile ?? payload.compression_profile;
  const rawFrontCover = payload.includeFrontCover ?? payload.include_front_cover;

  return {
    bundleId: toBundleId(payload.bundleId ?? payload.id),
    includeCover: toBoolean(payload.includeCover ?? payload.include_cover),
    includeFrontCover:
      rawFrontCover === undefined ? undefined : toBoolean(rawFrontCover),
    includeBackCover: toBoolean(
      payload.includeBackCover ?? payload.include_back_cover
    ),
    includeIndex: toBoolean(
      payload.includeIndex ?? payload.include_index,
      true
    ),
    compress: toBoolean(
      payload.compress ??
        (compressionProfile === undefined ? undefined : compressionProfile !== 'none')
    ),
    fileName: toFileName(payload.fileName ?? payload.file_name),
  };
}

function toBoolean(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function toFileName(value: unknown): string {
  return typeof value === 'string' && value.trim() ? value.trim() : 'Bundle.pdf';
}

function ensurePdfFileName(value: string): string {
  const sanitized = value
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[. ]+$/g, '');
  const fileName = sanitized || 'Bundle';
  return /\.pdf$/i.test(fileName) ? fileName : `${fileName}.pdf`;
}
