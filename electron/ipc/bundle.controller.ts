import { ipcMain } from "electron"

import type { BundleRepository } from "../../backend/application/ports/bundleRepository"
import { CreateBundleUseCase } from "../../backend/application/useCases/createBundle"
import { DeleteBundleUseCase } from "../../backend/application/useCases/deleteBundle"
import { ListBundlesUseCase } from "../../backend/application/useCases/listBundles"

export function registerBundleIpc(deps: { bundleRepository: BundleRepository }) {
  const createBundle = new CreateBundleUseCase(deps.bundleRepository)
  const deleteBundle = new DeleteBundleUseCase(deps.bundleRepository)
  const listBundles = new ListBundlesUseCase(deps.bundleRepository)

  ipcMain.handle("bundle:create", async (_, nameOrInput) => {
    const input =
      typeof nameOrInput === "string" ? { name: nameOrInput } : nameOrInput ?? {}

    const name = input?.name
    const caseNumber = input?.caseNumber ?? input?.case_number ?? "N/A"
    return createBundle.execute({ name, caseNumber })
  })

  ipcMain.handle("bundle:getAll", async () => {
    return listBundles.execute()
  })

  ipcMain.handle("bundle:delete", async (_, id) => {
    const bundleId = typeof id === "string" ? id : String(id ?? "")
    await deleteBundle.execute(bundleId)
  })
}
