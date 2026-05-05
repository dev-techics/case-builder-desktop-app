import { ipcMain } from 'electron';

import type { BundleRepository } from '../../backend/application/ports/bundleRepository.js';
import type { DocumentStorage } from '../../backend/application/ports/documentStorage.js';
import { CreateBundleUseCase } from '../../backend/application/useCases/createBundle.js';
import { DeleteBundleUseCase } from '../../backend/application/useCases/deleteBundle.js';
import { ListBundlesUseCase } from '../../backend/application/useCases/listBundles.js';
import { UpdateBundleUseCase } from '../../backend/application/useCases/updateBundle.js';

export function registerBundleIpc(deps: {
  bundleRepository: BundleRepository;
  documentStorage: DocumentStorage;
}) {
  const createBundle = new CreateBundleUseCase(deps.bundleRepository);
  const deleteBundle = new DeleteBundleUseCase(
    deps.bundleRepository,
    deps.documentStorage
  );
  const listBundles = new ListBundlesUseCase(deps.bundleRepository);
  const updateBundle = new UpdateBundleUseCase(deps.bundleRepository);

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
  /*--------------------------
    deleteBundle IPC Handler:
  ----------------------------*/

  ipcMain.handle('bundle:delete', async (_, id) => {
    const bundleId = typeof id === 'string' ? id : String(id ?? '');
    await deleteBundle.execute(bundleId);
  });
}
