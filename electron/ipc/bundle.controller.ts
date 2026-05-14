import { ipcMain } from 'electron';

import type { BundleRepository } from '../../backend/application/ports/bundles/bundleRepository.js';
import type { DocumentStorage } from '../../backend/application/ports/documents/documentStorage.js';
import { CreateBundleUseCase } from '../../backend/application/useCases/bundle/createBundle.js';
import { DeleteBundleUseCase } from '../../backend/application/useCases/bundle/deleteBundle.js';
import { GetBundleMetadataUseCase } from '../../backend/application/useCases/bundle/getBundleMetadata.js';
import { ListBundlesUseCase } from '../../backend/application/useCases/bundle/listBundles.js';
import { UpdateBundleUseCase } from '../../backend/application/useCases/bundle/updateBundle.js';
import { UpdateBundleMetadataUseCase } from '../../backend/application/useCases/bundle/updateBundleMetadata.js';

type BundleMetadataPayload = {
  headerLeft?: unknown;
  headerRight?: unknown;
  header_left?: unknown;
  header_right?: unknown;
  footer?: unknown;
};

export function registerBundleIpc(deps: {
  bundleRepository: BundleRepository;
  documentStorage: DocumentStorage;
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
}

function toBundleId(value: unknown): string {
  return typeof value === 'string' ? value : String(value ?? '');
}

function toMetadataPayload(value: unknown): BundleMetadataPayload {
  return typeof value === 'object' && value !== null
    ? (value as BundleMetadataPayload)
    : {};
}
