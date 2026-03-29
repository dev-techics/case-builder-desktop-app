import { ipcMain } from 'electron';

import type { BundleRepository } from '../../backend/application/ports/bundleRepository.js';
import { CreateBundleUseCase } from '../../backend/application/useCases/createBundle.js';
import { DeleteBundleUseCase } from '../../backend/application/useCases/deleteBundle.js';
import { ListBundlesUseCase } from '../../backend/application/useCases/listBundles.js';

export function registerBundleIpc(deps: {
  bundleRepository: BundleRepository;
}) {
  const createBundle = new CreateBundleUseCase(deps.bundleRepository);
  const deleteBundle = new DeleteBundleUseCase(deps.bundleRepository);
  const listBundles = new ListBundlesUseCase(deps.bundleRepository);

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
    const description = input?.description ?? 'No description provided';
    return createBundle.execute({ name, caseNumber, description });
  });

  /*--------------------------
    listBundles IPC Handler:
  ----------------------------*/
  ipcMain.handle('bundle:getAll', async () => {
    return listBundles.execute();
  });

  /*--------------------------
    deleteBundle IPC Handler:
  ----------------------------*/

  ipcMain.handle('bundle:delete', async (_, id) => {
    const bundleId = typeof id === 'string' ? id : String(id ?? '');
    await deleteBundle.execute(bundleId);
  });
}
